import os
import torch
import numpy as np

def set_seed(seed):
    torch.manual_seed(seed)
    np.random.seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)

def save_model(
    model, 
    epochs, 
    learning_rate,
    forget_class=-1
):
    save_dir = 'unlearned_models'
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    model_filename = f"ResNet18_CIFAR10_{epochs}epochs_{learning_rate}lr_{'train' if forget_class == -1 else f'forget_{forget_class}'}.pth"
    model_path = os.path.join(save_dir, model_filename)
    
    torch.save(model.state_dict(), model_path)

def format_distribution(distribution):
    return {
        f"gt_{i}": [round(float(distribution[i][j]), 3) for j in range(10)]
        for i in range(10)
    }

def compress_prob_array(prob_array, threshold=0.001):
    return {str(i): round(p, 3) for i, p in enumerate(prob_array) if p > threshold}