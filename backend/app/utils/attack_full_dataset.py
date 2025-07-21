import torch
import numpy as np
import torch.nn.functional as F
from scipy.stats import entropy
from typing import Tuple, List
import os
import matplotlib.pyplot as plt
from app.models import get_resnet18


def _create_single_distribution_plot(data, title, xlabel, color, filename, mean_value, bins=30, range_vals=None):
    """Create a single distribution plot with consistent styling."""
    plt.figure(figsize=(10, 6))
    
    # Use consistent range and bins for proper comparison
    if range_vals is not None:
        plt.hist(data, bins=bins, alpha=0.7, color=color, edgecolor='black', range=range_vals)
        plt.xlim(range_vals)
    else:
        plt.hist(data, bins=bins, alpha=0.7, color=color, edgecolor='black')
    
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel('Frequency')
    plt.grid(True, alpha=0.3)
    plt.axvline(mean_value, color='red', linestyle='--', 
               label=f'Mean: {mean_value:.3f}')
    plt.legend()
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    plt.close()


def _create_distribution_plots(entropies, confidences, model_name, forget_class, t1, t2):
    """Create distribution plots for entropy and confidence."""
    try:
        from datetime import datetime
        
        # Create output directory
        os.makedirs('logits_distribution', exist_ok=True)
        
        # For retrain models, don't include timestamp (static filename)
        # For unlearn models, include timestamp (versioned filename)
        if model_name.lower() == "retrain":
            entropy_filename = f'logits_distribution/{model_name.lower()}_entropy_{forget_class}.png'
            confidence_filename = f'logits_distribution/{model_name.lower()}_confidence_{forget_class}.png'
        else:
            # Generate timestamp for unlearn models
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            entropy_filename = f'logits_distribution/{model_name.lower()}_entropy_{forget_class}_{timestamp}.png'
            confidence_filename = f'logits_distribution/{model_name.lower()}_confidence_{forget_class}_{timestamp}.png'
        
        # Define consistent ranges for proper comparison between retrain and unlearn
        ENTROPY_RANGE = (0.0, 2.5)
        CONFIDENCE_RANGE = (-2.5, 10.0)  # Same as attack.py configuration
        BINS = 51  # Same as attack.py for consistency
        
        # Define plot configurations with consistent ranges
        plot_configs = [
            {
                'data': entropies,
                'title': f'{model_name} - Entropy Distribution for Class {forget_class}',
                'xlabel': 'Entropy',
                'color': 'skyblue',
                'filename': entropy_filename,
                'bins': BINS,
                'range_vals': ENTROPY_RANGE
            },
            {
                'data': confidences,
                'title': f'{model_name} - Confidence Distribution for Class {forget_class}',
                'xlabel': 'Confidence',
                'color': 'lightgreen',
                'filename': confidence_filename,
                'bins': BINS,
                'range_vals': CONFIDENCE_RANGE
            }
        ]
        
        # Create plots
        saved_paths = []
        for config in plot_configs:
            _create_single_distribution_plot(
                config['data'], config['title'], config['xlabel'], 
                config['color'], config['filename'], np.mean(config['data']),
                bins=config['bins'], range_vals=config['range_vals']
            )
            saved_paths.append(config['filename'])
        
        print(f"{model_name} distribution plots saved: {', '.join(saved_paths)}")
        
    except Exception as e:
        print(f"Error creating {model_name} distribution plots: {e}")


