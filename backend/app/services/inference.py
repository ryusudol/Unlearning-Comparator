import sys
import torch
import torch.nn as nn
import os
import tempfile
import asyncio
import time
from app.models.neural_network import get_resnet18, InferenceStatus
from app.utils.helpers import get_data_loaders
from app.utils.visualization import compute_umap_embedding
from app.utils.evaluation import get_layer_activations_and_predictions, evaluate_model
from app.config.settings import UMAP_DATA_SIZE, UMAP_DATASET

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
        device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
        model = get_resnet18().to(device)
        model.load_state_dict(torch.load(tmp_path, map_location=device))
        model.eval()
        await asyncio.sleep(0)  # Allow other tasks to run

        # Prepare data
        print("Preparing data...")
        status.current_step = "Preparing data"
        status.progress = 40
        train_loader, test_loader, train_set, test_set = get_data_loaders(batch_size=1024)
        await asyncio.sleep(0)  # Allow other tasks to run

        # Calculate accuracy for train set
        print("Calculating train set accuracy...")
        status.current_step = "Calculating train accuracy"
        status.progress = 60
        _, train_accuracy, train_class_accuracies = await evaluate_model(model=model, data_loader=train_loader, criterion=nn.CrossEntropyLoss(), device=device)
        status.train_accuracy = train_accuracy
        status.train_class_accuracies = train_class_accuracies
        await asyncio.sleep(0)  # Allow other tasks to run

        # Calculate accuracy for test set
        print("Calculating test set accuracy...")
        status.current_step = "Calculating test accuracy"
        status.progress = 80
        _, test_accuracy, test_class_accuracies = await evaluate_model(model=model, data_loader=test_loader, criterion=nn.CrossEntropyLoss(), device=device)
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
        
        if UMAP_DATASET == 'train':
            dataset = train_set
        else:
            dataset = test_set

        subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
        subset_loader = torch.utils.data.DataLoader(
            torch.utils.data.Subset(dataset, subset_indices),
            batch_size=UMAP_DATA_SIZE, shuffle=False)
        activations, _, _, _ = await get_layer_activations_and_predictions(
            model, 
            subset_loader, 
            device
        )
        await asyncio.sleep(0)  # Allow other tasks to run

        # Compute UMAP embeddings
        print("Computing and saving UMAP embeddings...")
        status.current_step = "Computing UMAP embeddings"
        status.progress = 95
        labels = torch.tensor([dataset.targets[i] for i in subset_indices])
        umap_embeddings, svg_files = await compute_umap_embedding(activations, labels)

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