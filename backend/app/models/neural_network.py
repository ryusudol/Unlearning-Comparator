import torch.nn as nn
from torchvision import models

def get_resnet18(num_classes=10):
    return models.resnet18(weights=None, num_classes=num_classes)

class TrainingStatus:
    def __init__(self):
        self.is_training = False
        self.progress = 0
        self.current_epoch = 0
        self.total_epochs = 0
        self.current_loss = 0
        self.best_loss = float('inf')
        self.current_accuracy = 0
        self.best_accuracy = 0
        self.start_time = None
        self.estimated_time_remaining = None
        self.umap_embeddings = None
        self.svg_files = None

class InferenceStatus:
    def __init__(self):
        self.is_inferencing = False
        self.progress = 0
        self.current_step = ""
        self.umap_embeddings = None
        self.svg_files = None