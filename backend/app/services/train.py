import asyncio
import torch
import torch.nn as nn
import torch.optim as optim

from app.threads.train_thread import TrainingThread
from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders
from app.config.settings import (
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
    ) = get_data_loaders(
        batch_size=request.batch_size,
        augmentation=True
    )
    model = get_resnet18().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(
        model.parameters(),
        lr=request.learning_rate,
        momentum=MOMENTUM,
        weight_decay=WEIGHT_DECAY
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=request.epochs,
    )
    # scheduler = optim.lr_scheduler.MultiStepLR(
    #     optimizer,
    #     milestones=[100, 150],
    #     gamma=0.1
    # )

    training_thread = TrainingThread(
        model,
        train_loader,
        test_loader,
        criterion,
        optimizer,
        scheduler,
        device,
        request.epochs,
        status,
        "resnet18",
        "CIFAR10",
        request.learning_rate
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