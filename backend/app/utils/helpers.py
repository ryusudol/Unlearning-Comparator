import os
import torch
import numpy as np
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from app.models.neural_network import get_resnet18

def set_seed(seed):
    torch.manual_seed(seed)
    np.random.seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)

def load_model(model_path, num_classes=10, device='cuda'):
    model = get_resnet18(num_classes=num_classes)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    return model

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
    
    return train_loader, test_loader, train_set, test_set

def save_model(model, save_dir, model_name, dataset_name, epochs, learning_rate, is_best=False):
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    prefix = "best_" if is_best else ""
    model_filename = f"{prefix}train_{model_name}_{dataset_name}_{epochs}epochs_{learning_rate}lr.pth"
    model_path = os.path.join(save_dir, model_filename)
    
    torch.save(model.state_dict(), model_path)
    print(f"{'Best ' if is_best else ''}Model saved to {model_path}")