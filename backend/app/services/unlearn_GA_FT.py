import asyncio
import torch
import torch.nn as nn
import torch.optim as optim
import os

from app.threads import UnlearningGAFTThread
from app.models import get_resnet18
from app.utils.helpers import set_seed
from app.utils.data_loader import get_data_loaders
from app.config import (
    MOMENTUM,
    WEIGHT_DECAY,
    DECREASING_LR,
    UNLEARN_SEED,
    GPU_ID
)

async def unlearning_GA_FT(request, status, base_weights_path):
    print(f"Starting GA+FT unlearning for class {request.forget_class} with {request.epochs} epochs...")

    set_seed(UNLEARN_SEED)
    device = torch.device(
        f"cuda:{GPU_ID}" if torch.cuda.is_available() 
        else "mps" if torch.backends.mps.is_available() 
        else "cpu"
    )
    model_after = get_resnet18().to(device)
    model_after.load_state_dict(torch.load(base_weights_path, map_location=device))

    # Layer modification configuration
    freeze_first_k_layers = 0  # Freeze first K layer groups
    reinit_last_k_layers = 3   # Reinitialize last K layer groups
    
    if freeze_first_k_layers > 0 or reinit_last_k_layers > 0:
        print(f"Layer modifications: freeze_first_k={freeze_first_k_layers}, reinit_last_k={reinit_last_k_layers}")

    ETA_MIN = 0.003
    enable_epoch_metrics = False # Enable comprehensive epoch-wise metrics (UA, RA, TUA, TRA, PS, MIA)
    if enable_epoch_metrics:
        print("Epoch-wise metrics collection: ENABLED")

    # ========== GA+FT Configuration (easily configurable) ==========
    ga_lr_ratio = 0.05    # GA LR = request.lr * ga_lr_ratio (changeable)
    ga_batch_ratio = 32.0  # GA batch size = request.batch_size * ga_batch_ratio (changeable)
    # Examples:
    # - ga_batch_ratio = 0.5: GA uses half the batch size of FT
    # - ga_batch_ratio = 2.0: GA uses double the batch size of FT
    # - ga_batch_ratio = 1.0: GA uses same batch size as FT (default)
    # ================================================================
    
    ga_batch_size = int(request.batch_size * ga_batch_ratio)
    ft_batch_size = request.batch_size
    
    print(f"Learning rates - GA: {request.learning_rate * ga_lr_ratio:.5f}, FT: {request.learning_rate:.5f}")
    print(f"Batch sizes - GA: {ga_batch_size}, FT: {ft_batch_size}")

    (
        train_loader,
        test_loader,
        train_set,
        test_set
    ) = get_data_loaders(
        batch_size=request.batch_size,
        augmentation=True
    )

    # Create retain loader for FT (excluding forget class)
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
        batch_size=ft_batch_size,  # FT uses original batch size
        shuffle=True
    )

    # Create forget loader for GA (only forget class)
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
        batch_size=ga_batch_size,  # GA uses configured batch size
        shuffle=True
    )

    criterion = nn.CrossEntropyLoss()
    
    # Create two separate optimizers with different learning rates
    ga_optimizer = optim.SGD(
        params=model_after.parameters(),
        lr=request.learning_rate * ga_lr_ratio,
        momentum=MOMENTUM,
        weight_decay=WEIGHT_DECAY
    )
    
    # FT optimizer with original learning rate
    ft_optimizer = optim.SGD(
        params=model_after.parameters(),
        lr=request.learning_rate,
        momentum=MOMENTUM,
        weight_decay=WEIGHT_DECAY
    )
    
    # Option 1: MultiStepLR (original)
    # ga_scheduler = optim.lr_scheduler.MultiStepLR(
    #     optimizer=ga_optimizer,
    #     milestones=DECREASING_LR,
    #     gamma=0.2
    # )
    # ft_scheduler = optim.lr_scheduler.MultiStepLR(
    #     optimizer=ft_optimizer,
    #     milestones=DECREASING_LR,
    #     gamma=0.2
    # )
    
    # Option 2: CosineAnnealingLR (active)
    ga_scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer=ga_optimizer,
        T_max=request.epochs,
        eta_min=ETA_MIN * ga_lr_ratio
    )
    ft_scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer=ft_optimizer,
        T_max=request.epochs,
        eta_min=ETA_MIN
    )

    unlearning_GA_FT_thread = UnlearningGAFTThread(
        request=request,
        status=status,
        model_after=model_after,
        retain_loader=retain_loader,
        forget_loader=forget_loader,
        train_loader=train_loader,
        test_loader=test_loader,
        train_set=train_set,
        test_set=test_set,
        criterion=criterion,
        ga_optimizer=ga_optimizer,
        ft_optimizer=ft_optimizer,
        scheduler=ga_scheduler,  # Pass GA scheduler
        device=device,
        base_weights_path=base_weights_path,
        freeze_first_k_layers=freeze_first_k_layers,
        reinit_last_k_layers=reinit_last_k_layers,
        enable_epoch_metrics=enable_epoch_metrics
    )
    
    # Store additional configuration in the thread object
    unlearning_GA_FT_thread.ft_scheduler = ft_scheduler
    unlearning_GA_FT_thread.ga_batch_size = ga_batch_size
    unlearning_GA_FT_thread.ft_batch_size = ft_batch_size
    
    unlearning_GA_FT_thread.start()

    # thread start
    while unlearning_GA_FT_thread.is_alive():
        await asyncio.sleep(0.1)
        if status.cancel_requested:
            unlearning_GA_FT_thread.stop()
            print("Cancellation requested, stopping the unlearning process...")
        
    status.is_unlearning = False

    # thread end
    if unlearning_GA_FT_thread.exception:
        print(f"An error occurred during GA+FT unlearning: {str(unlearning_GA_FT_thread.exception)}")
    elif status.cancel_requested:
        print("Unlearning process was cancelled.")
    else:
        print("Unlearning process completed successfully.")

    return status

async def run_unlearning_GA_FT(request, status, base_weights_path):
    try:
        status.is_unlearning = True
        status.progress = "Unlearning"
        updated_status = await unlearning_GA_FT(request, status, base_weights_path)
        return updated_status
    finally:
        status.cancel_requested = False
        status.progress = "Completed"