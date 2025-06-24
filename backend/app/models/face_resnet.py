import torch.nn as nn
from facenet_pytorch import InceptionResnetV1

class FaceNetClassifier(nn.Module):
    def __init__(self, backbone, classifier):
        super().__init__()
        self.backbone = backbone
        self.classifier = classifier
        
    def forward(self, x):
        emb = self.backbone(x)
        logits = self.classifier(emb)
        return logits

def get_facenet_model(device, pretrained=True):
    backbone = InceptionResnetV1(
        classify=False,
        pretrained="vggface2" if pretrained else None,
    )
    classifier = nn.Linear(512, 10)
    return FaceNetClassifier(backbone, classifier).to(device)
