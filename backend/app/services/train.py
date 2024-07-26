import torch
import torch.nn as nn
import torch.optim as optim
import asyncio
import time
import sys
import os
from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders, get_layer_activations
from app.services.visualization import compute_umap_embeddings
from app.config.settings import DATA_SIZE

async def evaluate_model(model, test_loader, criterion, device):
    model.eval()
    test_loss = 0
    correct = 0
    total = 0
    class_correct = [0] * 10
    class_total = [0] * 10
    
    with torch.no_grad():
        for data in test_loader:
            images, labels = data[0].to(device), data[1].to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            test_loss += loss.item()
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
    
    return test_loss / len(test_loader), accuracy, class_accuracies

async def train_model(model,
                      train_loader,
                      test_loader,
                      criterion, 
                      optimizer, 
                      device, 
                      epochs, 
                      status, 
                      model_name, 
                      dataset_name, 
                      learning_rate):
    model.train()
    status.start_time = time.time()
    status.total_epochs = epochs
    
    for epoch in range(epochs):
        if status.cancel_requested:
            print("\nTraining cancelled.")
            break
        running_loss = 0.0
        correct = 0
        total = 0
        class_correct = [0] * 10
        class_total = [0] * 10
        
        for i, data in enumerate(train_loader, 0):
            if status.cancel_requested:
                break
            inputs, labels = data[0].to(device), data[1].to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()
            
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            c = (predicted == labels).squeeze()
            for i in range(labels.size(0)):
                label = labels[i]
                class_correct[label] += c[i].item()
                class_total[label] += 1

            await asyncio.sleep(0)
        
        train_loss = running_loss / len(train_loader)
        train_accuracy = 100. * correct / total
        train_class_accuracies = {i: (100 * class_correct[i] / class_total[i] if class_total[i] > 0 else 0) for i in range(10)}
        
        # Evaluate on test set
        test_loss, test_accuracy, test_class_accuracies = await evaluate_model(model, test_loader, criterion, device)
        
        status.current_epoch = epoch + 1
        status.progress = (epoch + 1) / epochs * 100
        status.current_loss = train_loss
        status.current_accuracy = train_accuracy
        status.test_loss = test_loss
        status.test_accuracy = test_accuracy
        status.train_class_accuracies = train_class_accuracies
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
    
    print()  # Print a newline at the end of training

    if not status.cancel_requested:
        save_dir = 'trained_models'
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)
        
        model_filename = f"train_{model_name}_{dataset_name}_{epochs}epochs_{learning_rate}lr.pth"
        model_path = os.path.join(save_dir, model_filename)
        torch.save(model.state_dict(), model_path)
        print(f"Model saved to {model_path}")

    return model

async def run_training(request, status):
    print(f"Starting training with {request.epochs} epochs...")
    set_seed(request.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    if torch.backends.mps.is_available():
        device = torch.device("mps")

    train_loader, test_loader, train_set = get_data_loaders(request.batch_size)
    model = get_resnet18().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=request.learning_rate)

    status.is_training = True
    status.progress = 0
    try:
        model = await train_model(model=model, 
                                  train_loader=train_loader,
                                  test_loader=test_loader,
                                  criterion=criterion, 
                                  optimizer=optimizer, 
                                  device=device, 
                                  epochs=request.epochs, 
                                  status=status,
                                  model_name="resnet18",
                                  dataset_name="CIFAR10",
                                  learning_rate=request.learning_rate,
                                  )
        
        if not status.cancel_requested:
            subset_indices = torch.randperm(len(train_set))[:DATA_SIZE]
            subset_loader = torch.utils.data.DataLoader(
                torch.utils.data.Subset(train_set, subset_indices),
                batch_size=64, shuffle=False)
            
            print("\nComputing and saving UMAP embeddings...")
            activations = get_layer_activations(model, subset_loader, device)
            labels = torch.tensor([train_set.targets[i] for i in subset_indices])
            umap_embeddings, svg_files = compute_umap_embeddings(activations, labels)
            status.umap_embeddings = umap_embeddings
            status.svg_files = list(svg_files.values())
            print("Training and visualization completed!")
        else:
            print("Training cancelled.")
    finally:
        status.is_training = False
        status.cancel_requested = False