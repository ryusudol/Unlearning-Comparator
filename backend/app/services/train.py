import asyncio
import torch
import torch.nn as nn
import torch.optim as optim

from app.threads import TrainingThread
from app.models import get_resnet18
from app.utils import set_seed, get_cifar10_data_loaders
from app.config import (
    MOMENTUM,
    WEIGHT_DECAY,
    UNLEARN_SEED
)

async def training(request, status):
    print(f"Starting training with {request.epochs} epochs...")
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
    ) = get_cifar10_data_loaders(
        batch_size=request.batch_size,
        augmentation=True
    )
    model = get_resnet18().to(device=device)

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

    training_thread = TrainingThread(
        model=model,
        train_loader=train_loader,
        test_loader=test_loader,
        criterion=criterion,
        optimizer=optimizer,
        scheduler=scheduler,
        device=device,
        epochs=request.epochs,
        status=status,
        model_name="resnet18",
        dataset_name="CIFAR10",
        learning_rate=request.learning_rate
    )
    training_thread.start()

    while training_thread.is_alive():
        await asyncio.sleep(0.1)
        if status.cancel_requested:
            training_thread.stop()
            print("Cancel requested. Stopping training thread...")
            break

    return status

async def run_training(request, status):
    try:
        status.is_training = True
        status.cancel_requested = False
        updated_status = await training(request, status)
        return updated_status
    finally:
        status.is_training = False
        status.cancel_requested = False
        status.progress = 100