import torch
import numpy as np
import torch.nn.functional as F
from torch_cka import CKA
from torch.utils.data import DataLoader, Subset
from app.config.settings import UMAP_DATA_SIZE
# from scipy.special import softmax
# import time

async def get_layer_activations_and_predictions(
    model, 
    data_loader, 
    device, 
    num_samples=UMAP_DATA_SIZE
):
    model.eval()
    activations = []
    predictions = []
    probabilities = []
    sample_count = 0

    # Hook function to capture the activations of the last layer
    def hook_fn(module, input, output):
        activations.append(output.detach().cpu().numpy())

    # Register the hook for the last layer
    hook = model.avgpool.register_forward_hook(hook_fn)

    with torch.no_grad():
        for inputs, labels in data_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            # Get predictions
            outputs = model(inputs)
            _, predicted = outputs.max(1)
            predictions.extend(predicted.cpu().numpy())

            # Add softmax probabilities with temperature scaling
            temperature = 2.0 
            scaled_outputs = outputs / temperature
            probs = F.softmax(scaled_outputs, dim=1)
            probabilities.extend(probs.cpu().numpy())

            sample_count += inputs.size(0)
            if sample_count >= num_samples:
                break

    # Remove the hook after collecting activations
    hook.remove()

    # Concatenate and reshape activations to the desired shape
    activations = np.concatenate(activations, axis=0)[:num_samples].reshape(num_samples, -1)
    predictions = np.array(predictions)
    probabilities = np.array(probabilities)

    return activations, predictions, probabilities

async def evaluate_model(model, data_loader, criterion, device):
    model.eval()
    total_loss = 0
    correct = 0
    total = 0
    class_correct = [0] * 10
    class_total = [0] * 10
    
    with torch.no_grad():
        for data in data_loader:
            images, labels = data[0].to(device), data[1].to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            c = (predicted == labels).squeeze()
            for i in range(len(labels)):
                label = labels[i]
                class_correct[label] += c[i].item()
                class_total[label] += 1
    
    accuracy = correct / total
    class_accuracies = {
        i: (class_correct[i] / class_total[i] if class_total[i] > 0 else 0.0) 
        for i in range(10)
    }
    avg_loss = total_loss / len(data_loader)
    print(f"Total correct: {correct}, Total samples: {total}")
    print(f"Overall accuracy: {accuracy:.3f}")
    for i in range(10):
        print(
            f"Class {i} correct: {class_correct[i]}, "
            f"total: {class_total[i]}, "
            f"accuracy: {class_accuracies[i]:.4f}"
        )
    return avg_loss, accuracy, class_accuracies

async def evaluate_model_with_distributions(model, data_loader, criterion, device):
    model.eval()
    total_loss = 0
    correct = 0
    total = 0
    class_correct = [0] * 10
    class_total = [0] * 10
    label_distribution = np.zeros((10, 10))  # 실제 클래스 vs 예측 클래스
    confidence_sum = np.zeros((10, 10))  # 실제 클래스 vs 모든 클래스의 confidence 합
    with torch.no_grad():
        for data in data_loader:
            images, labels = data[0].to(device), data[1].to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
            
            probabilities = F.softmax(outputs, dim=1)
            _, predicted = torch.max(probabilities, 1)
            
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            for i in range(labels.size(0)):
                label = labels[i].item()
                pred = predicted[i].item()
                
                class_total[label] += 1
                if label == pred:
                    class_correct[label] += 1
                
                label_distribution[label][pred] += 1
                confidence_sum[label] += probabilities[i].cpu().numpy()

    accuracy = correct / total
    class_accuracies = {i: (class_correct[i] / class_total[i] if class_total[i] > 0 else 0.0) for i in range(10)}
    avg_loss = total_loss / len(data_loader)

    label_distribution = label_distribution / label_distribution.sum(axis=1, keepdims=True)
    confidence_distribution = confidence_sum / np.array(class_total)[:, np.newaxis]
    
    return avg_loss, accuracy, class_accuracies, label_distribution, confidence_distribution


