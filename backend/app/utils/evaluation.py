import torch
import numpy as np
import torch.nn.functional as F
from torch_cka import CKA
from app.config.settings import UMAP_DATA_SIZE

async def get_layer_activations_and_predictions(
        model, 
        data_loader, 
        device, 
        forget_class=-1,
        num_samples=UMAP_DATA_SIZE
    ):
    model.eval()
    activations = []
    predictions = []
    logits = []
    sample_count = 0
    
    with torch.no_grad():
        for inputs, labels in data_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            # Get predictions
            outputs = model(inputs)
            _, predicted = outputs.max(1)
            predictions.extend(predicted.cpu().numpy())
            
            # Add logits for all classes
            logits.extend(outputs.cpu().numpy())
            
            # Get activations
            x = model.conv1(inputs)
            x = model.bn1(x)
            x = model.relu(x)
            x = model.maxpool(x)

            x = model.layer1(x)
            x = model.layer2(x)
            x = model.layer3(x)
            x = model.layer4(x)
            activations.append(x.cpu().numpy())

            sample_count += inputs.size(0)
            if sample_count >= num_samples:
                break

    activations = np.concatenate(activations, axis=0)[:num_samples]
    activations = activations.reshape(activations.shape[0], -1)

    predictions = np.array(predictions)[:num_samples]
    logits = np.array(logits)[:num_samples]
    
    # Calculate max logits
    max_logits = logits.max(axis=1)
    
    # Get the maximum logit value
    max_logit = max_logits.max()
    
    print(f"Mean max logit: {max_logits.mean():.4f}")
    print(f"Median max logit: {np.median(max_logits):.4f}")
    print(f"Min max logit: {max_logits.min():.4f}")
    print(f"Max max logit: {max_logit:.4f}")
    
    return activations, predictions, logits, max_logits.mean()

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
    class_accuracies = {i: (class_correct[i] / class_total[i] if class_total[i] > 0 else 0.0) for i in range(10)}
    avg_loss = total_loss / len(data_loader)
    print(f"Total correct: {correct}, Total samples: {total}")
    print(f"Overall accuracy: {accuracy:.3f}")
    for i in range(10):
        print(f"Class {i} correct: {class_correct[i]}, total: {class_total[i]}, accuracy: {class_accuracies[i]:.4f}")
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
    # Normalize distributions
    label_distribution = label_distribution / label_distribution.sum(axis=1, keepdims=True)
    confidence_distribution = confidence_sum / np.array(class_total)[:, np.newaxis]
    return avg_loss, accuracy, class_accuracies, label_distribution, confidence_distribution

async def calculate_cka_similarity(model_before, model_after, train_loader, test_loader, forget_class, device):
    detailed_layers = [
        'conv1',
        'layer1.0.conv1', 'layer1.0.conv2', 'layer1.1.conv1', 'layer1.1.conv2',
        'layer2.0.conv1', 'layer2.0.conv2', 'layer2.1.conv1', 'layer2.1.conv2',
        'layer3.0.conv1', 'layer3.0.conv2', 'layer3.1.conv1', 'layer3.1.conv2',
        'layer4.0.conv1', 'layer4.0.conv2', 'layer4.1.conv1', 'layer4.1.conv2',
        'fc'
    ]

    cka = CKA(model_before, 
              model_after, 
              model1_name="Before Unlearning", 
              model2_name="After Unlearning",
              model1_layers=detailed_layers, 
              model2_layers=detailed_layers, 
              device=device)

    def filter_loader(loader, condition):
        return torch.utils.data.DataLoader(
            torch.utils.data.Subset(
                loader.dataset,
                [i for i, (_, label) in enumerate(loader.dataset) if condition(label)]
            ),
            batch_size=loader.batch_size,
            shuffle=False
        )

    forget_class_train_loader = filter_loader(train_loader, lambda label: label == forget_class)
    other_classes_train_loader = filter_loader(train_loader, lambda label: label != forget_class)
    forget_class_test_loader = filter_loader(test_loader, lambda label: label == forget_class)
    other_classes_test_loader = filter_loader(test_loader, lambda label: label != forget_class)

    # 수정된 부분: compare 후 export 사용
    cka.compare(forget_class_train_loader)
    results_forget_train = cka.export()
    cka.compare(other_classes_train_loader)
    results_other_train = cka.export()
    cka.compare(forget_class_test_loader)
    results_forget_test = cka.export()
    cka.compare(other_classes_test_loader)
    results_other_test = cka.export()

    return {
        "similarity": {
            "layers": detailed_layers,
            "train": {
                "forget_class": results_forget_train['CKA'].tolist(),
                "other_classes": results_other_train['CKA'].tolist()
            },
            "test": {
                "forget_class": results_forget_test['CKA'].tolist(),
                "other_classes": results_other_test['CKA'].tolist()
            }
        }
    }