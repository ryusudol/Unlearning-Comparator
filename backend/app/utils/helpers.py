import os
import torch
import numpy as np
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

def set_seed(seed):
    torch.manual_seed(seed)
    np.random.seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)

def get_data_loaders(batch_size, augmentation=True):
    base_transforms = [
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
    ]
    
    train_transform = transforms.Compose(
        ([
            transforms.RandomCrop(32, padding=4),
            transforms.RandomHorizontalFlip(),
        ] if augmentation else []) + base_transforms
    )
    
    test_transform = transforms.Compose(base_transforms)
    
    train_set = datasets.CIFAR10(root='./data', train=True, download=True, transform=train_transform)
    test_set = datasets.CIFAR10(root='./data', train=False, download=True, transform=test_transform)
    print("loaded data")
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True, num_workers=0)
    test_loader = DataLoader(test_set, batch_size=100, shuffle=False, num_workers=0)
    print("loaded loaders")
    return train_loader, test_loader, train_set, test_set

def save_model(
    model, 
    epochs, 
    learning_rate
):
    save_dir = 'unlearned_models'
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    model_filename = f"ResNet18_CIFAR10_{epochs}epochs_{learning_rate}lr.pth"
    model_path = os.path.join(save_dir, model_filename)
    
    torch.save(model.state_dict(), model_path)

def format_distribution(distribution):
    return {
        f"gt_{i}": [round(float(distribution[i][j]), 3) for j in range(10)]
        for i in range(10)
    }

def compress_prob_array(prob_array, threshold=0.001):
    return {str(i): round(p, 3) for i, p in enumerate(prob_array) if p > threshold}