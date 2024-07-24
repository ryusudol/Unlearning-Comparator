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

async def train_model(model,
                      train_loader, 
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

            if i % 10 == 0:  # 제어권 반환
                await asyncio.sleep(0)
                
        
        avg_loss = running_loss / len(train_loader)
        accuracy = 100. * correct / total
        status.current_epoch = epoch + 1
        status.progress = (epoch + 1) / epochs * 100
        status.current_loss = avg_loss
        status.current_accuracy = accuracy
        if avg_loss < status.best_loss:
            status.best_loss = avg_loss
        if accuracy > status.best_accuracy:
            status.best_accuracy = accuracy
        
        elapsed_time = time.time() - status.start_time
        estimated_total_time = elapsed_time / (epoch + 1) * epochs
        status.estimated_time_remaining = max(0, estimated_total_time - elapsed_time)
        
        # Terminal output
        print(f"\rEpoch [{epoch+1}/{epochs}] "
              f"Loss: {avg_loss:.4f} "
              f"Acc: {accuracy:.2f}% "
              f"Best Loss: {status.best_loss:.4f} "
              f"Best Acc: {status.best_accuracy:.2f}% "
              f"Progress: {status.progress:.2f}% "
              f"ETA: {status.estimated_time_remaining:.2f}s", end="")
        sys.stdout.flush()  # Ensure the output is immediately displayed
        
        await asyncio.sleep(0)  # Allow other tasks to run
    
    print()  # Print a newline at the end of training

    # Save the trained model
    if not status.cancel_requested:
        print()  # Print a newline at the end of training

        # Save the trained model
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

    train_loader, train_set = get_data_loaders(request.batch_size)
    model = get_resnet18().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=request.learning_rate)

    status.is_training = True
    status.progress = 0
    try:
        model = await train_model(model=model, 
                                  train_loader=train_loader, 
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
            subset_indices = torch.randperm(len(train_set))[:5000]
            subset_loader = torch.utils.data.DataLoader(
                torch.utils.data.Subset(train_set, subset_indices),
                batch_size=64, shuffle=False)
            
            print("\nComputing and saving UMAP embeddings...")
            activations = get_layer_activations(model, subset_loader, device)
            labels = torch.tensor([train_set.targets[i] for i in subset_indices])
            umap_embeddings, svg_files = await compute_umap_embeddings(activations, labels, status)
            status.umap_embeddings = umap_embeddings
            status.svg_files = list(svg_files.values())
            print("Training and visualization completed!")
        else:
            print("Training cancelled.")
    finally:
        status.is_training = False
        status.cancel_requested = False

async def run_unlearning(request, status):
    # Implement unlearning logic here
    pass