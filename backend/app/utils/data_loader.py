import os
import pickle
import numpy as np
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

def load_cifar10_data():
    """Load CIFAR-10 training data with automatic download"""
    # Use torchvision's CIFAR10 dataset to handle downloading
    train_set = datasets.CIFAR10(root='./data', train=True, download=True, transform=None)
    
    # Convert to numpy array in the format we need
    x_train = train_set.data  # This is already in (N, 32, 32, 3) format
    y_train = np.array(train_set.targets)
    
    return x_train, y_train

def get_data_loaders(batch_size, augmentation=False):
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
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True, num_workers=0)
    test_loader = DataLoader(test_set, batch_size=100, shuffle=False, num_workers=0)
    print("loaded loaders")
    return train_loader, test_loader, train_set, test_set