"""
This package contains route definitions for the API endpoints.
"""

from .train import router as train_router
from .unlearn import router as unlearn_router

__all__ = ['train_router', 'unlearn_router']