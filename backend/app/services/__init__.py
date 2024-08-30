"""
This package contains service modules that implement core business logic.
"""

from .train import run_training
from ..utils.visualization import compute_umap_embeddings

__all__ = ['run_training', 'compute_umap_embeddings']