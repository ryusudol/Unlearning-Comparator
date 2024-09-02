import asyncio
import torch
import torch.nn as nn
import torch.optim as optim

from app.threads.unlearn_GA_thread import UnlearningGAThread
from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders
from app.utils.visualization import compute_umap_embeddings
from app.utils.evaluation import get_layer_activations_and_predictions
from app.config.settings import UMAP_DATA_SIZE, MOMENTUM, UMAP_DATASET, WEIGHT_DECAY, DECREASING_LR

async def unlearning_GA(request, status, weights_path):
    print(f"Starting GA unlearning for class {request.forget_class} with {request.epochs} epochs...")
    set_seed(request.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")

    train_loader, test_loader, train_set, test_set = get_data_loaders(request.batch_size)

    # Create forget loader
    forget_indices = [i for i, (_, label) in enumerate(train_set) if label == request.forget_class]
    forget_subset = torch.utils.data.Subset(train_set, forget_indices)
    forget_loader = torch.utils.data.DataLoader(forget_subset, batch_size=request.batch_size, shuffle=True)

    model = get_resnet18().to(device)
    model.load_state_dict(torch.load(weights_path, map_location=device))
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=request.learning_rate, momentum=MOMENTUM, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.MultiStepLR(optimizer, milestones=DECREASING_LR, gamma=0.2)

    status.progress = 0
    status.forget_class = request.forget_class

    unlearning_thread = UnlearningGAThread(
        model, forget_loader, train_loader, test_loader, criterion, optimizer, scheduler,
        device, request.epochs, status, "resnet18", f"CIFAR10_GA_forget_class_{request.forget_class}",
        request.learning_rate, request.forget_class
    )
    unlearning_thread.start()

    while unlearning_thread.is_alive():
        await asyncio.sleep(0.1)  # Check status every 100ms

    if unlearning_thread.exception:
        print(f"An error occurred during GA unlearning: {str(unlearning_thread.exception)}")
        return status

    if not status.cancel_requested:
        model = unlearning_thread.model  # Get the updated model
        if UMAP_DATASET == 'train':
            dataset = train_set
        else:
            dataset = test_set
        subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
        subset = torch.utils.data.Subset(dataset, subset_indices)
        subset_loader = torch.utils.data.DataLoader(subset, batch_size=UMAP_DATA_SIZE, shuffle=False)
        
        print("\nComputing and saving UMAP embeddings...")
        activations, predicted_labels, logits, mean_logits = await get_layer_activations_and_predictions(
            model=model,
            data_loader=subset_loader,
            device=device,
            forget_class=request.forget_class
        )
        
        forget_labels = torch.tensor([label == request.forget_class for _, label in subset])
        
        umap_embeddings, svg_files = await compute_umap_embeddings(
            activations, 
            predicted_labels, 
            forget_class=request.forget_class,
            forget_labels=forget_labels
        )
        status.umap_embeddings = umap_embeddings
        status.svg_files = list(svg_files.values())
        print("GA Unlearning and visualization completed!")
    else:
        print("GA Unlearning cancelled.")

    return status

async def run_unlearning_GA(request, status, weights_path):
    try:
        status.is_unlearning = True
        updated_status = await unlearning_GA(request, status, weights_path)
        return updated_status
    finally:
        status.is_unlearning = False
        status.cancel_requested = False
        status.progress = 100