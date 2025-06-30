import torch
import numpy as np
from typing import Tuple, List, Dict
from app.utils.attack_full_dataset import calculate_model_metrics, calculate_attack_scores_original_logic


async def calculate_ps_with_cached_retrain(
    unlearn_model, 
    data_loader, 
    device, 
    forget_class: int,
    retrain_metrics_cache: Dict,
    t1: float = 2.0,
    t2: float = 1.0
) -> float:
    """
    Calculate Privacy Score using cached retrain metrics (optimized for epoch-wise calculation).
    
    Args:
        unlearn_model: The current unlearned model
        data_loader: DataLoader containing full dataset
        device: Device to run computations on
        forget_class: The class being forgotten
        retrain_metrics_cache: Pre-calculated retrain metrics
        t1: Temperature for entropy calculation
        t2: Temperature for confidence calculation
    
    Returns:
        Privacy score (float)
    """
    if retrain_metrics_cache is None:
        print("Warning: No retrain metrics cache available, returning default PS")
        return 0.5
    
    # Calculate metrics only for unlearn model (retrain is cached)
    unlearn_metrics = await calculate_model_metrics(
        unlearn_model, data_loader, device, forget_class, t1, t2,
        create_plots=False, model_name="Unlearn"
    )
    
    if len(unlearn_metrics["entropies"]) == 0:
        print("Warning: No unlearn metrics available, returning default PS")
        return 0.5
    
    # Use the same attack calculation logic with cached retrain data
    privacy_score = calculate_attack_scores_original_logic(
        unlearn_metrics, retrain_metrics_cache
    )
    
    return privacy_score