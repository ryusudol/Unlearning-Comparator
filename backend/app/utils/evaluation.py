import torch
import numpy as np
import torch.nn.functional as F

import matplotlib.pyplot as plt
from scipy.stats import entropy

from torch_cka import CKA
from torch.utils.data import DataLoader, Subset
from app.config import UMAP_DATA_SIZE

import json

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

    def hook_fn(module, input, output):
        activations.append(output.detach().cpu().numpy())

    hook = model.avgpool.register_forward_hook(hook_fn)

    with torch.no_grad():
        for inputs, labels in data_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            outputs = model(inputs)
            _, predicted = outputs.max(1)
            predictions.extend(predicted.cpu().numpy())

            temperature = 2.0 
            scaled_outputs = outputs / temperature
            probs = F.softmax(scaled_outputs, dim=1)
            probabilities.extend(probs.cpu().numpy())

            sample_count += inputs.size(0)
            if sample_count >= num_samples:
                break

    hook.remove()

    activations = np.concatenate(activations, axis=0)[:num_samples].reshape(num_samples, -1)
    predictions = np.array(predictions)
    probabilities = np.array(probabilities)

    return activations, predictions, probabilities

# For training and retraining
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

# async def evaluate_model_with_distributions(model, data_loader, criterion, device):
#     model.eval()
#     total_loss = 0
#     correct = 0
#     total = 0
#     class_correct = [0] * 10
#     class_total = [0] * 10
#     label_distribution = np.zeros((10, 10))  # 실제 클래스 vs 예측 클래스
#     confidence_sum = np.zeros((10, 10))  # 실제 클래스 vs 모든 클래스의 confidence 합
#     with torch.no_grad():
#         for data in data_loader:
#             images, labels = data[0].to(device), data[1].to(device)
#             outputs = model(images)
#             loss = criterion(outputs, labels)
#             total_loss += loss.item()
            
#             # Add temperature scaling
#             temperature = 1.0
#             scaled_outputs = outputs / temperature
#             probabilities = F.softmax(scaled_outputs, dim=1)
#             _, predicted = torch.max(probabilities, 1)
            
#             total += labels.size(0)
#             correct += (predicted == labels).sum().item()
#             for i in range(labels.size(0)):
#                 label = labels[i].item()
#                 pred = predicted[i].item()
                
#                 class_total[label] += 1
#                 if label == pred:
#                     class_correct[label] += 1
                
#                 label_distribution[label][pred] += 1
#                 confidence_sum[label] += probabilities[i].cpu().numpy()

#     accuracy = correct / total
#     class_accuracies = {
#         i: (class_correct[i] / class_total[i] if class_total[i] > 0 else 0.0) 
#         for i in range(10)
#     }
#     avg_loss = total_loss / len(data_loader)

#     label_distribution = label_distribution / label_distribution.sum(axis=1, keepdims=True)
#     confidence_distribution = confidence_sum / np.array(class_total)[:, np.newaxis]
    
#     return avg_loss, accuracy, class_accuracies, label_distribution, confidence_distribution

def prepare_distribution_data(logit_entropies, max_logit_gaps):
    def convert_to_python_types(data):
        if isinstance(data, np.ndarray):
            return [round(float(x), 2) for x in data]
        elif isinstance(data, (np.float32, np.float64)):
            return round(float(data), 2)
        elif isinstance(data, list):
            return [round(float(x), 2) for x in data]
        return data

    # Get last 200 values and convert to Python types
    entropy_values = convert_to_python_types(logit_entropies[-200:])
    confidence_values = convert_to_python_types(max_logit_gaps[-200:])

    return {
        "entropy": {
            "values": entropy_values,
            "bins": 50,
            "range": [0.00, 2.50],
            "max_display": 40
        },
        "confidence": {
            "values": confidence_values,
            "bins": 50,
            "range": [-2.50, 10.00],
            "max_display": 40
        }
    }

