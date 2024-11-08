from torchvision import models
import torch.nn as nn

def get_resnet18(num_classes=10):
    model = models.resnet18(weights=None, num_classes=num_classes)  
    # Set weights=None to use untrained model
    model.conv1 = nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1, bias=False)
    model.maxpool = nn.Identity()
    return model