import sys
import torch
import os
import tempfile
import asyncio
import time
from fastapi import UploadFile, BackgroundTasks
from app.models.neural_network import get_resnet18, InferenceStatus
from app.utils.helpers import get_data_loaders, get_layer_activations
from app.services.visualization import compute_umap_embeddings
from app.config.settings import UMAP_DATA_SIZE

async def calculate_accuracy(model, data_loader, device):
    correct = 0
    total = 0
    class_correct = [0] * 10
    class_total = [0] * 10

    with torch.no_grad():
        for data in data_loader:
            images, labels = data[0].to(device), data[1].to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

            c = (predicted == labels).squeeze()
            for i in range(len(labels)):
                label = labels[i]
                class_correct[label] += c[i].item()
                class_total[label] += 1

    accuracy = 100 * correct / total
    class_accuracies = {i: (100 * class_correct[i] / class_total[i] if class_total[i] > 0 else 0) for i in range(10)}

    return accuracy, class_accuracies

async def run_inference(file_content: bytes, status: InferenceStatus):
    status.is_inferencing = True
    status.progress = 0
    status.current_step = "Initializing"
    status.start_time = time.time()

    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name

    try:
        # Load model
        print("\nLoading model...")
        status.current_step = "Loading model"
        status.progress = 20
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = get_resnet18().to(device)
        model.load_state_dict(torch.load(tmp_path, map_location=device))
        model.eval()
        await asyncio.sleep(0)  # Allow other tasks to run

        # Prepare data
        print("Preparing data...")
        status.current_step = "Preparing data"
        status.progress = 40
        train_loader, test_loader, train_set, test_set = get_data_loaders(batch_size=256)
        await asyncio.sleep(0)  # Allow other tasks to run

        # Calculate accuracy for train set
        print("Calculating train set accuracy...")
        status.current_step = "Calculating train accuracy"
        status.progress = 60
        train_accuracy, train_class_accuracies = await calculate_accuracy(model, train_loader, device)
        status.train_accuracy = train_accuracy
        status.train_class_accuracies = train_class_accuracies
        await asyncio.sleep(0)  # Allow other tasks to run

        # Calculate accuracy for test set
        print("Calculating test set accuracy...")
        status.current_step = "Calculating test accuracy"
        status.progress = 80
        test_accuracy, test_class_accuracies = await calculate_accuracy(model, test_loader, device)
        status.test_accuracy = test_accuracy
        status.test_class_accuracies = test_class_accuracies
        await asyncio.sleep(0)  # Allow other tasks to run

        print("Inference and visualization completed!")
        print(f"Train Accuracy: {status.train_accuracy:.2f}%")
        print("Train Class Accuracies:")
        for i, acc in status.train_class_accuracies.items():
            print(f"  Class {i}: {acc:.2f}%")
        print(f"Test Accuracy: {status.test_accuracy:.2f}%")
        print("Test Class Accuracies:")
        for i, acc in status.test_class_accuracies.items():
            print(f"  Class {i}: {acc:.2f}%")
        sys.stdout.flush()
        await asyncio.sleep(0)
        
        # Get activations for UMAP
        print("Extracting activations...")
        status.current_step = "Extracting activations"
        status.progress = 90
        subset_indices = torch.randperm(len(test_set))[:UMAP_DATA_SIZE]
        subset_loader = torch.utils.data.DataLoader(
            torch.utils.data.Subset(test_set, subset_indices),
            batch_size=256, shuffle=False)
        activations = await get_layer_activations(model, subset_loader, device)
        await asyncio.sleep(0)  # Allow other tasks to run

        # Compute UMAP embeddings
        print("Computing and saving UMAP embeddings...")
        status.current_step = "Computing UMAP embeddings"
        status.progress = 95
        labels = torch.tensor([test_set.targets[i] for i in subset_indices])
        umap_embeddings, svg_files = await compute_umap_embeddings(activations, labels)

        status.umap_embeddings = umap_embeddings
        status.svg_files = list(svg_files.values())
        status.current_step = "Completed"
        status.progress = 100
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        status.current_step = "Error"

    finally:
        os.unlink(tmp_path)
        status.is_inferencing = False
        elapsed_time = time.time() - status.start_time
        status.estimated_time_remaining = max(0, 100 - status.progress) * elapsed_time / status.progress