def visualize_distributions(logit_entropies, max_logit_gaps, forget_class, temperature):
    def make_break_marks(ax, y_pos):
        kwargs = dict(transform=ax.transAxes, color='k', clip_on=False)
        dx, dy = 0.01, 0.01
        ax.plot((-dx, +dx), (y_pos-dy, y_pos+dy), **kwargs)
        ax.plot((-dx, +dx), (y_pos-2*dy, y_pos+2*dy), **kwargs)

    plt.figure(figsize=(13, 5))

    # Left plot (Entropy)
    plt.subplot(1, 2, 1)
    ax1 = plt.gca()
    counts, bin_edges = np.histogram(logit_entropies[-200:], bins=50, range=(0.0, 2.5))
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
    
    for x, count in zip(bin_centers, counts):
        if count <= 40:
            for y in range(count):
                plt.plot(x, y, 'o', color='gray', alpha=0.7, markersize=5)
        else:
            for y in range(39):
                plt.plot(x, y, 'o', color='gray', alpha=0.7, markersize=5)
            plt.plot(x, 42, 'o', color='gray', alpha=0.7, markersize=5)

    make_break_marks(ax1, 0.9)
    plt.title(f'Class {forget_class} Logit Entropy Distribution (Last 200)')
    plt.xlabel('Entropy')
    plt.ylabel('Count')
    plt.gca().yaxis.set_major_locator(plt.MultipleLocator(5))
    plt.xlim(0.0, 2.5)
    plt.ylim(-0.5, 43)
    plt.grid(True, alpha=0.2)

    # Right plot (Confidence)
    plt.subplot(1, 2, 2)
    ax2 = plt.gca()
    counts, bin_edges = np.histogram(max_logit_gaps[-200:], bins=50, range=(-2.5, 10.0))
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
    
    for x, count in zip(bin_centers, counts):
        if count <= 40:
            for y in range(count):
                plt.plot(x, y, 'o', color='gray', alpha=0.7, markersize=5)
        else:
            for y in range(39):
                plt.plot(x, y, 'o', color='gray', alpha=0.7, markersize=5)
            plt.plot(x, 42, 'o', color='gray', alpha=0.7, markersize=5)

    make_break_marks(ax2, 0.9)
    plt.title(f'Class {forget_class} Max Logit Confidence Distribution (Last 200)')
    plt.xlabel('Log Confidence Score')
    plt.ylabel('Count')
    plt.gca().yaxis.set_major_locator(plt.MultipleLocator(5))
    plt.xlim([-2.5, 10.0])
    plt.ylim(-0.5, 43)
    plt.grid(True, alpha=0.2)

    plt.tight_layout()
    plt.savefig(f'class_{forget_class}_entropy_distribution_{temperature}.png', dpi=300, bbox_inches='tight')
    plt.close()

