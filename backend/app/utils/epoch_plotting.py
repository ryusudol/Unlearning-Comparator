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
                      Expected keys: 'UA', 'RA', 'TUA', 'TRA', 'PS', 'C-MIA', 'E-MIA'
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
    
    # Plot all metrics with specified styles
    # UA, TUA: X markers (thick X) - UA with dashed lines
    ax.plot(epochs, epoch_metrics['UA'], color='darkgreen', linewidth=2.5, linestyle='--', 
            label='UA (Unlearn Accuracy)', marker='X', markersize=12, zorder=10, clip_on=False)
    ax.plot(epochs, epoch_metrics['TUA'], color='#228B22', linewidth=2.5, linestyle='--', 
            label='TUA (Test Unlearn Accuracy)', marker='X', markersize=12, zorder=10, clip_on=False)
    
    # RA, TRA: circle markers - RA with solid lines
    ax.plot(epochs, epoch_metrics['RA'], color='darkgreen', linewidth=2.5, linestyle='-', 
            label='RA (Remain Accuracy)', marker='o', markersize=12, zorder=10, clip_on=False)
    ax.plot(epochs, epoch_metrics['TRA'], color='#228B22', linewidth=2.5, linestyle='-', 
            label='TRA (Test Remain Accuracy)', marker='o', markersize=12, zorder=10, clip_on=False)
    
    # PS: dash-dot line, dark orange, star marker
    ax.plot(epochs, epoch_metrics['PS'], color='#FF6600', linewidth=2.5, linestyle='-.',
            label='PS (Ours)', marker='*', markersize=14, zorder=10, clip_on=False)
    
    # MIA: individual plots for C-MIA and E-MIA
    if 'C-MIA' in epoch_metrics and len(epoch_metrics['C-MIA']) > 0:
        ax.plot(epochs, epoch_metrics['C-MIA'], color='#CC8800', linewidth=2.5, linestyle='-.',
                label='C-MIA (Confidence)', marker='^', markersize=10, zorder=10, clip_on=False)
    
    if 'E-MIA' in epoch_metrics and len(epoch_metrics['E-MIA']) > 0:
        ax.plot(epochs, epoch_metrics['E-MIA'], color='#BB7700', linewidth=2.5, linestyle='-.',
                label='E-MIA (Entropy)', marker='v', markersize=10, zorder=10, clip_on=False)
    
    ax.set_title('All Unlearning Metrics', fontsize=14, fontweight='bold')
    ax.set_xlabel('Epoch', fontsize=12)
    ax.set_ylabel('Value', fontsize=12)
    ax.grid(True, alpha=0.3)
    ax.legend(loc='center left', bbox_to_anchor=(1, 0.5), fontsize=10, markerscale=0.7)
    # Set limits with no margin to remove padding
    num_epochs = len(epoch_metrics['UA'])
    ax.set_ylim(0, 1)  # Remove top/bottom margins
    ax.set_xlim(0, num_epochs - 1)  # Remove left/right margins
    
    # Set x-axis ticks to show all epochs starting from 0
    ax.set_xticks(range(0, num_epochs))
    
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
    
    metric_names = ['UA', 'RA', 'TUA', 'TRA', 'PS']
    
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
                                  linewidth=2, label=method_name, alpha=0.8, zorder=10)
        
        axes[row, col].set_title(f'{metric} Comparison')
        axes[row, col].set_xlabel('Epoch')
        axes[row, col].set_ylabel('Value')
        axes[row, col].grid(True, alpha=0.3)
        axes[row, col].legend()
        axes[row, col].set_ylim(-0.05, 1.05)  # Add margin to prevent marker clipping
        max_epochs = max(len(metrics[metric]) for metrics in all_metrics.values() if metric in metrics)
        axes[row, col].set_xlim(1, max_epochs)  # Remove left/right margins
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