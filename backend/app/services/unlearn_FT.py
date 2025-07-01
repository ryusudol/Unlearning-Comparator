import asyncio
import torch
import torch.nn as nn
import torch.optim as optim
import os

from app.threads import UnlearningFTThread
from app.models import get_resnet18
from app.utils.helpers import set_seed
from app.utils.data_loader import get_data_loaders
from app.config import (
    MOMENTUM,
    WEIGHT_DECAY,
    DECREASING_LR,
    UNLEARN_SEED
)

async def unlearning_FT(request, status, base_weights_path):
    print(f"Starting FT unlearning for class {request.forget_class} with {request.epochs} epochs...")
    
    # Layer modification configuration (similar to SalUn config style)
    freeze_first_k_layers = 9  # Freeze first K layer groups
    reinit_last_k_layers = 0   # Reinitialize last K layer groups
    
    # Epoch metrics configuration
    enable_epoch_metrics = False  # Enable comprehensive epoch-wise metrics (UA, RA, TUA, TRA, PS, MIA)
    
    if freeze_first_k_layers > 0 or reinit_last_k_layers > 0:
        print(f"Layer modifications: freeze_first_k={freeze_first_k_layers}, reinit_last_k={reinit_last_k_layers}")
    
    if enable_epoch_metrics:
        print("Epoch-wise metrics collection: ENABLED")
    
    set_seed(UNLEARN_SEED)
    
    device = torch.device(
        "cuda" if torch.cuda.is_available() 
        else "mps" if torch.backends.mps.is_available() 
        else "cpu"
    )

    # Create Unlearning Settings
    model_before = get_resnet18().to(device)
    model_after = get_resnet18().to(device)
    
    print(f"Loading model_before from: unlearned_models/{request.forget_class}/000{request.forget_class}.pth")
    model_before.load_state_dict(torch.load(f"unlearned_models/{request.forget_class}/000{request.forget_class}.pth", map_location=device))
    
    print(f"Loading model_after (base) from: {base_weights_path}")
    base_state_dict = torch.load(base_weights_path, map_location=device)
    model_after.load_state_dict(base_state_dict)
    
    # Verify base model loaded correctly by checking a sample parameter
    print(f"Base model fc.weight[0:3, 0:3]: {model_after.fc.weight[:3, :3]}")
    print(f"Base weights path used: {base_weights_path}")
    
    (
        train_loader,
        test_loader,
        train_set,
        test_set
    ) = get_data_loaders(
        batch_size=request.batch_size,
        augmentation=True
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
    optimizer = optim.SGD(
        params=model_after.parameters(),
        lr=request.learning_rate,
        momentum=MOMENTUM,
        weight_decay=WEIGHT_DECAY
    )
    # Option 1: MultiStepLR (original)
    # scheduler = optim.lr_scheduler.MultiStepLR(
    #     optimizer=optimizer,
    #     milestones=DECREASING_LR,
    #     gamma=0.2
    # )
    
    #Option 2: CosineAnnealingLR
    scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer=optimizer,
        T_max=request.epochs,
        eta_min=0.001
    )
    
    # Option 3: LinearLR (linear decay)
    # scheduler = optim.lr_scheduler.LinearLR(
    #     optimizer=optimizer,
    #     start_factor=1.0,
    #     end_factor=0.001,
    #     total_iters=request.epochs
    # )
    
    # Option 4: CosineAnnealingWarmRestarts (cosine annealing with warm restarts)
    # scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(
    #     optimizer=optimizer,
    #     T_0=request.epochs // 4,  # First restart after T_0 epochs
    #     T_mult=1,  # Multiply T_0 by 2 after each restart
    #     eta_min=0.003
    # )

    unlearning_FT_thread = UnlearningFTThread(
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
        freeze_first_k_layers=freeze_first_k_layers,
        reinit_last_k_layers=reinit_last_k_layers,
        enable_epoch_metrics=enable_epoch_metrics
    )
    
    unlearning_FT_thread.start()

    # thread start
    while unlearning_FT_thread.is_alive():
        await asyncio.sleep(0.1)
        if status.cancel_requested:
            unlearning_FT_thread.stop()
            print("Cancellation requested, stopping the unlearning process...")
        
    status.is_unlearning = False

    # thread end
    if unlearning_FT_thread.exception:
        print(f"An error occurred during FT unlearning: {str(unlearning_FT_thread.exception)}")
    elif status.cancel_requested:
        print("Unlearning process was cancelled.")
    else:
        print("Unlearning process completed successfully.")

    return status

async def run_unlearning_FT(request, status, base_weights_path):
    try:
        status.is_unlearning = True
        status.progress = "Unlearning"
        updated_status = await unlearning_FT(request, status, base_weights_path)
        return updated_status
    finally:
        status.cancel_requested = False
        status.progress = "Completed"