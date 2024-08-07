import torch
import torch.nn as nn
import torch.optim as optim
import asyncio
import time
import sys
import os
import matplotlib.pyplot as plt
import numpy as np

from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders, save_model
from app.utils.visualization import compute_umap_embeddings
from app.utils.evaluation import get_layer_activations_and_predictions, evaluate_model
from app.config.settings import UMAP_DATA_SIZE, MOMENTUM, UMAP_DATASET, WEIGHT_DECAY, DECREASING_LR, MAX_GRAD_NORM

async def unlearn_GA_model(model,
                           forget_loader,
                           train_loader,
                           test_loader,
                           criterion, 
                           optimizer,
                           scheduler,
                           device, 
                           epochs, 
                           status, 
                           model_name, 
                           dataset_name, 
                           learning_rate,
                           forget_class):
    model.train()
    status.start_time = time.time()
    status.total_epochs = epochs
    
    train_accuracies = []
    test_accuracies = []

    for epoch in range(epochs):
        await asyncio.sleep(0)
        if status.cancel_requested:
            print("\nUnlearning cancelled.")
            break
        running_loss = 0.0
        
        # Training loop with Gradient Ascent for forget class
        for i, (inputs, labels) in enumerate(forget_loader):
            if status.cancel_requested:
                break
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = -criterion(outputs, labels)
            loss.backward()

            torch.nn.utils.clip_grad_norm_(model.parameters(), MAX_GRAD_NORM)

            optimizer.step()

            running_loss += loss.item()
            await asyncio.sleep(0)

        scheduler.step()

        # Evaluate on forget set (training set)
        train_loss, train_accuracy, train_class_accuracies = await evaluate_model(model, train_loader, criterion, device)
        
        # Evaluate on test set
        test_loss, test_accuracy, test_class_accuracies = await evaluate_model(model, test_loader, criterion, device)
        
        train_accuracies.append(train_accuracy)
        test_accuracies.append(test_accuracy)

        # Save current model (last epoch)
        if epoch == epochs - 1:
            save_dir = 'unlearned_models'
            save_model(model, save_dir, model_name, dataset_name, epoch + 1, learning_rate)
            print(f"Model saved after epoch {epoch + 1}")

        # Update status
        status.current_epoch = epoch + 1
        status.progress = (epoch + 1) / epochs * 100
        status.current_loss = train_loss
        status.current_accuracy = train_accuracy
        status.test_loss = test_loss
        status.test_accuracy = test_accuracy
        status.train_class_accuracies = train_class_accuracies
        status.test_class_accuracies = test_class_accuracies
        
        
        elapsed_time = time.time() - status.start_time
        estimated_total_time = elapsed_time / (epoch + 1) * epochs
        status.estimated_time_remaining = max(0, estimated_total_time - elapsed_time)
        
        current_lr = optimizer.param_groups[0]['lr']

        print(f"\nEpoch [{epoch+1}/{epochs}]")
        print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_accuracy:.2f}%")
        print(f"Test Loss: {test_loss:.4f}, Test Acc: {test_accuracy:.2f}%")
        print(f"Current LR: {current_lr}")
        print("Train Class Accuracies:")
        for i, acc in train_class_accuracies.items():
            print(f"  Class {i}: {acc:.2f}%")
        print("Test Class Accuracies:")
        for i, acc in test_class_accuracies.items():
            print(f"  Class {i}: {acc:.2f}%")
        print(f"Progress: {status.progress:.5f}%, ETA: {status.estimated_time_remaining:.2f}s")
        
        sys.stdout.flush()
        
    print()  # Print a newline at the end of unlearning

    if not status.cancel_requested:
        plt.figure(figsize=(10, 6))
        plt.plot(range(1, epochs + 1), train_accuracies, label='Train Accuracy')
        plt.plot(range(1, epochs + 1), test_accuracies, label='Test Accuracy')
        plt.xlabel('Epochs')
        plt.ylabel('Accuracy (%)')
        plt.title(f'Training and Test Accuracy for {model_name} on {dataset_name}')
        plt.legend()
        plt.grid(True)
        plot_filename = f"accuracy_plot_{model_name}_{dataset_name}_{epochs}epochs_{learning_rate}lr.png"
        plot_path = os.path.join(save_dir, plot_filename)
        plt.savefig(plot_path)
        plt.close()
        print(f"Accuracy plot saved to {plot_path}")

    return model

async def run_unlearning_GA(request, status, weights_path):
    print(f"Starting GA unlearning for class {request.forget_class} with {request.epochs} epochs...")
    set_seed(request.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    if torch.backends.mps.is_available():
        device = torch.device("mps")

    train_loader, test_loader, train_set, test_set = get_data_loaders(request.batch_size)

    # Create forget loader
    forget_indices = [i for i, (_, label) in enumerate(train_set) if label == request.forget_class]
    forget_subset = torch.utils.data.Subset(train_set, forget_indices)
    forget_loader = torch.utils.data.DataLoader(forget_subset, batch_size=request.batch_size, shuffle=True)

    model = get_resnet18().to(device)
    model.load_state_dict(torch.load(weights_path, map_location=device))
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=request.learning_rate, momentum=MOMENTUM, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.MultiStepLR(optimizer, milestones=DECREASING_LR, gamma=0.2)

    status.is_unlearning = True
    status.progress = 0
    status.forget_class = request.forget_class
    try:
        model = await unlearn_GA_model(model=model, 
                                       forget_loader=forget_loader,
                                       train_loader=train_loader,
                                       test_loader=test_loader,
                                       criterion=criterion, 
                                       optimizer=optimizer,
                                       scheduler=scheduler,
                                       device=device, 
                                       epochs=request.epochs, 
                                       status=status,
                                       model_name="resnet18",
                                       dataset_name=f"CIFAR10_GA_forget_class_{request.forget_class}",
                                       learning_rate=request.learning_rate,
                                       forget_class=request.forget_class)
        
        if not status.cancel_requested:
            if UMAP_DATASET == 'train':
                dataset = train_set
            else:
                dataset = test_set
            subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
            subset = torch.utils.data.Subset(dataset, subset_indices)
            subset_loader = torch.utils.data.DataLoader(subset, batch_size=256, shuffle=False)
            
            print("\nComputing and saving UMAP embeddings...")
            activations, predicted_labels = await get_layer_activations_and_predictions(model, subset_loader, device)
            
            # Create forget_labels
            forget_labels = torch.tensor([label == request.forget_class for _, label in subset])
            
            umap_embeddings, svg_files = await compute_umap_embeddings(
                activations, 
                predicted_labels, 
                forget_class=request.forget_class,
                forget_labels=forget_labels
            )
            status.umap_embeddings = umap_embeddings
            status.svg_files = list(svg_files.values())
            print("GA Unlearning and visualization completed!")
        else:
            print("GA Unlearning cancelled.")
    finally:
        status.is_unlearning = False
        status.cancel_requested = False