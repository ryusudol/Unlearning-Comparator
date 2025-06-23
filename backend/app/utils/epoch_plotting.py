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
                      Expected keys: 'UA', 'TA', 'TUA', 'TRA', 'PS', 'MIA'
        method: Unlearning method name (FT, GA, RL, etc.)
        forget_class: The class being forgotten
        experiment_id: Unique experiment identifier
        save_dir: Directory to save plots
    """
    # Create save directory
    plot_dir = os.path.join(save_dir, str(forget_class))
    os.makedirs(plot_dir, exist_ok=True)
    
    # Create single plot with all metrics
    fig, ax = plt.subplots(1, 1, figsize=(12, 8))
    fig.suptitle(f'{method} Unlearning Progress - Class {forget_class} - ID: {experiment_id}', 
                 fontsize=16, fontweight='bold')
    
    # Start epochs from 0 instead of 1
    epochs = range(0, len(epoch_metrics['UA']))
    
    # Plot all metrics with distinct colors
    ax.plot(epochs, epoch_metrics['UA'], 'red', linewidth=2.5, label='UA (Unlearn Accuracy)', marker='o', markersize=4)
    ax.plot(epochs, epoch_metrics['TA'], 'blue', linewidth=2.5, label='TA (Train Retain Accuracy)', marker='s', markersize=4)
    ax.plot(epochs, epoch_metrics['TUA'], 'orange', linewidth=2.5, label='TUA (Test Unlearn Accuracy)', marker='^', markersize=4)
    ax.plot(epochs, epoch_metrics['TRA'], 'green', linewidth=2.5, label='TRA (Test Retain Accuracy)', marker='d', markersize=4)
    ax.plot(epochs, epoch_metrics['PS'], 'purple', linewidth=2.5, label='PS (Ours)', marker='*', markersize=6)
    
    if 'MIA' in epoch_metrics and len(epoch_metrics['MIA']) > 0:
        ax.plot(epochs, epoch_metrics['MIA'], 'brown', linewidth=2.5, label='MIA (SALUN)', marker='x', markersize=6)
    
    ax.set_title('All Unlearning Metrics', fontsize=14, fontweight='bold')
    ax.set_xlabel('Epoch', fontsize=12)
    ax.set_ylabel('Value', fontsize=12)
    ax.grid(True, alpha=0.3)
    ax.legend(loc='center left', bbox_to_anchor=(1, 0.5), fontsize=10)
    ax.set_ylim(0, 1)
    ax.set_xlim(0, len(epoch_metrics['UA']) - 1)
    
    # Set x-axis ticks to show all epochs starting from 0
    ax.set_xticks(range(0, len(epoch_metrics['UA'])))
    
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
        max_epochs = max(len(metrics[metric]) for metrics in all_metrics.values() if metric in metrics)
        axes[row, col].set_xticks(range(1, max_epochs + 1))
    
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