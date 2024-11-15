import asyncio
import torch
import torch.nn as nn
import torch.optim as optim

from app.threads import UnlearningRetrainThread
from app.models import get_resnet18
from app.utils.helpers import set_seed
from app.utils.data_loader import get_data_loaders
from app.utils.visualization import (
	compute_umap_embedding,
)
from app.utils.evaluation import (
	get_layer_activations_and_predictions,
)
from app.config import (
    MOMENTUM,
    WEIGHT_DECAY,
    UNLEARN_SEED
)

async def unlearning_retrain(request, status):
    print(
        f"Starting unlearning for class {request.forget_class} "
        f"with {request.epochs} epochs..."
    )
    set_seed(UNLEARN_SEED)
    device = torch.device(
        "cuda" if torch.cuda.is_available() 
        else "mps" if torch.backends.mps.is_available() 
        else "cpu"
    )

    (
        train_loader,
        test_loader,
        train_set,
        test_set
    ) = get_data_loaders(
        batch_size=request.batch_size,
        augmentation=True
    )
    
    # Create dataset excluding the forget class
    indices = [
        i for i, (_, label) in enumerate(train_set) 
        if label != request.forget_class
    ]
    subset = torch.utils.data.Subset(train_set, indices)
    unlearning_loader = torch.utils.data.DataLoader(
        dataset=subset,
        batch_size=request.batch_size,
        shuffle=True
    )

    model = get_resnet18().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(
        model.parameters(),
        lr=request.learning_rate,
        momentum=MOMENTUM,
        weight_decay=WEIGHT_DECAY,
        nesterov=True
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer=optimizer,
        T_max=request.epochs,
    )

    status.progress = 0
    status.forget_class = request.forget_class

    unlearning_thread = UnlearningRetrainThread(
        model=model,
        unlearning_loader=unlearning_loader,
        full_train_loader=train_loader,
        test_loader=test_loader,
        criterion=criterion,
        optimizer=optimizer,
        scheduler=scheduler,
        device=device,
        epochs=request.epochs,
        status=status,
        model_name="resnet18",
        dataset_name=f"CIFAR10_without_class_{request.forget_class}",
        learning_rate=request.learning_rate,
        forget_class=request.forget_class
    )
    unlearning_thread.start()
    
    while unlearning_thread.is_alive():
        await asyncio.sleep(0.5)
        if status.cancel_requested:
            unlearning_thread.stop()
            print("Cancel requested. Stopping unlearning thread...")
            break

    if unlearning_thread.exception:
        print(
            f"An error occurred during Retrain unlearning: "
            f"{str(unlearning_thread.exception)}"
        )
        return status

    return status

async def run_unlearning_retrain(request, status):
    try:
        status.is_unlearning = True
        status.progress = "Unlearning"
        updated_status = await unlearning_retrain(request, status)
        return updated_status
    finally:
        status.is_unlearning = False
        status.cancel_requested = False
        status.progress = 100