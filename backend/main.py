from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, Subset
import numpy as np
from umap import UMAP
import asyncio
import matplotlib.pyplot as plt
import io
from datetime import datetime
from fastapi import Query
from fastapi.responses import JSONResponse, Response
import os
import time
import sys

os.environ['NUMBA_THREADING_LAYER'] = 'workqueue'

app = FastAPI()

class TrainingRequest(BaseModel):
    seed: int
    batch_size: int
    learning_rate: float
    epochs: int

class TrainingStatus:
    def __init__(self):
        self.is_training = False
        self.progress = 0
        self.umap_embeddings = None

status = TrainingStatus()

def set_seed(seed):
    torch.manual_seed(seed)
    np.random.seed(seed)

def get_data_loaders(batch_size):
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])
    train_set = datasets.CIFAR10(root='./data', train=True, download=True, transform=transform)
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True)
    return train_loader, train_set

async def train_model(model, train_loader, criterion, optimizer, device, epochs):
    model.train()
    status.start_time = time.time()
    status.total_epochs = epochs
    
    for epoch in range(epochs):
        running_loss = 0.0
        for i, data in enumerate(train_loader, 0):
            inputs, labels = data[0].to(device), data[1].to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()
        
        avg_loss = running_loss / len(train_loader)
        status.current_epoch = epoch + 1
        status.progress = (epoch + 1) / epochs * 100
        status.current_loss = avg_loss
        if avg_loss < status.best_loss:
            status.best_loss = avg_loss
        
        elapsed_time = time.time() - status.start_time
        estimated_total_time = elapsed_time / (epoch + 1) * epochs
        status.estimated_time_remaining = max(0, estimated_total_time - elapsed_time)
        
        # Terminal output
        print(f"\rEpoch [{epoch+1}/{epochs}] "
              f"Loss: {avg_loss:.4f} "
              f"Best Loss: {status.best_loss:.4f} "
              f"Progress: {status.progress:.2f}% "
              f"ETA: {status.estimated_time_remaining:.2f}s", end="")
        sys.stdout.flush()  # Ensure the output is immediately displayed
        
        await asyncio.sleep(0)  # Allow other tasks to run
    
    print()  # Print a newline at the end of training

def get_layer_activations(model, data_loader, device, num_samples=5000):
    model.eval()
    activations = [[], [], [], []]
    with torch.no_grad():
        for inputs, _ in data_loader:
            inputs = inputs.to(device)
            x = model.conv1(inputs)
            x = model.bn1(x)
            x = model.relu(x)
            x = model.maxpool(x)

            x = model.layer1(x)
            activations[0].append(x.cpu().numpy())

            x = model.layer2(x)
            activations[1].append(x.cpu().numpy())

            x = model.layer3(x)
            activations[2].append(x.cpu().numpy())

            x = model.layer4(x)
            activations[3].append(x.cpu().numpy())

            if sum(len(a) for a in activations[0]) >= num_samples:
                break

    return [np.concatenate(act)[:num_samples] for act in activations]

def compute_umap_embeddings(activations, labels, save_dir='umap_visualizations'):
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    umap_embeddings = {}
    svg_files = {}
    
    # CIFAR-10 클래스 이름
    class_names = ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck']
    
    # tab10 색상 맵 설정
    colors = plt.cm.tab10(np.linspace(0, 1, 10))

    for i, act in enumerate(activations):
        print(f"\rComputing UMAP embedding for layer {i+1}/4...", end="")
        umap = UMAP(n_components=2, random_state=42, n_jobs=1)
        embedding = umap.fit_transform(act.reshape(act.shape[0], -1))
        umap_embeddings[i+1] = embedding
        
        # 시각화
        plt.figure(figsize=(12, 10))
        scatter = plt.scatter(embedding[:, 0], embedding[:, 1], c=labels, cmap='tab10', s=5, alpha=0.7)
        
        # 색상바 대신 개별 클래스에 대한 범례 사용
        legend_elements = [plt.Line2D([0], [0], marker='o', color='w', label=class_names[i], 
                           markerfacecolor=colors[i], markersize=10) for i in range(10)]
        plt.legend(handles=legend_elements, title="Classes", loc='center left', bbox_to_anchor=(1, 0.5))

        plt.title(f'UMAP Embedding for Layer {i+1}')
        plt.xlabel('UMAP 1')
        plt.ylabel('UMAP 2')
        plt.tight_layout()
        
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f'umap_layer_{i+1}_{timestamp}.svg'
        filepath = os.path.join(save_dir, filename)
        
        plt.savefig(filepath, format='svg', dpi=300, bbox_inches='tight')
        plt.close()
        
        with open(filepath, 'rb') as f:
            svg_files[i+1] = f.read()
    
    print("\nUMAP embeddings computation and saving completed!")
    return umap_embeddings, svg_files

async def run_training(request: TrainingRequest):
    print(f"Starting training with {request.epochs} epochs...")
    set_seed(request.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    train_loader, train_set = get_data_loaders(request.batch_size)
    model = models.resnet18(weights=None, num_classes=10).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=request.learning_rate)

    status.is_training = True
    status.progress = 0
    await train_model(model, train_loader, criterion, optimizer, device, request.epochs)

    subset_indices = np.random.choice(len(train_set), 5000, replace=False) # 5000개만 학습
    subset = Subset(train_set, subset_indices)
    subset_loader = DataLoader(subset, batch_size=64)
    
    print("\nComputing and saving UMAP embeddings...")
    activations = get_layer_activations(model, subset_loader, device)
    labels = np.array([train_set.targets[i] for i in subset_indices])
    umap_embeddings, svg_files = compute_umap_embeddings(activations, labels)
    status.umap_embeddings = umap_embeddings
    status.svg_files = svg_files
    status.is_training = False
    print("Training and visualization completed!")

@app.post("/train")
async def start_training(request: TrainingRequest, background_tasks: BackgroundTasks):
    if status.is_training:
        return {"message": "Training is already in progress"}
    background_tasks.add_task(run_training, request)
    return {"message": "Training started"}

class TrainingStatus:
    def __init__(self):
        self.is_training = False
        self.progress = 0
        self.current_epoch = 0
        self.total_epochs = 0
        self.current_loss = 0
        self.best_loss = float('inf')
        self.start_time = None
        self.estimated_time_remaining = None
        self.umap_embeddings = None

status = TrainingStatus()

@app.get("/status")
async def get_status(layer: int = Query(None, description="Layer number (1-4) for UMAP visualization")):
    if status.is_training:
        return JSONResponse({
            "is_training": status.is_training,
            "progress": float(status.progress),
            "current_epoch": int(status.current_epoch),
            "total_epochs": int(status.total_epochs),
            "current_loss": float(status.current_loss),
            "best_loss": float(status.best_loss),
            "estimated_time_remaining": float(status.estimated_time_remaining) if status.estimated_time_remaining is not None else None,
        })
    elif status.svg_files:
        if layer is None:
            return JSONResponse({"message": "Training completed. Specify a layer (1-4) to get UMAP visualization."})
        elif layer in status.svg_files:
            return Response(content=status.svg_files[layer], media_type="image/svg+xml")
        else:
            return JSONResponse({"message": f"Invalid layer number. Choose from 1-4."})
    else:
        return JSONResponse({"message": "Training not started or no results available"})