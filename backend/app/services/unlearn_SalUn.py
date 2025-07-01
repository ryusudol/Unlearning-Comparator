import asyncio
import torch
import torch.nn as nn
import torch.optim as optim
from app.threads import UnlearningSalUnThread
from app.models import get_resnet18
from app.utils.helpers import set_seed
from app.utils.data_loader import get_data_loaders
from app.config import (
    MOMENTUM,
    WEIGHT_DECAY,
    DECREASING_LR,
    UNLEARN_SEED
)

async def unlearning_SalUn(request, status, base_weights_path):
    print(f"Starting SalUn unlearning for class {request.forget_class} with {request.epochs} epochs...")
    print(f"SalUn configuration: threshold={0.1}, random_labels={True}, lr={request.learning_rate}")
    
    # Epoch metrics configuration
    enable_epoch_metrics = False  # Enable comprehensive epoch-wise metrics (UA, RA, TUA, TRA, PS, MIA)

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
    
    model_before.load_state_dict(torch.load(f"unlearned_models/{request.forget_class}/000{request.forget_class}.pth", map_location=device))
    model_after.load_state_dict(torch.load(base_weights_path, map_location=device))
    
    (
        train_loader,
        test_loader,
        train_set,
        test_set
    ) = get_data_loaders(
        batch_size=request.batch_size,
        augmentation=False
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
    
    # SalUn specific hyperparameters (official code settings for CIFAR-10 ResNet-18)
    salun_config = {
        'saliency_threshold': 0.1,      # salient weights
        'use_random_labels': True,      # Use random labeling on forget data (RL method)
        'grad_clip': 100.0,               # Gradient clipping norm
    }
    
    optimizer = optim.SGD(
        params=model_after.parameters(),
        lr=request.learning_rate,
        momentum=MOMENTUM,
        weight_decay=WEIGHT_DECAY
    )
    
    # Use MultiStepLR for SalUn (same as other methods)
    scheduler = optim.lr_scheduler.MultiStepLR(
        optimizer=optimizer,
        milestones=DECREASING_LR,
        gamma=0.2
    )

    unlearning_SalUn_thread = UnlearningSalUnThread(
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
        salun_config=salun_config,
        enable_epoch_metrics=enable_epoch_metrics
    )
    
    unlearning_SalUn_thread.start()

    # thread start
    while unlearning_SalUn_thread.is_alive():
        await asyncio.sleep(0.1)
        if status.cancel_requested:
            unlearning_SalUn_thread.stop()
            print("Cancellation requested, stopping the unlearning process...")
        
    status.is_unlearning = False

    # thread end
    if unlearning_SalUn_thread.exception:
        print(f"An error occurred during SalUn unlearning: {str(unlearning_SalUn_thread.exception)}")
    elif status.cancel_requested:
        print("Unlearning process was cancelled.")
    else:
        print("Unlearning process completed successfully.")

    return status

async def run_unlearning_SalUn(request, status, base_weights_path):
    try:
        status.is_unlearning = True
        status.progress = "Unlearning"
        updated_status = await unlearning_SalUn(request, status, base_weights_path)
        return updated_status
    finally:
        status.cancel_requested = False
        status.progress = "Completed"