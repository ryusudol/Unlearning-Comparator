"""
This package contains route definitions for the API endpoints.

Available routers:
- train_router: Handles model training related endpoints
- unlearn_router: Manages model unlearning operations
- data_router: Manages data operations and preprocessing

These routers are used to organize and structure the API endpoints
for different functionalities of the application.
"""

from .train import router as train_router
from .unlearn import router as unlearn_router
from .data import router as data_router	

__all__ = ['train_router', 'unlearn_router', 'data_router']