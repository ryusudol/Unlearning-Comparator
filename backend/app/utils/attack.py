import torch
import numpy as np
import torch.nn.functional as F
import matplotlib.pyplot as plt
from scipy.stats import entropy
import json
from datetime import datetime

def prepare_distribution_data(logit_entropies, max_logit_gaps):
    """
    Converts the logit entropies and max logit gaps into a distribution data format.
    Assumes that the input lists are already of desired size (e.g., 200 samples).
    """
    def convert_to_python_types(data):
        # Convert numpy arrays, floats, or lists into a list of rounded floats.
        if isinstance(data, np.ndarray):
            return [round(float(x), 2) for x in data]
        elif isinstance(data, (np.float32, np.float64)):
            return round(float(data), 2)
        elif isinstance(data, list):
            return [round(float(x), 2) for x in data]
        return data

    entropy_values = convert_to_python_types(logit_entropies)
    confidence_values = convert_to_python_types(max_logit_gaps)

    return {
        "entropy": {
            "values": entropy_values,
            "bins": 50,
            "range": [0.00, 2.50],
            "max_display": 40
        },
        "confidence": {
            "values": confidence_values,
            "bins": 50,
            "range": [-2.50, 10.00],
            "max_display": 40
        }
    }

def visualize_distributions(logit_entropies, max_logit_gaps, forget_class, t1, t2, timestamp):
    """
    Visualizes the distributions of logit entropies and max logit gaps.
    Uses the full set of provided data (assumed to be 200 samples).
    """
    def make_break_marks(ax, y_pos):
        kwargs = dict(transform=ax.transAxes, color='k', clip_on=False)
        dx, dy = 0.01, 0.01
        ax.plot((-dx, +dx), (y_pos-dy, y_pos+dy), **kwargs)
        ax.plot((-dx, +dx), (y_pos-2*dy, y_pos+2*dy), **kwargs)

    plt.figure(figsize=(13, 5))
    
    # Left plot (Entropy)
    plt.subplot(1, 2, 1)
    ax1 = plt.gca()
    counts, bin_edges = np.histogram(logit_entropies, bins=50, range=(0.0, 2.5))
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2

    for x, count in zip(bin_centers, counts):
        if count <= 40:
            for y in range(count):
                plt.plot(x, y, 'o', color='gray', alpha=0.7, markersize=5)
        else:
            for y in range(39):
                plt.plot(x, y, 'o', color='gray', alpha=0.7, markersize=5)
            plt.plot(x, 42, 'o', color='gray', alpha=0.7, markersize=5)
    
    make_break_marks(ax1, 0.9)
    plt.title(f'Class {forget_class} Logit Entropy Distribution (200 samples)')
    plt.xlabel('Entropy')
    plt.ylabel('Count')
    plt.gca().yaxis.set_major_locator(plt.MultipleLocator(5))
    plt.xlim(0.0, 2.5)
    plt.ylim(-0.5, 43)
    plt.grid(True, alpha=0.2)
    
    # Right plot (Confidence)
    plt.subplot(1, 2, 2)
    ax2 = plt.gca()
    counts, bin_edges = np.histogram(max_logit_gaps, bins=50, range=(-2.5, 10.0))
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2

    for x, count in zip(bin_centers, counts):
        if count <= 40:
            for y in range(count):
                plt.plot(x, y, 'o', color='gray', alpha=0.7, markersize=5)
        else:
            for y in range(39):
                plt.plot(x, y, 'o', color='gray', alpha=0.7, markersize=5)
            plt.plot(x, 42, 'o', color='gray', alpha=0.7, markersize=5)
    
    make_break_marks(ax2, 0.9)
    plt.title(f'Class {forget_class} Max Logit Confidence Distribution (200 samples)')
    plt.xlabel('Log Confidence Score')
    plt.ylabel('Count')
    plt.gca().yaxis.set_major_locator(plt.MultipleLocator(5))
    plt.xlim([-2.5, 10.0])
    plt.ylim(-0.5, 43)
    plt.grid(True, alpha=0.2)
    
    plt.tight_layout()
    plt.savefig(f'attack/{forget_class}/class_{forget_class}_entropy_distribution_t1_{t1}_t2_{t2}_{timestamp}.png', dpi=300, bbox_inches='tight')
    plt.close()

async def process_attack_metrics(
        model, 
        data_loader, 
        device, 
        forget_class=5, 
        t1=2.0,
        t2=1.0):
    model.eval()
    logit_entropies = []
    max_logit_gaps = []
    
    with torch.no_grad():
        for data in data_loader:
            images, labels = data[0].to(device), data[1].to(device)
            outputs = model(images)
            for i in range(labels.size(0)):
                if labels[i].item() == forget_class:
                    logits = outputs[i]
                    
                    # For entropy, use scaled logits (temperature=1.0)
                    scaled_logits_for_entropy = logits / t1
                    probs_for_entropy = F.softmax(scaled_logits_for_entropy, dim=0).cpu().numpy()
                    logit_entropy = entropy(probs_for_entropy)
                    
                    # For confidence, use scaled logits (temperature=0.5)
                    scaled_logits_for_confidence = logits / t2
                    probs_for_confidence = F.softmax(scaled_logits_for_confidence, dim=0).cpu().numpy()
                    max_prob_idx = np.argmax(probs_for_confidence)
                    prob_max = probs_for_confidence[max_prob_idx]
                    prob_others = 1 - prob_max
                    confidence_score = np.log(prob_max + 1e-45) - np.log(prob_others + 1e-45)
                    
                    logit_entropies.append(logit_entropy)
                    max_logit_gaps.append(confidence_score)
    
    distribution_data = prepare_distribution_data(logit_entropies, max_logit_gaps)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    json_filename = f'attack/{forget_class}/class_{forget_class}_distribution_t1_{t1}_t2_{t2}_{timestamp}.json'
    with open(json_filename, 'w') as f:
        json.dump(distribution_data, f, indent=4)
    
    visualize_distributions(logit_entropies, max_logit_gaps, forget_class, t1, t2, timestamp)
    
    return logit_entropies, max_logit_gaps 