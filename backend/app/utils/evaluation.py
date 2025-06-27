import torch
import numpy as np
import torch.nn.functional as F

from torch_cka import CKA
from torch.utils.data import DataLoader, Subset
from app.config import UMAP_DATA_SIZE


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

async def get_layer_activations_and_predictions_face(
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

    hook = model.backbone.avgpool_1a.register_forward_hook(hook_fn)

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

async def evaluate_model_with_distributions(model, data_loader, criterion, device):
    model.eval()
    total_loss = 0
    correct = 0
    total = 0
    class_correct = [0] * 10
    class_total = [0] * 10
    label_distribution = np.zeros((10, 10))
    confidence_sum = np.zeros((10, 10))
    
    with torch.no_grad():
        for data in data_loader:
            images, raw_labels = data[0].to(device), data[1].to(device)
            
            if raw_labels.ndim > 1 and raw_labels.shape[1] > 1:
                labels = torch.argmax(raw_labels, dim=1)
            else:
                labels = raw_labels

            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
            
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

    accuracy = correct / total if total > 0 else 0.0
    class_accuracies = {
        i: (class_correct[i] / class_total[i] if class_total[i] > 0 else 0.0)
        for i in range(10)
    }
    avg_loss = total_loss / len(data_loader) if len(data_loader) > 0 else 0.0

    class_total_np = np.array(class_total)
    
    with np.errstate(divide='ignore', invalid='ignore'):
        label_dist_sum = label_distribution.sum(axis=1, keepdims=True)
        label_distribution = np.divide(label_distribution, label_dist_sum, out=np.zeros_like(label_distribution), where=label_dist_sum!=0)

    with np.errstate(divide='ignore', invalid='ignore'):
        confidence_distribution = np.divide(confidence_sum, class_total_np[:, np.newaxis], out=np.zeros_like(confidence_sum), where=class_total_np[:, np.newaxis]!=0)

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
            forget_samples = len(forget_indices) // 10
            other_samples = len(other_indices) // 10
        else:
            forget_samples = len(forget_indices) // 2
            other_samples = len(other_indices) // 2

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

async def calculate_cka_similarity_face(
    model_before,
    model_after,
    train_loader,
    test_loader,
    forget_class,
    device
):
    detailed_layers = [
        'backbone.conv2d_1a',
        'backbone.conv2d_2a',
        'backbone.conv2d_2b',
        'backbone.conv2d_3b',
        'backbone.conv2d_4a',
        'backbone.repeat_1',
        'backbone.mixed_6a',
        'backbone.repeat_2',
        'backbone.mixed_7a',
        'backbone.repeat_3',
        'backbone.block8',
        'backbone.avgpool_1a',
        'classifier'
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
            forget_samples = len(forget_indices) // 10
            other_samples = len(other_indices) // 10
        else:
            forget_samples = len(forget_indices) // 2
            other_samples = len(other_indices) // 2

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
    
    def get_fallback_cka_results(layer_count):
        return {'CKA': np.zeros((layer_count, layer_count))}
    
    # errors = []
    
    with torch.no_grad():
        try:
            cka.compare(forget_class_train_loader, forget_class_train_loader)
            results_forget_train = cka.export()
        except Exception as e:
            print(f"Error in forget_class_train CKA computation: {e}")
            results_forget_train = get_fallback_cka_results(len(detailed_layers))
            # errors.append({"type": "forget_class_train", "error": str(e)})
        
        try:
            cka.compare(other_classes_train_loader, other_classes_train_loader)
            results_other_train = cka.export()
        except Exception as e:
            print(f"Error in other_classes_train CKA computation: {e}")
            results_other_train = get_fallback_cka_results(len(detailed_layers))
            # errors.append({"type": "other_classes_train", "error": str(e)})
        
        try:
            cka.compare(forget_class_test_loader, forget_class_test_loader)
            results_forget_test = cka.export()
        except Exception as e:
            print(f"Error in forget_class_test CKA computation: {e}")
            results_forget_test = get_fallback_cka_results(len(detailed_layers))
            # errors.append({"type": "forget_class_test", "error": str(e)})
        
        try:
            cka.compare(other_classes_test_loader, other_classes_test_loader)
            results_other_test = cka.export()
        except Exception as e:
            print(f"Error in other_classes_test CKA computation: {e}")
            results_other_test = get_fallback_cka_results(len(detailed_layers))
            # errors.append({"type": "other_classes_test", "error": str(e)})

    def format_cka_results(results):
        return [[round(float(value), 3) for value in layer_results] for layer_results in results['CKA'].tolist()]

    result = {
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
    
    # if errors:
    #     result["errors"] = errors
    #     result["has_fallback_data"] = True
    
    return result