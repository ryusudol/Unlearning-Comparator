import asyncio
import torch
import torch.nn as nn
import torch.optim as optim
import os

from app.threads import UnlearningFaceSCRUBThread
from app.models import get_facenet_model
from app.utils.helpers import set_seed
from app.utils.data_loader import get_face_data_loaders
from app.config import (
    MOMENTUM,
    WEIGHT_DECAY,
    DECREASING_LR,
    UNLEARN_SEED
)

async def unlearning_face_SCRUB(request, status, base_weights_path):
    print(f"Starting SCRUB unlearning for class {request.forget_class} with {request.epochs} epochs...")
    set_seed(UNLEARN_SEED)
    
    device = torch.device(
        "cuda" if torch.cuda.is_available() 
        else "mps" if torch.backends.mps.is_available() 
        else "cpu"
    )

    # Create Unlearning Settings
    model_before = get_facenet_model(device)
    model_after = get_facenet_model(device)
    
    model_before.load_state_dict(torch.load(f"unlearned_models/face/{request.forget_class}/000{request.forget_class}.pth", map_location=device))
    
    # Load base weights with filtering for face model
    state_dict = torch.load(base_weights_path, map_location=device)
    filtered_state_dict = {k: v for k, v in state_dict.items() if not k.startswith("logits")}
    model_after.load_state_dict(filtered_state_dict, strict=False)
    
    (
        train_loader,
        test_loader,
        train_set,
        test_set
    ) = get_face_data_loaders(
        batch_size=request.batch_size,
        augmentation=False,
        train_dir='./data/face/train',
        test_dir='./data/face/test'
    )

    # Create retain loader (excluding forget class)
    retain_indices = [
        i for i, (_, label) in enumerate(train_set)
        if label != request.forget_class
    ]
    retain_subset = torch.utils.data.Subset(
        dataset=train_set,
        indices=retain_indices
    )
    retain_loader = torch.utils.data.DataLoader(
        dataset=retain_subset,
        batch_size=request.batch_size,
        shuffle=True
    )

    # Create forget loader (only forget class)
    forget_indices = [
        i for i, (_, label) in enumerate(train_set)
        if label == request.forget_class
    ]
    forget_subset = torch.utils.data.Subset(
        dataset=train_set,
        indices=forget_indices
    )
    forget_loader = torch.utils.data.DataLoader(
        dataset=forget_subset,
        batch_size=request.batch_size,
        shuffle=True
    )

    criterion = nn.CrossEntropyLoss()
    
    # SCRUB specific hyperparameters (easily configurable here)
    scrub_config = {
        'alpha': 0.5,          # Knowledge distillation weight
        'beta': 0,             # Forget set loss weight (paper value: 0)
        'gamma': 1.0,          # Retain set loss weight
        'kd_temperature': 2.0, # Temperature for knowledge distillation
        'msteps': 100            # Maximum steps for forget set loss
    }
    
    optimizer = optim.SGD(
        params=model_after.parameters(),
        lr=request.learning_rate,
        momentum=MOMENTUM,
        weight_decay=WEIGHT_DECAY
    )
    
    # Use MultiStepLR for SCRUB
    scheduler = optim.lr_scheduler.MultiStepLR(
        optimizer=optimizer,
        milestones=DECREASING_LR,
        gamma=0.2
    )

    unlearning_SCRUB_thread = UnlearningFaceSCRUBThread(
        request=request,
        status=status,
        model_before=model_before,
        model_after=model_after,
        criterion=criterion,
        optimizer=optimizer,
        scheduler=scheduler,
        
        retain_loader=retain_loader,
        forget_loader=forget_loader,
        train_loader=train_loader,
        test_loader=test_loader,
        train_set=train_set,
        test_set=test_set,
        device=device,
        base_weights_path=base_weights_path,
        scrub_config=scrub_config
    )
    
    unlearning_SCRUB_thread.start()

    # thread start
    while unlearning_SCRUB_thread.is_alive():
        await asyncio.sleep(0.1)
        if status.cancel_requested:
            unlearning_SCRUB_thread.stop()
            print("Cancellation requested, stopping the unlearning process...")
        
    status.is_unlearning = False

    # thread end
    if unlearning_SCRUB_thread.exception:
        print(f"An error occurred during SCRUB unlearning: {str(unlearning_SCRUB_thread.exception)}")
    elif status.cancel_requested:
        print("Unlearning process was cancelled.")
    else:
        print("Unlearning process completed successfully.")

    return status

async def run_unlearning_face_SCRUB(request, status, base_weights_path):
    try:
        status.is_unlearning = True
        status.progress = "Unlearning"
        updated_status = await unlearning_face_SCRUB(request, status, base_weights_path)
        return updated_status
    finally:
        status.cancel_requested = False
        status.progress = "Completed"