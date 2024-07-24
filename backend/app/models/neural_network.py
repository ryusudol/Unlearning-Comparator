import torch.nn as nn
from torchvision import models
from typing import List, Optional

def get_resnet18(num_classes=10):
    return models.resnet18(weights=None, num_classes=num_classes)

class TrainingStatus:
    def __init__(self):
        self.is_training = False
        self.progress = 0
        self.current_epoch = 0
        self.total_epochs = 0
        self.current_loss = 0
        self.best_loss = 9999.99
        self.current_accuracy = 0
        self.best_accuracy = 0
        self.start_time = None
        self.estimated_time_remaining = None
        self.umap_embeddings = None
        self.svg_files: Optional[List[str]] = None
        self.cancel_requested = False  
        
    def reset(self):
        self.__init__()

class InferenceStatus:
    def __init__(self):
        self.is_inferencing = False
        self.progress = 0
        self.current_step = ""
        self.start_time = None
        self.estimated_time_remaining = None
        self.umap_embeddings = None
        self.svg_files = None

    def reset(self):
        self.__init__()

class UnlearningStatus:
    def __init__(self):
        self.is_unlearning = False
        self.progress = 0
        self.current_epoch = 0
        self.total_epochs = 0
        self.current_loss = 0
        self.best_loss = 9999.99
        self.current_accuracy = 0
        self.best_accuracy = 0
        self.start_time = None
        self.estimated_time_remaining = None
        self.umap_embeddings = None
        self.svg_files: Optional[List[str]] = None
        self.cancel_requested = False
        self.forget_class = None

    def reset(self):
        self.__init__()