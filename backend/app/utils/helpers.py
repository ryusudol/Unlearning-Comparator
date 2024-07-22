import torch
import numpy as np
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from app.models.neural_network import get_resnet18

def set_seed(seed):
    torch.manual_seed(seed)
    np.random.seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)

def get_data_loaders(batch_size):
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])
    train_set = datasets.CIFAR10(root='./data', train=True, download=True, transform=transform)
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True)
    return train_loader, train_set

def get_layer_activations(model, data_loader, device, num_samples=5000):
    model.eval()
    activations = [[], [], [], []]
    with torch.no_grad():
        for inputs, _ in data_loader:
            inputs = inputs.to(device)
            x = model.conv1(inputs)
            x = model.bn1(x)
            x = model.relu(x)
            x = model.maxpool(x)

            x = model.layer1(x)
            activations[0].append(x.cpu().numpy())

            x = model.layer2(x)
            activations[1].append(x.cpu().numpy())

            x = model.layer3(x)
            activations[2].append(x.cpu().numpy())

            x = model.layer4(x)
            activations[3].append(x.cpu().numpy())

            if sum(len(a) for a in activations[0]) >= num_samples:
                break

    return [np.concatenate(act)[:num_samples] for act in activations]

def load_model(model_path, num_classes=10, device='cuda'):
    model = get_resnet18(num_classes=num_classes)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    return model