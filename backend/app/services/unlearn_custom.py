import torch
import torch.nn as nn
import asyncio
import time
import os
import sys

from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders
from app.utils.visualization import compute_umap_embeddings
from app.utils.evaluation import get_layer_activations_and_predictions, evaluate_model
from app.config.settings import UMAP_DATA_SIZE, UMAP_DATASET, UNLEARN_SEED

async def run_unlearning_custom(request, status, weights_path):
    print(f"Starting custom unlearning inference for class {request.forget_class}...")
    set_seed(UNLEARN_SEED) 
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    if torch.backends.mps.is_available():
        device = torch.device("mps")

    train_loader, test_loader, train_set, test_set = get_data_loaders(128)  # You can adjust batch size if needed

    model = get_resnet18().to(device)
    model.load_state_dict(torch.load(weights_path, map_location=device))
    
    criterion = nn.CrossEntropyLoss()

    status.is_unlearning = True
    status.progress = 0
    status.forget_class = request.forget_class

    try:
        # Evaluate on train set
        train_loss, train_accuracy, train_class_accuracies = await evaluate_model(model, train_loader, criterion, device)
        
        status.current_loss = train_loss
        status.current_accuracy = train_accuracy
        status.train_class_accuracies = train_class_accuracies

        print(f"\nTrain Loss: {train_loss:.4f}, Train Acc: {train_accuracy:.2f}%")
        print("Train Class Accuracies:")
        for i, acc in train_class_accuracies.items():
            print(f"  Class {i}: {acc:.2f}%")

        # Evaluate on test set
        test_loss, test_accuracy, test_class_accuracies = await evaluate_model(model, test_loader, criterion, device)
        
        status.test_loss = test_loss
        status.test_accuracy = test_accuracy
        status.test_class_accuracies = test_class_accuracies

        print(f"\nTest Loss: {test_loss:.4f}, Test Acc: {test_accuracy:.2f}%")
        print("Test Class Accuracies:")
        for i, acc in test_class_accuracies.items():
            print(f"  Class {i}: {acc:.2f}%")
        
        if UMAP_DATASET == 'train':
            dataset = train_set
        else:
            dataset = test_set
        subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
        subset = torch.utils.data.Subset(dataset, subset_indices)
        subset_loader = torch.utils.data.DataLoader(subset, batch_size=256, shuffle=False)
        
        print("\nComputing and saving UMAP embeddings...")
        activations, predicted_labels = await get_layer_activations_and_predictions(model, subset_loader, device)
        
        # Create forget_labels
        forget_labels = torch.tensor([label == request.forget_class for _, label in subset])
        
        umap_embeddings, svg_files = await compute_umap_embeddings(
            activations, 
            predicted_labels, 
            forget_class=request.forget_class,
            forget_labels=forget_labels
        )
        status.umap_embeddings = umap_embeddings
        status.svg_files = list(svg_files.values())
        print("Custom Unlearning inference and visualization completed!")

    except Exception as e:
        print(f"An error occurred during custom unlearning: {str(e)}")
    finally:
        status.is_unlearning = False
        status.cancel_requested = False

    # Clean up the uploaded weights file
    os.remove(weights_path)