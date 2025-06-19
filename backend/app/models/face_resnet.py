import torch.nn as nn

class FaceNetClassifier(nn.Module):
    def __init__(self, backbone, classifier):
        super().__init__()
        self.backbone = backbone
        self.classifier = classifier
        
    def forward(self, x):
        emb = self.backbone(x)
        logits = self.classifier(emb)
        return logits
