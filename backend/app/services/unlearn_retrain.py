import torch
import torch.nn as nn
import torch.optim as optim
import asyncio
import time
import sys
import os
import matplotlib.pyplot as plt
import copy

from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders, save_model
from app.utils.visualization import compute_umap_embeddings
from app.utils.evaluation import get_layer_activations_and_predictions, evaluate_model
from app.config.settings import UMAP_DATA_SIZE, MOMENTUM, UMAP_DATASET, WEIGHT_DECAY, DECREASING_LR

async def unlearn_retrain_model(model,
                                train_loader,
                                full_train_loader,
                                test_loader,
                                criterion, 
                                optimizer,
                                scheduler,
                                device, 
                                epochs, 
                                status, 
                                model_name, 
                                dataset_name, 
                                learning_rate):
    model.train()
    status.start_time = time.time()
    status.total_epochs = epochs
    
    best_test_acc = 0.0
    best_model = None
    best_epoch = 0

    train_accuracies = []
    test_accuracies = []

    for epoch in range(epochs):
        if status.cancel_requested:
            print("\nUnlearning cancelled.")
            break
        running_loss = 0.0
        
        # Training loop (without forget class)
        for i, data in enumerate(train_loader, 0):
            await asyncio.sleep(0)
            if status.cancel_requested:
                print("\nTraining cancelled mid-batch.")
                break
            inputs, labels = data[0].to(device), data[1].to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
        
        scheduler.step()

        # Evaluate on full training set (including forget class)
        train_loss, train_accuracy, train_class_accuracies = await evaluate_model(model, full_train_loader, criterion, device)
        
        # Evaluate on test set
        test_loss, test_accuracy, test_class_accuracies = await evaluate_model(model, test_loader, criterion, device)
        
        train_accuracies.append(train_accuracy)
        test_accuracies.append(test_accuracy)

        if test_accuracy > best_test_acc:
            best_test_acc = test_accuracy
            best_model = copy.deepcopy(model)
            best_epoch = epoch + 1
            save_model(best_model, 'unlearned_models', model_name, dataset_name, epochs, learning_rate, is_best=True)
            print(f"New best model saved at epoch {best_epoch} with test accuracy {best_test_acc:.2f}%")

        status.current_epoch = epoch + 1
        status.progress = (epoch + 1) / epochs * 100
        status.current_loss = train_loss
        status.current_accuracy = train_accuracy
        status.test_loss = test_loss
        status.test_accuracy = test_accuracy
        status.train_class_accuracies = train_class_accuracies
        status.test_class_accuracies = test_class_accuracies
        
        if test_accuracy > best_test_acc:
            best_test_acc = test_accuracy

        elapsed_time = time.time() - status.start_time
        estimated_total_time = elapsed_time / (epoch + 1) * epochs
        status.estimated_time_remaining = max(0, estimated_total_time - elapsed_time)
        
        current_lr = optimizer.param_groups[0]['lr']

        print(f"\nEpoch [{epoch+1}/{epochs}]")
        print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_accuracy:.2f}%")
        print(f"Test Loss: {test_loss:.4f}, Test Acc: {test_accuracy:.2f}%")
        print(f"Best Test Acc: {best_test_acc:.2f}%")
        print(f"Current LR: {current_lr:.5f}")
        print(f"Best model so far was at epoch {best_epoch} with test accuracy {best_test_acc:.2f}%")
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
        save_dir = 'unlearned_models'
        save_model(model, save_dir, model_name, dataset_name, epochs, learning_rate)

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


async def run_unlearning(request, status):
    print(f"Starting unlearning for class {request.forget_class} with {request.epochs} epochs...")
    set_seed(request.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")

    train_loader, test_loader, train_set, test_set = get_data_loaders(request.batch_size)
    
    # Create dataset excluding the forget class
    indices = [i for i, (_, label) in enumerate(train_set) if label != request.forget_class]
    subset = torch.utils.data.Subset(train_set, indices)
    unlearning_loader = torch.utils.data.DataLoader(subset, batch_size=request.batch_size, shuffle=True)

    model = get_resnet18().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=request.learning_rate, momentum=MOMENTUM, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.MultiStepLR(optimizer, milestones=DECREASING_LR, gamma=0.2)

    status.is_unlearning = True
    status.progress = 0
    status.forget_class = request.forget_class
    try:
        model = await unlearn_retrain_model(model=model, 
                                            train_loader=unlearning_loader,
                                            full_train_loader=train_loader,
                                            test_loader=test_loader,
                                            criterion=criterion, 
                                            optimizer=optimizer,
                                            scheduler=scheduler,
                                            device=device, 
                                            epochs=request.epochs, 
                                            status=status,
                                            model_name="resnet18",
                                            dataset_name=f"CIFAR10_without_class_{request.forget_class}",
                                            learning_rate=request.learning_rate,
                                            )
        
        if not status.cancel_requested:
            if UMAP_DATASET == 'train':
                dataset = train_set
            else:
                dataset = test_set

            subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
            subset = torch.utils.data.Subset(dataset, subset_indices)
            subset_loader = torch.utils.data.DataLoader(
                torch.utils.data.Subset(dataset, subset_indices),
                batch_size=UMAP_DATA_SIZE, shuffle=False)
            
            print("\nComputing and saving UMAP embeddings...")
            activations, predicted_labels = await get_layer_activations_and_predictions(model, subset_loader, device)
            # labels = torch.tensor([dataset.targets[i] for i in subset_indices])
            
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
            print("Unlearning and visualization completed!")
        else:
            print("Unlearning cancelled.")
    finally:
        status.is_unlearning = False
        status.cancel_requested = False