import asyncio
import torch
import torch.nn as nn
import torch.optim as optim

from app.threads.train_thread import TrainingThread
from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders
from app.utils.visualization import compute_umap_embeddings
from app.utils.evaluation import get_layer_activations_and_predictions
from app.config.settings import UMAP_DATA_SIZE, MOMENTUM, UMAP_DATASET, WEIGHT_DECAY, DECREASING_LR

async def training(request, status):
    print(f"Starting training with {request.epochs} epochs...")
    set_seed(request.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")

    train_loader, test_loader, train_set, test_set = get_data_loaders(request.batch_size)
    model = get_resnet18().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=request.learning_rate, momentum=MOMENTUM, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.MultiStepLR(optimizer, milestones=DECREASING_LR, gamma=0.2)

    status.is_training = True
    status.progress = 0

    training_thread = TrainingThread(
        model, train_loader, test_loader, criterion, optimizer, scheduler,
        device, request.epochs, status, "resnet18", "CIFAR10", request.learning_rate
    )
    training_thread.start()

    while training_thread.is_alive():
        await asyncio.sleep(0.1)  # Check status every 100ms

    if training_thread.exception:
        print(f"An error occurred during training: {str(training_thread.exception)}")
        return status

    if not status.cancel_requested:
        model = training_thread.model  # Get the updated model
        if UMAP_DATASET == 'train':
            dataset = train_set
        else:
            dataset = test_set
        subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
        subset = torch.utils.data.Subset(dataset, subset_indices)
        subset_loader = torch.utils.data.DataLoader(subset, batch_size=UMAP_DATA_SIZE, shuffle=False)
        
        print("\nComputing and saving UMAP embeddings...")
        activations, _ = await get_layer_activations_and_predictions(model, subset_loader, device)
        labels = torch.tensor([dataset.targets[i] for i in subset_indices])
        umap_embeddings, svg_files = await compute_umap_embeddings(activations, labels)
        status.umap_embeddings = umap_embeddings
        status.svg_files = list(svg_files.values())
        print("Training and visualization completed!")
    else:
        print("Training cancelled.")

    return status

async def run_training(request, status):
    try:
        updated_status = await training(request, status)
        return updated_status
    finally:
        status.is_training = False
        status.cancel_requested = False
        status.progress = 100