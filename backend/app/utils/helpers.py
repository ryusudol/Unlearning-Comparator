import asyncio
import torch
import numpy as np
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from app.models.neural_network import get_resnet18
from app.config.settings import UMAP_DATA_SIZE

def set_seed(seed):
    torch.manual_seed(seed)
    np.random.seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)

def get_data_loaders(batch_size):
    train_transform = transforms.Compose([
        transforms.RandomHorizontalFlip(), 
        transforms.ToTensor(), 
        transforms.Normalize((0.491, 0.482, 0.446), (0.247, 0.243, 0.261))
    ])
    
    test_transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.491, 0.482, 0.446), (0.247, 0.243, 0.261))
    ])
    
    train_set = datasets.CIFAR10(root='./data', train=True, download=True, transform=train_transform)
    test_set = datasets.CIFAR10(root='./data', train=False, download=True, transform=test_transform)
    
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True, num_workers=8)
    test_loader = DataLoader(test_set, batch_size=batch_size, shuffle=False, num_workers=8)
    
    return train_loader, test_loader, train_set

async def get_layer_activations(model, data_loader, device, num_samples=UMAP_DATA_SIZE):
    model.eval()
    activations = [[], [], [], []]
    with torch.no_grad():
        for inputs, _ in data_loader:
            await asyncio.sleep(0)
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

def load_model(model_path, num_classes=10, device='cuda'):
    model = get_resnet18(num_classes=num_classes)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    return model