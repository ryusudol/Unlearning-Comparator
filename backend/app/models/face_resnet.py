import torch.nn as nn
from facenet_pytorch import InceptionResnetV1


def get_facenet_model(device, num_classes=10):
    model = InceptionResnetV1(classify=True, pretrained="vggface2", num_classes=num_classes).to(device)
    model.logits = nn.Linear(model.logits.in_features, num_classes).to(device)
    return model