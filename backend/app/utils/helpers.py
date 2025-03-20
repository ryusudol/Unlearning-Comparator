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
    """Download weights from HuggingFace Hub and save them in multiple locations.
    
    The function performs the following:
      1. The full model is downloaded once and saved as "0000.pth" in the trained_models folder.
      2. For each of the 10 classes (0-9), under unlearned_models, a folder is created where two files are stored:
         - A copy of the full model saved as "000{class_idx}.pth"
         - The retrained model for that class saved as "a00{class_idx}.pth"
         
    Additionally, only files that are newly downloaded/copied are logged.
    """
    logger.info("Starting model weights download...")

    # Get backend directory path
    current_file = os.path.abspath(__file__)
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_file)))

    # Set directories for the trained model and unlearned models (per-class)
    trained_models_dir = os.path.join(backend_dir, base_path)
    unlearned_models_dir = os.path.join(backend_dir, "unlearned_models")
    
    os.makedirs(trained_models_dir, exist_ok=True)
    os.makedirs(unlearned_models_dir, exist_ok=True)

    # List to track which files have been newly downloaded/saved
    downloaded_files = []

    try:
        logger.info("Processing full model file...")

        # For the full model in the trained_models folder, only download/copy if needed.
        trained_full_model_path = os.path.join(trained_models_dir, "0000.pth")
        if not (os.path.exists(trained_full_model_path) and not os.path.islink(trained_full_model_path)):
            logger.info("Downloading full model from Hugging Face Hub...")
            full_model_path_hub = hf_hub_download(repo_id=repo_id, filename="resnet18_cifar10_full.pth")
            shutil.copyfile(full_model_path_hub, trained_full_model_path)
            downloaded_files.append(trained_full_model_path)
            logger.info(f"Saved full trained model to: {trained_full_model_path}")
        else:
            # Reuse the existing full model file
            full_model_path_hub = trained_full_model_path

        # For each class, copy the full model (if not present) and download the unlearned model.
        for class_idx in range(10):
            class_dir = os.path.join(unlearned_models_dir, str(class_idx))
            os.makedirs(class_dir, exist_ok=True)
            
            # Copy the full model for this class if needed.
            class_full_model_path = os.path.join(class_dir, f"000{class_idx}.pth")
            if not (os.path.exists(class_full_model_path) and not os.path.islink(class_full_model_path)):
                shutil.copyfile(full_model_path_hub, class_full_model_path)
                downloaded_files.append(class_full_model_path)
                logger.info(f"Copied full model for class {class_idx} to: {class_full_model_path}")
            
            # Download the unlearned model for this class if needed.
            unlearned_model_save_path = os.path.join(class_dir, f"a00{class_idx}.pth")
            if not (os.path.exists(unlearned_model_save_path) and not os.path.islink(unlearned_model_save_path)):
                filename = f"resnet18_cifar10_no_{get_class_name(class_idx)}.pth"
                model_path = hf_hub_download(repo_id=repo_id, filename=filename)
                shutil.copyfile(model_path, unlearned_model_save_path)
                downloaded_files.append(unlearned_model_save_path)
                logger.info(f"Downloaded unlearned model for class {class_idx} to: {unlearned_model_save_path}")
        
        # Final summary: only show files that were newly added.
        if downloaded_files:
            logger.info("Newly downloaded/copied files:")
            for f in downloaded_files:
                logger.info(f" - {f}")
        else:
            logger.info("No new files were downloaded or copied; all files already exist.")
    except Exception as e:
        logger.error(f"Error downloading weights: {str(e)}")
        raise

def get_class_name(class_idx):
    """Get class name for CIFAR10 dataset"""
    classes = ['airplane', 'automobile', 'bird', 'cat', 'deer', 
              'dog', 'frog', 'horse', 'ship', 'truck']
    return classes[class_idx]