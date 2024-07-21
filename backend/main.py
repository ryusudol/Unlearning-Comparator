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

def train_model(model, train_loader, criterion, optimizer, device, epochs):
    model.train()
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
        status.progress = (epoch + 1) / epochs * 100
        # await asyncio.sleep(0)  # Allow other tasks to run

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

def compute_umap_embeddings(activations):
    umap = UMAP(n_components=2, random_state=42)
    return [umap.fit_transform(act.reshape(act.shape[0], -1)) for act in activations]

async def run_training(request: TrainingRequest):
    set_seed(request.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    train_loader, train_set = get_data_loaders(request.batch_size)
    model = models.resnet18(pretrained=False, num_classes=10).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=request.learning_rate)

    status.is_training = True
    status.progress = 0
    await train_model(model, train_loader, criterion, optimizer, device, request.epochs)

    subset_indices = np.random.choice(len(train_set), 5000, replace=False)
    subset_loader = DataLoader(Subset(train_set, subset_indices), batch_size=64)
    
    activations = get_layer_activations(model, subset_loader, device)
    status.umap_embeddings = compute_umap_embeddings(activations)
    status.is_training = False

@app.post("/train")
async def start_training(request: TrainingRequest, background_tasks: BackgroundTasks):
    if status.is_training:
        return {"message": "Training is already in progress"}
    background_tasks.add_task(run_training, request)
    return {"message": "Training started"}

@app.get("/status")
async def get_status():
    return {
        "is_training": status.is_training,
        "progress": status.progress,
        "umap_embeddings": status.umap_embeddings
    }