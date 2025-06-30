"""
Thread package for managing model training and unlearning operations.

This package provides thread classes that handle the actual computation for training
and various unlearning methods. Each thread runs independently and provides status tracking.

Available threads:
    TrainingThread: Handles model training operations
    UnlearningGAThread: Unlearning using gradient ascent method
    UnlearningRLThread: Unlearning using random labeling method
    UnlearningFTThread: Unlearning using fine-tuning method
    UnlearningGAFTThread: Unlearning using combined GA+FT method
    UnlearningGASLFTThread: Unlearning using GA+SL+FT method with second logit
    UnlearningSCRUBThread: Unlearning using SCRUB method
    UnlearningSalUnThread: Unlearning using SalUn gradient saliency method
    UnlearningRetrainThread: Unlearning by retraining from scratch
    UnlearningCustomThread: Custom unlearning method for inference

Each thread class follows a similar pattern:
1. Inherits from threading.Thread
2. Takes model, data, and optimization components as input
3. Implements run() method for the main computation loop
4. Provides methods for status updates and graceful termination
"""

from .train_thread import TrainingThread
from .unlearn_GA_thread import UnlearningGAThread
from .unlearn_RL_thread import UnlearningRLThread
from .unlearn_FT_thread import UnlearningFTThread
from .unlearn_GA_FT_thread import UnlearningGAFTThread
from .unlearn_GA_SL_FT_thread import UnlearningGASLFTThread
from .unlearn_SCRUB_thread import UnlearningSCRUBThread
from .unlearn_SalUn_thread import UnlearningSalUnThread
from .unlearn_retrain_thread import UnlearningRetrainThread
from .unlearn_custom_thread import UnlearningCustomThread

__all__ = ['TrainingThread', 'UnlearningGAThread', 'UnlearningRLThread', 'UnlearningFTThread', 'UnlearningGAFTThread', 'UnlearningGASLFTThread', 'UnlearningSCRUBThread', 'UnlearningSalUnThread', 'UnlearningRetrainThread', 'UnlearningCustomThread']