import matplotlib.pyplot as plt
import os
from datetime import datetime
from typing import Dict, List


def plot_epoch_metrics(
    epoch_metrics: Dict[str, List[float]], 
    method: str, 
    forget_class: int, 
    experiment_id: str,
    save_dir: str = "epoch_plots"
):
    """
    Plot epoch-wise metrics for unlearning methods.
    
    Args:
        epoch_metrics: Dict containing lists of metrics per epoch
                      Expected keys: 'UA', 'TA', 'TUA', 'TRA', 'PS'
        method: Unlearning method name (FT, GA, RL, etc.)
        forget_class: The class being forgotten
        experiment_id: Unique experiment identifier
        save_dir: Directory to save plots
    """
    # Create save directory
    plot_dir = os.path.join(save_dir, str(forget_class))
    os.makedirs(plot_dir, exist_ok=True)
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    fig.suptitle(f'{method} Unlearning Progress - Class {forget_class} - ID: {experiment_id}', 
                 fontsize=14, fontweight='bold')
    
    epochs = range(1, len(epoch_metrics['UA']) + 1)
    
    # Plot UA (Unlearn Accuracy)
    axes[0, 0].plot(epochs, epoch_metrics['UA'], 'r-', linewidth=2, label='UA')
    axes[0, 0].set_title('Unlearn Accuracy (UA)')
    axes[0, 0].set_xlabel('Epoch')
    axes[0, 0].set_ylabel('Accuracy')
    axes[0, 0].grid(True, alpha=0.3)
    axes[0, 0].legend()
    axes[0, 0].set_ylim(0, 1)
    
    # Plot TA (Training Accuracy on remaining classes)
    axes[0, 1].plot(epochs, epoch_metrics['TA'], 'b-', linewidth=2, label='TA')
    axes[0, 1].set_title('Training Remaining Accuracy (TA)')
    axes[0, 1].set_xlabel('Epoch')
    axes[0, 1].set_ylabel('Accuracy')
    axes[0, 1].grid(True, alpha=0.3)
    axes[0, 1].legend()
    axes[0, 1].set_ylim(0, 1)
    
    # Plot TUA (Test Unlearn Accuracy)
    axes[0, 2].plot(epochs, epoch_metrics['TUA'], 'orange', linewidth=2, label='TUA')
    axes[0, 2].set_title('Test Unlearn Accuracy (TUA)')
    axes[0, 2].set_xlabel('Epoch')
    axes[0, 2].set_ylabel('Accuracy')
    axes[0, 2].grid(True, alpha=0.3)
    axes[0, 2].legend()
    axes[0, 2].set_ylim(0, 1)
    
    # Plot TRA (Test Remaining Accuracy)
    axes[1, 0].plot(epochs, epoch_metrics['TRA'], 'green', linewidth=2, label='TRA')
    axes[1, 0].set_title('Test Remaining Accuracy (TRA)')
    axes[1, 0].set_xlabel('Epoch')
    axes[1, 0].set_ylabel('Accuracy')
    axes[1, 0].grid(True, alpha=0.3)
    axes[1, 0].legend()
    axes[1, 0].set_ylim(0, 1)
    
    # Plot PS (Privacy Score)
    axes[1, 1].plot(epochs, epoch_metrics['PS'], 'purple', linewidth=2, label='PS')
    axes[1, 1].set_title('Privacy Score (PS)')
    axes[1, 1].set_xlabel('Epoch')
    axes[1, 1].set_ylabel('Privacy Score')
    axes[1, 1].grid(True, alpha=0.3)
    axes[1, 1].legend()
    axes[1, 1].set_ylim(0, 1)
    
    # Combined plot
    axes[1, 2].plot(epochs, epoch_metrics['UA'], 'r-', linewidth=2, label='UA', alpha=0.8)
    axes[1, 2].plot(epochs, epoch_metrics['TA'], 'b-', linewidth=2, label='TA', alpha=0.8)
    axes[1, 2].plot(epochs, epoch_metrics['TUA'], 'orange', linewidth=2, label='TUA', alpha=0.8)
    axes[1, 2].plot(epochs, epoch_metrics['TRA'], 'green', linewidth=2, label='TRA', alpha=0.8)
    axes[1, 2].plot(epochs, epoch_metrics['PS'], 'purple', linewidth=2, label='PS', alpha=0.8)
    axes[1, 2].set_title('All Metrics Combined')
    axes[1, 2].set_xlabel('Epoch')
    axes[1, 2].set_ylabel('Value')
    axes[1, 2].grid(True, alpha=0.3)
    axes[1, 2].legend()
    axes[1, 2].set_ylim(0, 1)
    
    plt.tight_layout()
    
    # Save plot
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{method}_class_{forget_class}_{experiment_id}_{timestamp}.png"
    filepath = os.path.join(plot_dir, filename)
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"Epoch-wise plot saved: {filepath}")
    return filepath


def plot_comparison_metrics(
    all_metrics: Dict[str, Dict[str, List[float]]], 
    forget_class: int,
    save_dir: str = "epoch_plots"
):
    """
    Plot comparison of different unlearning methods.
    
    Args:
        all_metrics: Dict of method_name -> epoch_metrics
        forget_class: The class being forgotten
        save_dir: Directory to save plots
    """
    plot_dir = os.path.join(save_dir, str(forget_class))
    os.makedirs(plot_dir, exist_ok=True)
    
    metric_names = ['UA', 'TA', 'TUA', 'TRA', 'PS']
    
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    fig.suptitle(f'Unlearning Methods Comparison - Class {forget_class}', 
                 fontsize=16, fontweight='bold')
    
    for i, metric in enumerate(metric_names):
        row = i // 3
        col = i % 3
        
        for method_name, epoch_metrics in all_metrics.items():
            if metric in epoch_metrics:
                epochs = range(1, len(epoch_metrics[metric]) + 1)
                axes[row, col].plot(epochs, epoch_metrics[metric], 
                                  linewidth=2, label=method_name, alpha=0.8)
        
        axes[row, col].set_title(f'{metric} Comparison')
        axes[row, col].set_xlabel('Epoch')
        axes[row, col].set_ylabel('Value')
        axes[row, col].grid(True, alpha=0.3)
        axes[row, col].legend()
        axes[row, col].set_ylim(0, 1)
    
    # Hide the last subplot if not needed
    axes[1, 2].axis('off')
    
    plt.tight_layout()
    
    # Save comparison plot
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"comparison_class_{forget_class}_{timestamp}.png"
    filepath = os.path.join(plot_dir, filename)
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"Comparison plot saved: {filepath}")
    return filepath