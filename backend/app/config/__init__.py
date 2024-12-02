"""
This module contains all configuration settings for the application.
"""

from .settings import (
    UMAP_N_NEIGHBORS,
    UMAP_MIN_DIST,
    UMAP_INIT,
    UMAP_RANDOM_STATE,
    UMAP_N_JOBS,
    UMAP_DATA_SIZE,
    UMAP_DATASET,
    MAX_GRAD_NORM,
    UNLEARN_SEED,
    MOMENTUM,
    WEIGHT_DECAY,
    BATCH_SIZE,
    LEARNING_RATE,
    EPOCHS,
    DECREASING_LR,
    GAMMA
)

__all__ = [
    # UMAP settings
    'UMAP_N_NEIGHBORS',
    'UMAP_MIN_DIST',
    'UMAP_INIT',
    'UMAP_RANDOM_STATE',
    'UMAP_N_JOBS',
    'UMAP_DATA_SIZE',
    'UMAP_DATASET',
    
    # Training settings
    'MAX_GRAD_NORM',
    'UNLEARN_SEED',
    'MOMENTUM',
    'WEIGHT_DECAY',
    'BATCH_SIZE',
    'LEARNING_RATE',
    'EPOCHS',
    
    # Learning rate schedule
    'DECREASING_LR',
    'GAMMA'
] 