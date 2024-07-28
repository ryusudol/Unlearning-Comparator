import torch
import torch.nn as nn
import torch.optim as optim
import asyncio
import time
import sys
import os
import numpy as np
from torch.utils.data import ConcatDataset, Subset
from app.models.neural_network import get_resnet18, UnlearningStatus
from app.utils.helpers import set_seed, get_data_loaders, get_layer_activations
from app.services.visualization import compute_umap_embeddings
from app.config.settings import UMAP_DATA_SIZE

async def evaluate_model(model, data_loader, criterion, device):
    model.eval()
    total_loss = 0
    correct = 0
    total = 0
    class_correct = [0] * 10
    class_total = [0] * 10
    
    with torch.no_grad():
        for data in data_loader:
            images, labels = data[0].to(device), data[1].to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            c = (predicted == labels).squeeze()
            for i in range(len(labels)):
                label = labels[i]
                class_correct[label] += c[i].item()
                class_total[label] += 1
    
    accuracy = 100. * correct / total
    class_accuracies = {i: (100 * class_correct[i] / class_total[i] if class_total[i] > 0 else 0) for i in range(10)}
    
    return total_loss / len(data_loader), accuracy, class_accuracies

async def unlearn_model_RL(model, 
                           forget_loader, 
                           retain_loader, 
                           test_loader, 
                           criterion, 
                           optimizer, 
                           device, 
                           epochs, 
                           status, 
                           model_name, 
                           dataset_name, 
                           learning_rate, 
                           num_classes):
    model.train()
    status.start_time = time.time()
    status.total_epochs = epochs
    
    for epoch in range(epochs):
        if status.cancel_requested:
            print("\nUnlearning cancelled.")
            break
        
        forget_dataset = forget_loader.dataset
        retain_dataset = retain_loader.dataset
        full_dataset = ConcatDataset([forget_dataset, retain_dataset])
        
        new_targets = np.random.randint(0, num_classes, len(forget_dataset.indices))
        for i, idx in enumerate(forget_dataset.indices):
            forget_dataset.dataset.targets[idx] = new_targets[i]
        combined_dataset = ConcatDataset([forget_dataset, retain_dataset])
        
        combined_loader = torch.utils.data.DataLoader(combined_dataset, batch_size=forget_loader.batch_size, shuffle=True)
        full_loader = torch.utils.data.DataLoader(full_dataset, batch_size=forget_loader.batch_size, shuffle=True)
        
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for i, (images, targets) in enumerate(combined_loader):
            if status.cancel_requested:
                break
            
            images, targets = images.to(device), targets.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()
            
            if i % 10 == 0:
                await asyncio.sleep(0)
        
        train_loss = running_loss / len(combined_loader)
        train_accuracy = 100. * correct / total
        
        # Evaluate on training data to get class accuracies
        _, _, train_class_accuracies = await evaluate_model(model, full_loader, criterion, device)
        
        # Evaluate on test data
        test_loss, test_accuracy, test_class_accuracies = await evaluate_model(model, test_loader, criterion, device)
        
        status.current_epoch = epoch + 1
        status.progress = (epoch + 1) / epochs * 100
        status.current_loss = train_loss
        status.current_accuracy = train_accuracy
        status.train_class_accuracies = train_class_accuracies
        status.test_loss = test_loss
        status.test_accuracy = test_accuracy
        status.test_class_accuracies = test_class_accuracies
        
        if train_loss < status.best_loss:
            status.best_loss = train_loss
        if train_accuracy > status.best_accuracy:
            status.best_accuracy = train_accuracy
        if test_accuracy > status.best_test_accuracy:
            status.best_test_accuracy = test_accuracy
        
        elapsed_time = time.time() - status.start_time
        estimated_total_time = elapsed_time / (epoch + 1) * epochs
        status.estimated_time_remaining = max(0, estimated_total_time - elapsed_time)
        
        print(f"\nEpoch [{epoch+1}/{epochs}]")
        print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_accuracy:.2f}%")
        print(f"Test Loss: {test_loss:.4f}, Test Acc: {test_accuracy:.2f}%")
        print(f"Best Train Acc: {status.best_accuracy:.2f}%")
        print(f"Best Test Acc: {status.best_test_accuracy:.2f}%")
        print("Train Class Accuracies:")
        for i, acc in train_class_accuracies.items():
            print(f"  Class {i}: {acc:.2f}%")
        print("Test Class Accuracies:")
        for i, acc in test_class_accuracies.items():
            print(f"  Class {i}: {acc:.2f}%")
        print(f"Progress: {status.progress:.2f}%, ETA: {status.estimated_time_remaining:.2f}s")
        
        sys.stdout.flush()
        await asyncio.sleep(0)
    
    print()  # Print a newline at the end of unlearning

    if not status.cancel_requested:
        save_dir = 'unlearned_models'
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)
        
        model_filename = f"unlearn_RL_{model_name}_{dataset_name}_{epochs}epochs_{learning_rate}lr.pth"
        model_path = os.path.join(save_dir, model_filename)
        torch.save(model.state_dict(), model_path)
        print(f"Unlearned model saved to {model_path}")

    return model

async def run_unlearning_RL(request, status, model_path):
    print(f"Starting RL unlearning for class {request.forget_class} with {request.epochs} epochs...")
    set_seed(request.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    if torch.backends.mps.is_available():
        device = torch.device("mps")

    train_loader, test_loader, train_set = get_data_loaders(request.batch_size)
    
    model = get_resnet18().to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=request.learning_rate)

    forget_indices = [i for i, (_, label) in enumerate(train_set) if label == request.forget_class]
    retain_indices = [i for i, (_, label) in enumerate(train_set) if label != request.forget_class]
    
    forget_subset = Subset(train_set, forget_indices)
    retain_subset = Subset(train_set, retain_indices)
    
    forget_loader = torch.utils.data.DataLoader(forget_subset, batch_size=request.batch_size, shuffle=True)
    retain_loader = torch.utils.data.DataLoader(retain_subset, batch_size=request.batch_size, shuffle=True)

    status.is_unlearning = True
    status.progress = 0
    status.forget_class = request.forget_class

    try:
        model = await unlearn_model_RL(model=model, 
                                       forget_loader=forget_loader,
                                       retain_loader=retain_loader,
                                       test_loader=test_loader,
                                       criterion=criterion, 
                                       optimizer=optimizer, 
                                       device=device, 
                                       epochs=request.epochs, 
                                       status=status,
                                       model_name="resnet18",
                                       dataset_name=f"CIFAR10_RL_forget_class_{request.forget_class}",
                                       learning_rate=request.learning_rate,
                                       num_classes=10)
        
        if not status.cancel_requested:
            subset_indices = torch.randperm(len(train_set))[:UMAP_DATA_SIZE]
            subset_loader = torch.utils.data.DataLoader(
                Subset(train_set, subset_indices),
                batch_size=64, shuffle=False)
            
            print("\nComputing and saving UMAP embeddings...")
            activations = await get_layer_activations(model, subset_loader, device)
            labels = torch.tensor([train_set.targets[i] for i in subset_indices])
            umap_embeddings, svg_files = await compute_umap_embeddings(activations, labels, forget_class=request.forget_class)
            status.umap_embeddings = umap_embeddings
            status.svg_files = list(svg_files.values())
            print("RL Unlearning and visualization completed!")
        else:
            print("RL Unlearning cancelled.")
    finally:
        status.is_unlearning = False
        status.cancel_requested = False
        os.remove(model_path)