async def evaluate_model_with_distributions(model, data_loader, criterion, device, forget_class=5, test=False):
    model.eval()
    total_loss = 0
    correct = 0
    total = 0
    class_correct = [0] * 10
    class_total = [0] * 10
    label_distribution = np.zeros((10, 10))  # ground truth vs predicted class
    confidence_sum = np.zeros((10, 10))  # ground truth vs sum of confidences for all classes
    
    # Add new arrays for logit statistics
    logit_entropies = []
    max_logit_gaps = []
    
    with torch.no_grad():
        for data in data_loader:
            images, labels = data[0].to(device), data[1].to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
            
            # Add temperature scaling
            temperature = 1.0
            scaled_outputs = outputs / temperature
            probabilities = F.softmax(scaled_outputs, dim=1)
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
                
                # Calculate logit statistics for forget_class samples only
                if labels[i].item() == forget_class:
                    logits = outputs[i]
                    
                    # For entropy: use softmax with temperature
                    scaled_logits = logits / temperature
                    probs = F.softmax(scaled_logits, dim=0).cpu().numpy()
                    logit_entropy = entropy(probs)
                    
                    # For confidence: use original logits with softmax (temperature=1.0)
                    max_prob_idx = np.argmax(probs)
                    prob_max = probs[max_prob_idx]
                    prob_others = 1 - prob_max
                    confidence_score = np.log(prob_max + 1e-45) - np.log(prob_others + 1e-45)
                    
                    logit_entropies.append(logit_entropy)
                    max_logit_gaps.append(confidence_score)

    accuracy = correct / total
    class_accuracies = {
        i: (class_correct[i] / class_total[i] if class_total[i] > 0 else 0.0) 
        for i in range(10)
    }
    avg_loss = total_loss / len(data_loader)

    label_distribution = label_distribution / label_distribution.sum(axis=1, keepdims=True)
    confidence_distribution = confidence_sum / np.array(class_total)[:, np.newaxis]
    
    # Print entropy statistics
    entropy_min = np.min(logit_entropies)
    entropy_max = np.max(logit_entropies)
    entropy_mean = np.mean(logit_entropies)
    print(f"Entropy statistics for class 6:")
    print(f"Min: {entropy_min:.4f}")
    print(f"Max: {entropy_max:.4f}")
    print(f"Mean: {entropy_mean:.4f}")
    
    # Prepare distribution data
    if test==False: # For training set
        distribution_data = prepare_distribution_data(logit_entropies, max_logit_gaps)
        # Save to JSON
        with open(f'class_{forget_class}_distribution_{temperature}.json', 'w') as f:
            json.dump(distribution_data, f, indent=4)

        # Visualize distributions
        visualize_distributions(logit_entropies, max_logit_gaps, forget_class, temperature)

    return avg_loss, accuracy, class_accuracies, label_distribution, confidence_distribution

async def calculate_cka_similarity(
    model_before, 
    model_after, 
    train_loader, 
    test_loader, 
    forget_class, 
    device
):
    # List of layers to analyze in ResNet18 model
    # conv1: First convolutional layer
    # layerX.Y: ResNet block Y in group X
    # fc: Final fully connected layer
    detailed_layers = [
        'conv1',
        'layer1.0',
        'layer1.1',     
        'layer2.0',     
        'layer2.1',     
        'layer3.0',     
        'layer3.1',  
        'layer4.0',     
        'layer4.1',
        'fc'
    ]
    
    cka = CKA(model_before, 
              model_after, 
              model1_name="Before Unlearning", 
              model2_name="After Unlearning",
              model1_layers=detailed_layers, 
              model2_layers=detailed_layers, 
              device=device)
    
    def filter_loader(loader, is_train=False):
        targets = loader.dataset.targets
        targets = torch.tensor(targets) if not isinstance(targets, torch.Tensor) else targets
        
        forget_indices = (targets == forget_class).nonzero(as_tuple=True)[0]
        other_indices = (targets != forget_class).nonzero(as_tuple=True)[0]

        if is_train:
            forget_samples = len(forget_indices) // 5
            other_samples = len(other_indices) // 5
        else:
            forget_samples = len(forget_indices)  
            other_samples = len(other_indices)

        forget_sampled = forget_indices[torch.randperm(len(forget_indices))[:forget_samples]]
        other_sampled = other_indices[torch.randperm(len(other_indices))[:other_samples]]

        forget_loader = DataLoader(
            Subset(loader.dataset, forget_sampled),
            batch_size=loader.batch_size,
            shuffle=False,
            num_workers=0,
            pin_memory=True
        )
        
        other_loader = DataLoader(
            Subset(loader.dataset, other_sampled), 
            batch_size=loader.batch_size,
            shuffle=False,
            num_workers=0,
            pin_memory=True
        )

        return forget_loader, other_loader

    forget_class_train_loader, other_classes_train_loader = filter_loader(train_loader, is_train=True)
    forget_class_test_loader, other_classes_test_loader = filter_loader(test_loader, is_train=False)
    
    with torch.no_grad():
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