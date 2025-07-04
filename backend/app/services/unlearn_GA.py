import asyncio
import torch
import torch.nn as nn
import torch.optim as optim

from app.threads import UnlearningGAThread
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

async def unlearning_GA(request, status, base_weights_path):
    print(f"Starting GA unlearning for class {request.forget_class} with {request.epochs} epochs...")
    
    # Layer modification configuration (similar to SalUn config style)
    freeze_first_k_layers = 0  # Freeze first K layer groups
    freeze_last_k_layers = 3   # Freeze last K layer groups  
    reinit_last_k_layers = 0   # Reinitialize last K layer groups
    
    # Epoch metrics configuration
    enable_epoch_metrics = False  # Enable comprehensive epoch-wise metrics (UA, RA, TUA, TRA, PS, MIA)
    
    if freeze_first_k_layers > 0 or freeze_last_k_layers > 0 or reinit_last_k_layers > 0:
        print(f"Layer modifications: freeze_first_k={freeze_first_k_layers}, freeze_last_k={freeze_last_k_layers}, reinit_last_k={reinit_last_k_layers}")
    
    if enable_epoch_metrics:
        print("Epoch-wise metrics collection: ENABLED")
    
    set_seed(UNLEARN_SEED)
    
    device = torch.device(
        f"cuda:{GPU_ID}" if torch.cuda.is_available() 
        else "mps" if torch.backends.mps.is_available() 
        else "cpu"
    )

    # Create Unlearning Settings
    model_after = get_resnet18().to(device)
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
    scheduler = optim.lr_scheduler.MultiStepLR(
        optimizer=optimizer,
        milestones=DECREASING_LR,
        gamma=0.2
    )
    unlearning_GA_thread = UnlearningGAThread(
        request=request,
        status=status,
        model_after=model_after,
        criterion=criterion,
        optimizer=optimizer,
        scheduler=scheduler,
        
        forget_loader=forget_loader,
        train_loader=train_loader, 
        test_loader=test_loader,
        train_set=train_set,
        test_set=test_set,
        device=device, 
        base_weights_path=base_weights_path,
        freeze_first_k_layers=freeze_first_k_layers,
        freeze_last_k_layers=freeze_last_k_layers,
        reinit_last_k_layers=reinit_last_k_layers,
        enable_epoch_metrics=enable_epoch_metrics
    )
    unlearning_GA_thread.start()

    # thread start
    while unlearning_GA_thread.is_alive():
        await asyncio.sleep(0.1)
        if status.cancel_requested:
            unlearning_GA_thread.stop()
            print("Cancellation requested, stopping the unlearning process...")
        
    status.is_unlearning = False

    # thread end
    if unlearning_GA_thread.exception:
        print(f"An error occurred during GA unlearning: {str(unlearning_GA_thread.exception)}")
    elif status.cancel_requested:
        print("Unlearning process was cancelled.")
    else:
        print("Unlearning process completed successfully.")

    return status

async def run_unlearning_GA(request, status, base_weights_path):
    try:
        status.is_unlearning = True
        status.progress = "Unlearning"
        updated_status = await unlearning_GA(request, status, base_weights_path)
        return updated_status
    finally:
        status.cancel_requested = False
        status.progress = "Completed"