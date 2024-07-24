import torch
import os
import tempfile
import asyncio
import time
from fastapi import UploadFile, BackgroundTasks
from app.models.neural_network import get_resnet18, InferenceStatus
from app.utils.helpers import get_data_loaders, get_layer_activations
from app.services.visualization import compute_umap_embeddings
from app.config.settings import DATA_SIZE

async def start_inference(weights_file: UploadFile, background_tasks: BackgroundTasks, status: InferenceStatus):
    file_content = await weights_file.read()
    background_tasks.add_task(run_inference, file_content, status)
    return {"message": "Inference started"}

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
        _, test_set = get_data_loaders(batch_size=64)
        subset_indices = torch.randperm(len(test_set))[:DATA_SIZE]
        subset_loader = torch.utils.data.DataLoader(
            torch.utils.data.Subset(test_set, subset_indices),
            batch_size=64, shuffle=False)
        await asyncio.sleep(0)  # Allow other tasks to run

        # Get activations
        print("Extracting activations...")
        status.current_step = "Extracting activations"
        status.progress = 60
        activations = get_layer_activations(model, subset_loader, device)
        await asyncio.sleep(0)  # Allow other tasks to run

        # Compute UMAP embeddings
        print("Computing and saving UMAP embeddings...")
        status.current_step = "Computing UMAP embeddings"
        status.progress = 80
        labels = torch.tensor([test_set.targets[i] for i in subset_indices])
        umap_embeddings, svg_files = compute_umap_embeddings(activations, labels) # 임베딩 저장

        status.umap_embeddings = umap_embeddings
        status.svg_files = list(svg_files.values())
        status.current_step = "Completed"
        status.progress = 100
        print("Inference and visualization completed!")

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        status.current_step = "Error"

    finally:
        os.unlink(tmp_path)
        status.is_inferencing = False
        elapsed_time = time.time() - status.start_time
        status.estimated_time_remaining = max(0, 100 - status.progress) * elapsed_time / status.progress