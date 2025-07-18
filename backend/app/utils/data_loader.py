import numpy as np
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from app.config import UNLEARN_SEED
import torch
from PIL import Image
import os

def load_cifar10_data():
    """Load CIFAR-10 training data with automatic download"""
    # Use torchvision's CIFAR10 dataset to handle downloading
    train_set = datasets.CIFAR10(root='./data', train=True, download=True, transform=None)
    
    # Convert to numpy array in the format we need
    x_train = train_set.data  # This is already in (N, 32, 32, 3) format
    y_train = np.array(train_set.targets)
    
    return x_train, y_train

def load_face_data():
    """Load face dataset training data as numpy arrays using ImageFolder"""
    from torchvision import datasets, transforms
    
    train_dir = './data/face/train'
    
    # Use ImageFolder to automatically handle class mapping like in training
    transform = transforms.Compose([
        transforms.Resize((160, 160)),
        transforms.ToTensor()
    ])
    
    dataset = datasets.ImageFolder(root=train_dir, transform=transform)
    
    # Convert to numpy arrays
    x_train = []
    y_train = []
    
    for i in range(len(dataset)):
        image_tensor, label = dataset[i]
        # Convert tensor back to numpy array (H, W, C) format
        image_array = (image_tensor.permute(1, 2, 0).numpy() * 255).astype('uint8')
        x_train.append(image_array)
        y_train.append(label)
    
    x_train = np.array(x_train)
    y_train = np.array(y_train)
    
    return x_train, y_train

def get_cifar10_data_loaders(batch_size, augmentation=False):
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

def get_face_data_loaders(batch_size, train_dir, test_dir, augmentation=False):
    base_transforms = [
        transforms.Resize((160, 160)),
        transforms.ToTensor(),
        transforms.Normalize((0.5,0.5,0.5), (0.5,0.5,0.5))
    ]

    train_transform = transforms.Compose(
        ([
            transforms.RandomHorizontalFlip(),
        ] if augmentation else []) + base_transforms
    )
    test_transform = transforms.Compose(base_transforms)

    train_set = datasets.ImageFolder(root=train_dir, transform=train_transform)
    test_set = datasets.ImageFolder(root=test_dir, transform=test_transform)

    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True, num_workers=4)
    test_loader = DataLoader(test_set, batch_size=batch_size, shuffle=False, num_workers=4)
    
    print("Loaded face data loaders")
    
    return train_loader, test_loader, train_set, test_set

def get_fixed_umap_indices(total_samples=2000, seed=UNLEARN_SEED):
    _, y_train = load_cifar10_data()
    num_classes = 10
    targets_tensor = torch.tensor(y_train)
    
    samples_per_class = total_samples // num_classes
    generator = torch.Generator()
    generator.manual_seed(seed)
    
    indices_dict = {}
    for i in range(num_classes):
        class_indices = (targets_tensor == i).nonzero(as_tuple=False).squeeze()
        perm = torch.randperm(len(class_indices), generator=generator)
        indices_dict[i] = class_indices[perm[:samples_per_class]].tolist()
        
    return indices_dict

def get_fixed_face_umap_indices(total_samples=2000, seed=UNLEARN_SEED):
    """Get fixed indices for face dataset sampling for UMAP visualization"""
    _, y_train = load_face_data()
    num_classes = 10
    targets_tensor = torch.tensor(y_train)
    
    samples_per_class = total_samples // num_classes
    generator = torch.Generator()
    generator.manual_seed(seed)
    
    indices_dict = {}
    for i in range(num_classes):
        class_indices = (targets_tensor == i).nonzero(as_tuple=False).squeeze()
        if len(class_indices.shape) == 0:  # Handle case with single element
            class_indices = class_indices.unsqueeze(0)
        
        # Ensure we don't try to sample more than available
        available_samples = len(class_indices)
        actual_samples = min(samples_per_class, available_samples)
        
        perm = torch.randperm(available_samples, generator=generator)
        indices_dict[i] = class_indices[perm[:actual_samples]].tolist()
        
    return indices_dict