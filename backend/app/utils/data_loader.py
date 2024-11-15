import os
import pickle
import numpy as np
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

def load_cifar10_batch(file):
    with open(file, 'rb') as fo:
        dict = pickle.load(fo, encoding='bytes')
    return dict[b'data'], dict[b'labels']

def load_cifar10_data():
    data_dir = 'data/cifar-10-batches-py'
    x_train = []
    y_train = []

    for i in range(1, 6):
        filename = os.path.join(data_dir, f'data_batch_{i}')
        X, Y = load_cifar10_batch(filename)
        x_train.append(X)
        y_train.append(Y)

    x_train = np.concatenate(x_train)
    y_train = np.concatenate(y_train)

    return x_train.reshape(50000, 3, 32, 32).transpose(0, 2, 3, 1), y_train

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