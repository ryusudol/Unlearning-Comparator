"""
This module contains neural network model architectures and related data structures.
It includes implementations of ResNet and status tracking classes for training and unlearning processes.
"""

from app.models.resnet import get_resnet18
from app.models.status import TrainingStatus, UnlearningStatus

__all__ = [
    'get_resnet18',
    'TrainingStatus',
    'UnlearningStatus'
]