async def calculate_cka_similarity(
        model_before, 
        model_after, 
        train_loader, 
        test_loader, 
        forget_class, 
        device
    ):
    detailed_layers = [
        'conv1',
        'layer1.0.conv1', 'layer1.0.conv2', 'layer1.1.conv1', 'layer1.1.conv2',
        'layer2.0.conv1', 'layer2.0.conv2', 'layer2.1.conv1', 'layer2.1.conv2',
        'layer3.0.conv1', 'layer3.0.conv2', 'layer3.1.conv1', 'layer3.1.conv2',
        'layer4.0.conv1', 'layer4.0.conv2', 'layer4.1.conv1', 'layer4.1.conv2',
        'fc'
    ]
    
    # detailed_layers = [conv1, bn1, relu, maxpool,
    #     layer1, layer1.0, layer1.0.conv1, layer1.0.bn1,
    #     layer1.0.relu, layer1.0.conv2, layer1.0.bn2, layer1.1, 
    #     layer1.1.conv1, layer1.1.bn1, layer1.1.relu, layer1.1.conv2, layer1.1.bn2, 
    #     layer2, layer2.0, layer2.0.conv1, layer2.0.bn1, layer2.0.relu,
    #     layer2.0.conv2, layer2.0.bn2, layer2.0.downsample, layer2.0.downsample.0, 
    #     layer2.0.downsample.1, layer2.1, layer2.1.conv1, layer2.1.bn1,
    #     layer2.1.relu, layer2.1.conv2, layer2.1.bn2,
    #     layer3, layer3.0, layer3.0.conv1, layer3.0.bn1,
    #     layer3.0.relu, layer3.0.conv2, layer3.0.bn2, layer3.0.downsample,
    #     layer3.0.downsample.0, layer3.0.downsample.1, layer3.1, layer3.1.conv1,
    #     layer3.1.bn1, layer3.1.relu, layer3.1.conv2, layer3.1.bn2,
    #     layer4, layer4.0, layer4.0.conv1, layer4.0.bn1, layer4.0.relu, 
    #     layer4.0.conv2, layer4.0.bn2, layer4.0.downsample, 
    #     layer4.0.downsample.0, layer4.0.downsample.1, layer4.1, layer4.1.conv1,
    #     layer4.1.bn1, layer4.1.relu, layer4.1.conv2, layer4.1.bn2,
    #     avgpool, fc
    # ]

    cka = CKA(model_before, 
              model_after, 
              model1_name="Before Unlearning", 
              model2_name="After Unlearning",
              model1_layers=detailed_layers, 
              model2_layers=detailed_layers, 
              device=device)

    def filter_loader(loader, condition, is_train=False):              
        indices = [i for i, (_, label) in enumerate(loader.dataset) if condition(label)]
        if is_train:
            num_samples = len(indices) // 10
        else:
            num_samples = len(indices) // 2
        
        sampled_indices = torch.randperm(len(indices))[:num_samples].tolist()
        final_indices = [indices[i] for i in sampled_indices]

        return DataLoader(
            Subset(loader.dataset, final_indices),
            batch_size=loader.batch_size,
            shuffle=False,
            num_workers=0
        )

    forget_class_train_loader = filter_loader(train_loader, lambda label: label == forget_class, is_train=True)
    other_classes_train_loader = filter_loader(train_loader, lambda label: label != forget_class, is_train=True)
    forget_class_test_loader = filter_loader(test_loader, lambda label: label == forget_class, is_train=False)
    other_classes_test_loader = filter_loader(test_loader, lambda label: label != forget_class, is_train=False)

    cka.compare(forget_class_train_loader, forget_class_train_loader)
    results_forget_train = cka.export()
    cka.compare(other_classes_train_loader, other_classes_train_loader)
    results_other_train = cka.export()
    cka.compare(forget_class_test_loader, forget_class_test_loader)
    results_forget_test = cka.export()
    cka.compare(other_classes_test_loader, other_classes_test_loader)
    results_other_test = cka.export()

    def format_cka_results(results):
        return [[round(float(value), 3) for value in layer_results] for layer_results in results['CKA'].tolist()]

    return {
        "similarity": {
            "layers": detailed_layers,
            "train": {
                "forget_class": format_cka_results(results_forget_train),
                "other_classes": format_cka_results(results_other_train)
            },
            "test": {
                "forget_class": format_cka_results(results_forget_test),
                "other_classes": format_cka_results(results_other_test)
            }
        }
    }