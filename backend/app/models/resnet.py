from torchvision import models
import torch.nn as nn

def get_resnet18(num_classes=10):
    model = models.resnet18(weights="DEFAULT")
    model.conv1 = nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1, bias=False)
    model.maxpool = nn.Identity()
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model