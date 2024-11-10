import os
import torch
import numpy as np
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from app.models.neural_network import get_resnet18

class Cutout:
    def __init__(self, n_holes=1, length=16, p=0.5):
        self.n_holes = n_holes
        self.length = length
        self.p = p

    def __call__(self, img):
        if np.random.random() > self.p:
            return img
            
        h = img.size(1)
        w = img.size(2)

        mask = np.ones((h, w), np.float32)

        for n in range(self.n_holes):
            y = np.random.randint(h)
            x = np.random.randint(w)

            y1 = np.clip(y - self.length // 2, 0, h)
            y2 = np.clip(y + self.length // 2, 0, h)
            x1 = np.clip(x - self.length // 2, 0, w)
            x2 = np.clip(x + self.length // 2, 0, w)

            mask[y1: y2, x1: x2] = 0.

        mask = torch.from_numpy(mask)
        mask = mask.expand_as(img)
        img = img * mask

        return img

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
        transforms.RandomCrop(32, padding=4), #
        transforms.RandomHorizontalFlip(), #
        
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),

        Cutout(n_holes=1, length=16, p=0.5) #
    ])
    
    test_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
    ])
    
    train_set = datasets.CIFAR10(root='./data', train=True, download=True, transform=train_transform)
    test_set = datasets.CIFAR10(root='./data', train=False, download=True, transform=test_transform)
    print("loaded data")
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True, num_workers=0, pin_memory=True)
    test_loader = DataLoader(test_set, batch_size=100, shuffle=False, num_workers=0, pin_memory=True)
    print("loaded loaders")
    return train_loader, test_loader, train_set, test_set

def save_model(model, 
               epochs, 
               learning_rate, 
               is_best=False):
    save_dir = 'unlearned_models'
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    model_filename = f"ResNet18_CIFAR10_{epochs}epochs_{learning_rate}lr.pth"
    model_path = os.path.join(save_dir, model_filename)
    
    torch.save(model.state_dict(), model_path)
    print(f"{'Best ' if is_best else ''}Model saved to {model_path}")

def format_distribution(distribution):
    return {
        f"gt_{i}": [round(float(distribution[i][j]), 3) for j in range(10)]
        for i in range(10)
    }

def compress_prob_array(prob_array, threshold=0.001):
    return {str(i): round(p, 3) for i, p in enumerate(prob_array) if p > threshold}