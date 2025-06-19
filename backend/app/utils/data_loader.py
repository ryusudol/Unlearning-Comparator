import numpy as np
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from app.config import UNLEARN_SEED
import torch

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

def get_face_data_loaders(batch_size, train_dir, test_dir, augmentation=False):
    base_transforms = [
        transforms.Resize((160, 160)),
        transforms.ToTensor(),
        transforms.Normalize((0.4997, 0.4274, 0.3943), (0.3181, 0.2996, 0.2911))
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