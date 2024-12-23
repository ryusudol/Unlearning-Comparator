import os
import torch
import numpy as np
import logging
import shutil
from huggingface_hub import hf_hub_download

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def set_seed(seed):
    torch.manual_seed(seed)
    np.random.seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)

def save_model(
    model, 
    forget_class=-1,
    model_name="ffff",
):
    save_dir = f'unlearned_models/{forget_class}'
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    model_filename = f"{model_name}.pth"
    model_path = os.path.join(save_dir, model_filename)
    
    torch.save(model.state_dict(), model_path)

def format_distribution(distribution):
    return {
        f"gt_{i}": [round(float(distribution[i][j]), 3) for j in range(10)]
        for i in range(10)
    }

def compress_prob_array(prob_array, threshold=0.001):
    return {str(i): round(p, 3) for i, p in enumerate(prob_array) if p > threshold}

def download_weights_from_hub(repo_id="jaeunglee/resnet18-cifar10-unlearning", 
                            base_path="trained_models"):
    """Download weights from HuggingFace Hub and save them to appropriate directories"""
    logger.info("Starting model weights download...")
    
    # Get backend directory path
    current_file = os.path.abspath(__file__)
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_file)))
    
    # Set paths
    base_path = os.path.join(backend_dir, base_path)
    unlearned_base = os.path.join(backend_dir, "unlearned_models")
    
    # Create necessary directories
    os.makedirs(base_path, exist_ok=True)
    os.makedirs(unlearned_base, exist_ok=True)
    
    # Check if all files are already downloaded
    full_model_path = os.path.join(base_path, "0000.pth")
    all_files_exist = os.path.exists(full_model_path) and not os.path.islink(full_model_path)
    
    for class_idx in range(10):
        unlearn_dir = os.path.join(unlearned_base, str(class_idx))
        os.makedirs(unlearn_dir, exist_ok=True)
        model_path = os.path.join(unlearn_dir, f"a00{class_idx}.pth")
        all_files_exist = all_files_exist and os.path.exists(model_path) and not os.path.islink(model_path)
    
    if all_files_exist:
        logger.info("All weight files are already downloaded.")
        return
    
    try:
        # Download full model
        logger.info("Downloading models from Hugging Face Hub...")
        full_model_path_hub = hf_hub_download(repo_id=repo_id, 
                                            filename="resnet18_cifar10_full.pth")
        full_model_save_path = os.path.join(base_path, "0000.pth")
        shutil.copyfile(full_model_path_hub, full_model_save_path)
        
        # Download unlearned models for each class
        for class_idx in range(10):
            # Download and save unlearned model
            filename = f"resnet18_cifar10_no_{get_class_name(class_idx)}.pth"
            model_path = hf_hub_download(repo_id=repo_id, filename=filename)
            save_path = os.path.join(unlearned_base, str(class_idx), f"a00{class_idx}.pth")
            shutil.copyfile(model_path, save_path)
        
        logger.info("All models downloaded successfully!")
    except Exception as e:
        logger.error(f"Error downloading weights: {str(e)}")
        raise

def get_class_name(class_idx):
    """Get class name for CIFAR10 dataset"""
    classes = ['airplane', 'automobile', 'bird', 'cat', 'deer', 
              'dog', 'frog', 'horse', 'ship', 'truck']
    return classes[class_idx]