import torch
import os
import tempfile
from app.models.neural_network import get_resnet18
from app.utils.helpers import get_data_loaders, get_layer_activations
from app.services.visualization import compute_umap_embeddings

async def run_inference(weights_file, status):
    status.is_inferencing = True
    status.progress = 0
    status.current_step = "Initializing"

    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await weights_file.read())
        tmp_path = tmp.name

    try:
        # Load model
        status.current_step = "Loading model"
        status.progress = 10
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = get_resnet18().to(device)
        model.load_state_dict(torch.load(tmp_path, map_location=device))
        model.eval()

        # Prepare data
        status.current_step = "Preparing data"
        status.progress = 30
        _, test_set = get_data_loaders(batch_size=64)  # We only need the test set
        subset_indices = torch.randperm(len(test_set))[:5000]  # Sample 5000 images
        subset_loader = torch.utils.data.DataLoader(
            torch.utils.data.Subset(test_set, subset_indices),
            batch_size=64, shuffle=False)

        # Get activations
        status.current_step = "Extracting activations"
        status.progress = 50
        activations = get_layer_activations(model, subset_loader, device)

        # Compute UMAP embeddings
        status.current_step = "Computing UMAP embeddings"
        status.progress = 70
        labels = torch.tensor([test_set.targets[i] for i in subset_indices])
        umap_embeddings, svg_files = compute_umap_embeddings(activations, labels)

        # Save SVG files
        status.current_step = "Saving SVG files"
        status.progress = 90
        save_dir = 'umap_visualizations'
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)
        
        for layer, svg_content in svg_files.items():
            filename = f'umap_inference_layer_{layer}.svg'
            filepath = os.path.join(save_dir, filename)
            with open(filepath, 'wb') as f:
                f.write(svg_content)

        status.umap_embeddings = umap_embeddings
        status.svg_files = svg_files
        status.current_step = "Completed"
        status.progress = 100

        return {"umap_embeddings": "Computed", "svg_files": "Generated and saved"}

    finally:
        # Clean up the temporary file
        os.unlink(tmp_path)
        status.is_inferencing = False