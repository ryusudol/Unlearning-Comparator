import asyncio
import os
import torch
from app.threads.unlearn_custom_thread import UnlearningInference
from app.utils.helpers import get_data_loaders
from app.utils.visualization import compute_umap_embeddings
from app.utils.evaluation import get_layer_activations_and_predictions
from app.config.settings import UMAP_DATA_SIZE, UMAP_DATASET

async def unlearning_custom(request, status, weights_path):
    print(f"Starting custom unlearning inference for class {request.forget_class}...")
    
    status.progress = 0
    status.forget_class = request.forget_class

    unlearning_thread = UnlearningInference(request, status, weights_path)
    unlearning_thread.start()

    while unlearning_thread.is_alive():
        await asyncio.sleep(0.1)  # Check status every 100ms

    if unlearning_thread.exception:
        print(f"An error occurred during custom unlearning: {str(unlearning_thread.exception)}")
        return status

    if not status.cancel_requested and unlearning_thread.model is not None:  # Check if model exists
        device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
        _, _, train_set, test_set = get_data_loaders(128)
        model = unlearning_thread.model  # Get the updated model

        dataset = train_set if UMAP_DATASET == 'train' else test_set
        subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
        subset = torch.utils.data.Subset(dataset, subset_indices)
        subset_loader = torch.utils.data.DataLoader(subset, batch_size=UMAP_DATA_SIZE, shuffle=False)
        
        print("\nComputing and saving UMAP embeddings...")
        activations, predicted_labels = await get_layer_activations_and_predictions(
            model=model,
            data_loader=subset_loader,
            device=device,
            forget_class=request.forget_class
        )
        status.progress = 90

        forget_labels = torch.tensor([label == request.forget_class for _, label in subset])
        umap_embeddings, svg_files = await compute_umap_embeddings(
            activations, 
            predicted_labels, 
            forget_class=request.forget_class,
            forget_labels=forget_labels
        )
        status.umap_embeddings = umap_embeddings
        status.svg_files = list(svg_files.values())
        status.progress = 100

        print("Custom Unlearning inference and visualization completed!")
    else:
        print("Custom Unlearning cancelled or model not available.")

    return status

async def run_unlearning_custom(request, status, weights_path):
    try:
        status.is_unlearning = True
        updated_status = await unlearning_custom(request, status, weights_path)
        return updated_status
    finally:
        status.is_unlearning = False
        status.cancel_requested = False
        status.progress = 100
        os.remove(weights_path)