# Import the original attack calculation functions
def calculate_scores(
        values_unlearn, 
        values_retrain, 
        bins, 
        range_vals, 
        mode='entropy', 
        direction='unlearn'
    ):
    """
    Calculate attack scores by comparing the unlearn and retrain distributions.
    Returns a list of dictionaries each containing:
       - "threshold": the threshold value,
       - "fpr": false positive rate,
       - "fnr": false negative rate,
       - "attack_score": defined as (1 - forgetting_score)
    """
    if bins < 2 or range_vals[0] >= range_vals[1]:
        return []
    v_un = np.clip(values_unlearn, range_vals[0], range_vals[1])
    v_re = np.clip(values_retrain, range_vals[0], range_vals[1])
    thresholds = np.linspace(range_vals[0], range_vals[1], bins)

    if len(v_un) == 0 or len(v_re) == 0:
        return []

    scores = []
    DELTA = 1e-5
    EPS = 1e-10

    for thr_val in thresholds:
        # Depending on mode and the chosen direction, assign positives and negatives:
        if mode == 'entropy':
            if direction == 'unlearn':
                pos = v_un
                neg = v_re
            else:  # direction == 'retrain'
                pos = v_re
                neg = v_un
        else:  # mode == 'confidence'
            if direction == 'retrain':
                pos = v_re
                neg = v_un
            else:  # direction == 'unlearn'
                pos = v_un
                neg = v_re

        tpr = np.mean(pos >= thr_val)
        fpr = np.mean(neg >= thr_val)
        fnr = 1.0 - tpr

        if fpr == 0 and fnr == 0:
            # When no predictions cross the threshold, set forgetting score fq to 0
            fq = 0
        elif fpr >= (1 - DELTA) or fnr >= (1 - DELTA):
            fq = 1
        else:
            sfp = np.clip(fpr, EPS, 1 - DELTA - EPS)
            sfn = np.clip(fnr, EPS, 1 - DELTA - EPS)
            lg1 = np.log(1 - DELTA - sfp) - np.log(sfn)
            lg2 = np.log(1 - DELTA - sfn) - np.log(sfp)
            epsilon = max(0, min(lg1, lg2))
            fq = 2 ** (-epsilon)
        attack_score = 1 - fq
        scores.append({
            "threshold": round(float(thr_val), 3),
            "fpr": round(fpr, 3),
            "fnr": round(fnr, 3),
            "attack_score": round(attack_score, 3)
        })
    return scores


async def process_attack_metrics_full_dataset(
    unlearn_model, 
    data_loader, 
    device, 
    forget_class: int,
    retrain_model_path: str = None,
    t1: float = 2.0,
    t2: float = 1.0
) -> Tuple[List, List, float]:
    """
    Calculate Privacy Score using full dataset with SAME LOGIC as original attack.py
    but using retrain model directly instead of JSON files.
    
    Args:
        unlearn_model: The unlearned model
        data_loader: DataLoader containing full dataset
        device: Device to run computations on
        forget_class: The class being forgotten
        retrain_model_path: Path to retrain model weights (if None, uses default path)
        t1: Temperature for entropy calculation
        t2: Temperature for confidence calculation
    
    Returns:
        Tuple of (values, attack_results, privacy_score)
    """
    
    # Load retrain model
    if retrain_model_path is None:
        retrain_model_path = f"unlearned_models/{forget_class}/a00{forget_class}.pth"
    
    if not os.path.exists(retrain_model_path):
        print(f"Warning: Retrain model not found at {retrain_model_path}")
        print("Using simplified PS calculation without retrain comparison")
        return await process_attack_metrics_simplified(
            unlearn_model, data_loader, device, forget_class, t1, t2
        )
    
    # Load retrain model
    retrain_model = get_resnet18().to(device)
    retrain_model.load_state_dict(torch.load(retrain_model_path, map_location=device))
    retrain_model.eval()
    
    print(f"Calculating PS with full dataset using ORIGINAL attack logic")
    
    # Calculate metrics for both models using the SAME method as attack.py
    unlearn_metrics = await calculate_model_metrics(
        unlearn_model, data_loader, device, forget_class, t1, t2
    )
    retrain_metrics = await calculate_model_metrics(
        retrain_model, data_loader, device, forget_class, t1, t2
    )
    
    # Apply the SAME attack calculation logic as attack.py with epoch bins for stability
    privacy_score = calculate_attack_scores_original_logic(
        unlearn_metrics, retrain_metrics, use_epoch_bins=True
    )
    
    # Prepare return values in expected format
    values = []
    for idx, entropy, confidence in zip(
        unlearn_metrics["indices"], 
        unlearn_metrics["entropies"], 
        unlearn_metrics["confidences"]
    ):
        values.append({
            "img": idx,
            "entropy": round(float(entropy), 2),
            "confidence": round(float(confidence), 2)
        })
    
    attack_results = {
        "full_dataset_calculation": True,
        "unlearn_samples": len(unlearn_metrics["entropies"]),
        "retrain_samples": len(retrain_metrics["entropies"]),
        "privacy_score": privacy_score
    }
    
    print(f"Full dataset PS calculation completed: {len(unlearn_metrics['entropies'])} samples")
    return values, attack_results, privacy_score


