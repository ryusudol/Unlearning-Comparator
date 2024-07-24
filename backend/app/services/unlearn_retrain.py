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

async def unlearn_model(model,
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
            print("\nUnlearning cancelled.")
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
    
    print()  # Print a newline at the end of unlearning

    # Save the unlearned model
    if not status.cancel_requested:
        print()  # Print a newline at the end of unlearning

        # Save the unlearned model
        save_dir = 'unlearned_models'
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)
        
        model_filename = f"unlearn_{model_name}_{dataset_name}_{epochs}epochs_{learning_rate}lr.pth"
        model_path = os.path.join(save_dir, model_filename)
        torch.save(model.state_dict(), model_path)
        print(f"Unlearned model saved to {model_path}")

    return model

async def run_unlearning(request, status):
    print(f"Starting unlearning for class {request.forget_class} with {request.epochs} epochs...")
    set_seed(request.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    if torch.backends.mps.is_available():
        device = torch.device("mps")

    train_loader, train_set = get_data_loaders(request.batch_size)
    
    # 잊어야 할 클래스를 제외한 데이터셋 생성
    indices = [i for i, (_, label) in enumerate(train_set) if label != request.forget_class]
    subset = torch.utils.data.Subset(train_set, indices)
    unlearning_loader = torch.utils.data.DataLoader(subset, batch_size=request.batch_size, shuffle=True)

    model = get_resnet18().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=request.learning_rate)

    status.is_unlearning = True
    status.progress = 0
    status.forget_class = request.forget_class
    try:
        model = await unlearn_model(model=model, 
                                    train_loader=unlearning_loader, 
                                    criterion=criterion, 
                                    optimizer=optimizer, 
                                    device=device, 
                                    epochs=request.epochs, 
                                    status=status,
                                    model_name="resnet18_unlearned",
                                    dataset_name=f"CIFAR10_without_class_{request.forget_class}",
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
            umap_embeddings, svg_files = compute_umap_embeddings(activations, labels, forget_class=request.forget_class)
            status.umap_embeddings = umap_embeddings
            status.svg_files = list(svg_files.values())
            print("Unlearning and visualization completed!")
        else:
            print("Unlearning cancelled.")
    finally:
        status.is_unlearning = False
        status.cancel_requested = False