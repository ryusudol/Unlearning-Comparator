"""
This package contains service modules that implement core business logic.
"""

from .training import train_model, run_training
from .visualization import compute_umap_embeddings

__all__ = ['train_model', 'run_training', 'compute_umap_embeddings']