def calculate_attack_scores_original_logic(
    unlearn_metrics: dict, 
    retrain_metrics: dict,
    use_epoch_bins: bool = False
) -> float:
    """
    Apply the SAME attack calculation logic as attack.py but with full dataset.
    Args:
        use_epoch_bins: If True, uses 201 bins for more stable epoch-wise PS calculation
    """
    # Configuration - use 201 bins for epoch-wise calculations to reduce noise
    if use_epoch_bins:
        ENTROPY_CONFIG = {
            "bins": 201,
            "range": [0.00, 2.50]
        }
        CONFIDENCE_CONFIG = {
            "bins": 201,
            "range": [-2.50, 10.00]
        }
    else:
        # Original configuration from attack.py for visualization consistency
        ENTROPY_CONFIG = {
            "bins": 51,
            "range": [0.00, 2.50]
        }
        CONFIDENCE_CONFIG = {
            "bins": 51,
            "range": [-2.50, 10.00]
        }
    
    unlearn_entropies = np.array(unlearn_metrics["entropies"])
    unlearn_confidences = np.array(unlearn_metrics["confidences"])
    retrain_entropies = np.array(retrain_metrics["entropies"])
    retrain_confidences = np.array(retrain_metrics["confidences"])
    
    # Calculate 4 attack scores exactly like attack.py
    scores_ent_unlearn = calculate_scores(
        unlearn_entropies,
        retrain_entropies,
        ENTROPY_CONFIG["bins"],
        ENTROPY_CONFIG["range"],
        mode="entropy",
        direction="unlearn"
    )
    scores_ent_retrain = calculate_scores(
        unlearn_entropies,
        retrain_entropies,
        ENTROPY_CONFIG["bins"],
        ENTROPY_CONFIG["range"],
        mode="entropy",
        direction="retrain"
    )
    scores_conf_unlearn = calculate_scores(
        unlearn_confidences,
        retrain_confidences,
        CONFIDENCE_CONFIG["bins"],
        CONFIDENCE_CONFIG["range"],
        mode="confidence",
        direction="unlearn"
    )
    scores_conf_retrain = calculate_scores(
        unlearn_confidences,
        retrain_confidences,
        CONFIDENCE_CONFIG["bins"],
        CONFIDENCE_CONFIG["range"],
        mode="confidence",
        direction="retrain"
    )
    
    # Get best attack scores exactly like attack.py
    def get_best_attack(scores):
        if not scores:
            return 0
        best = max(scores, key=lambda s: s["attack_score"])
        return best["attack_score"]
    
    best_attack_ent_unlearn = get_best_attack(scores_ent_unlearn)
    best_attack_ent_retrain = get_best_attack(scores_ent_retrain)
    best_attack_conf_unlearn = get_best_attack(scores_conf_unlearn)
    best_attack_conf_retrain = get_best_attack(scores_conf_retrain)
    
    # Final privacy score calculation exactly like attack.py
    best_overall_attack = max([
        best_attack_ent_unlearn,
        best_attack_ent_retrain, 
        best_attack_conf_unlearn,
        best_attack_conf_retrain
    ])
    
    privacy_score = 1 - best_overall_attack
    privacy_score = max(0.0, min(1.0, privacy_score))  # Clamp to [0,1]
    
    return privacy_score


async def calculate_model_metrics(
    model, 
    data_loader, 
    device, 
    forget_class: int,
    t1: float,
    t2: float,
    create_plots: bool = False,
    model_name: str = "model"
) -> dict:
    """
    Calculate entropy and confidence metrics for a model on the forget class data.
    """
    from app.utils.evaluation import model_eval_mode
    
    entropies = []
    confidences = []
    indices = []
    
    with model_eval_mode(model):
        with torch.no_grad():
            for batch_idx, (images, labels) in enumerate(data_loader):
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                
                # Select only forget class samples
                forget_mask = (labels == forget_class)
                if not torch.any(forget_mask):
                    continue
                
                local_indices = torch.where(forget_mask)[0]
                batch_start_idx = batch_idx * data_loader.batch_size
                
                # Calculate original indices
                if hasattr(data_loader.dataset, 'indices'):
                    # If using Subset
                    original_indices = [data_loader.dataset.indices[batch_start_idx + idx.item()] 
                                      for idx in local_indices]
                else:
                    # If using full dataset
                    original_indices = [batch_start_idx + idx.item() for idx in local_indices]
                
                selected_outputs = outputs[forget_mask]
                
                # Calculate entropy
                scaled_outputs_entropy = selected_outputs / t1
                probs_entropy = F.softmax(scaled_outputs_entropy, dim=1)
                batch_entropies = entropy(probs_entropy.cpu().numpy().T)
                
                # Calculate confidence
                scaled_outputs_conf = selected_outputs / t2
                probs_conf = F.softmax(scaled_outputs_conf, dim=1).cpu().numpy()
                max_probs = np.max(probs_conf, axis=1)
                other_probs = 1 - max_probs
                batch_confidences = np.log(max_probs + 1e-45) - np.log(other_probs + 1e-45)
                
                indices.extend(original_indices)
                entropies.extend(batch_entropies)
                confidences.extend(batch_confidences)
    
    # Create visualizations only when requested
    if create_plots and len(entropies) > 0:
        _create_distribution_plots(entropies, confidences, model_name, forget_class, t1, t2)
    
    return {
        "indices": indices,
        "entropies": entropies,
        "confidences": confidences
    }


def calculate_privacy_score_from_distributions(
    unlearn_metrics: dict, 
    retrain_metrics: dict
) -> float:
    """
    Calculate privacy score by comparing unlearn and retrain distributions.
    Higher score = better privacy (harder to distinguish unlearn from retrain).
    """
    unlearn_entropy = np.array(unlearn_metrics["entropies"])
    unlearn_confidence = np.array(unlearn_metrics["confidences"])
    retrain_entropy = np.array(retrain_metrics["entropies"])
    retrain_confidence = np.array(retrain_metrics["confidences"])
    
    # Calculate statistical distances between distributions
    entropy_distance = abs(np.mean(unlearn_entropy) - np.mean(retrain_entropy))
    confidence_distance = abs(np.mean(unlearn_confidence) - np.mean(retrain_confidence))
    
    # Normalize distances (these thresholds may need tuning)
    max_entropy_diff = 2.5  # Typical range for entropy differences
    max_confidence_diff = 10.0  # Typical range for confidence differences
    
    normalized_entropy_dist = min(entropy_distance / max_entropy_diff, 1.0)
    normalized_confidence_dist = min(confidence_distance / max_confidence_diff, 1.0)
    
    # Privacy score: lower distance = higher privacy
    # Average the two metrics and invert (1 - distance)
    avg_distance = (normalized_entropy_dist + normalized_confidence_dist) / 2
    privacy_score = 1.0 - avg_distance
    
    # Ensure score is in [0, 1] range
    privacy_score = max(0.0, min(1.0, privacy_score))
    
    return privacy_score


async def process_attack_metrics_simplified(
    model, 
    data_loader, 
    device, 
    forget_class: int,
    t1: float,
    t2: float
) -> Tuple[List, List, float]:
    """
    Simplified PS calculation when retrain model is not available.
    Uses heuristics based on entropy and confidence values.
    """
    metrics = await calculate_model_metrics(model, data_loader, device, forget_class, t1, t2)
    
    # Heuristic privacy score calculation
    entropies = np.array(metrics["entropies"])
    confidences = np.array(metrics["confidences"])
    
    # Higher entropy and lower confidence typically indicate better privacy
    normalized_entropy = np.mean(entropies) / 2.5  # Normalize to typical range
    normalized_confidence = np.clip(np.mean(confidences) / 10.0, 0, 1)  # Normalize and clip
    
    # Combine metrics (higher entropy good, lower confidence good for privacy)
    privacy_score = (normalized_entropy + (1 - normalized_confidence)) / 2
    privacy_score = max(0.0, min(1.0, privacy_score))
    
    # Prepare return values
    values = []
    for idx, entropy, confidence, loss in zip(metrics["indices"], metrics["entropies"], metrics["confidences"], metrics["losses"]):
        values.append({
            "img": idx,
            "entropy": round(float(entropy), 2),
            "confidence": round(float(confidence), 2),
            "loss": round(float(loss), 3)
        })
    
    losses = np.array(metrics["losses"])
    attack_results = {
        "simplified_calculation": True,
        "entropy_mean": float(np.mean(entropies)),
        "confidence_mean": float(np.mean(confidences)),
        "loss_mean": float(np.mean(losses)),
        "samples": len(entropies)
    }
    
    return values, attack_results, privacy_score