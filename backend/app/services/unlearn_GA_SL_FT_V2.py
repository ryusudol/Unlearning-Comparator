import asyncio
import time
import torch
import torch.nn as nn
import torch.optim as optim

from app.threads import UnlearningGASLFTV2Thread
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

def create_second_logit_dataset(model, forget_loader, device):
    """
    Create a second logit dataset for the forget class.
    For each forget class sample, use the second highest prediction (not the ground truth) as the new label.
    """
    model.eval()
    second_logit_data = []
    
    with torch.no_grad():
        for inputs, _ in forget_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            
            # Get the second highest prediction for each sample
            _, top_indices = torch.topk(outputs, k=2, dim=1)  # Get top 2 predictions
            second_logits = top_indices[:, 1]  # Take the second highest
            
            # Store the data with second logit labels
            for i in range(inputs.size(0)):
                second_logit_data.append((inputs[i].cpu(), second_logits[i].item()))
    
    return second_logit_data

async def unlearning_GA_SL_FT_V2(request, status, base_weights_path):
    print(f"Starting GA+SL+FT V2 unlearning for class {request.forget_class} with {request.epochs} epochs...")
    
    ETA_MIN = 0.001
    device = torch.device(
        f"cuda:{GPU_ID}" if torch.cuda.is_available() 
        else "mps" if torch.backends.mps.is_available() 
        else "cpu"
    )

    set_seed(UNLEARN_SEED)
    
    # Create Unlearning Settings
    model_after = get_resnet18().to(device)
    model_after.load_state_dict(torch.load(base_weights_path, map_location=device))
    
    # Layer modification configuration
    freeze_first_k_layers = 0  # Freeze first K layer groups
    reinit_last_k_layers = 3   # Reinitialize last K layer groups
    
    if freeze_first_k_layers > 0 or reinit_last_k_layers > 0:
        print(f"Layer modifications: freeze_first_k={freeze_first_k_layers}, reinit_last_k={reinit_last_k_layers}")
    
    # Epoch metrics configuration
    enable_epoch_metrics = False  # Enable comprehensive epoch-wise metrics (UA, RA, TUA, TRA, PS, MIA)

    if enable_epoch_metrics:
        print("Epoch-wise metrics collection: ENABLED")
    
    # ========== GA+SL+FT V2 Configuration (easily configurable) ==========
    ga_lr_ratio = 0.01    # GA LR = request.lr * ga_lr_ratio (same as GA_FT)
    mixed_lr_ratio = 1.0   # Mixed SL+FT LR = request.lr * mixed_lr_ratio
    ga_batch_ratio = 8.0  # GA batch size = request.batch_size * ga_batch_ratio
    mixed_batch_ratio = 1.0  # Mixed batch size = request.batch_size * mixed_batch_ratio
    # ================================================================
    
    # Calculate batch sizes
    ga_batch_size = int(request.batch_size * ga_batch_ratio)
    mixed_batch_size = int(request.batch_size * mixed_batch_ratio)
    
    print(f"Learning rates - GA: {request.learning_rate * ga_lr_ratio:.5f}, Mixed: {request.learning_rate * mixed_lr_ratio:.5f}")
    print(f"Batch sizes - GA: {ga_batch_size}, Mixed: {mixed_batch_size}")

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
        batch_size=mixed_batch_size,
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
        batch_size=ga_batch_size,
        shuffle=True
    )

    # Create second logit dataset using the original model
    print("Creating second logit dataset...")
    relabeling_start_time = time.time()
    second_logit_data = create_second_logit_dataset(
        model_after, forget_loader, device
    )
    
    # Create combined SL+FT dataset for mixed training
    print("Creating combined SL+FT dataset for mixed training...")
    
    # Combine second logit data with retain data
    combined_data = []
    combined_labels = []
    combined_types = []  # Track whether each sample is SL or FT
    
    # Add second logit data (marked as SL type)
    for data, label in second_logit_data:
        combined_data.append(data)
        combined_labels.append(label)  # label is already int from .item()
        combined_types.append(0)  # 0 for SL
    
    # Add retain data (marked as FT type) 
    for inputs, labels in retain_subset:
        combined_data.append(inputs)
        combined_labels.append(labels)  # labels is already int
        combined_types.append(1)  # 1 for FT
    
    # Create combined dataset
    combined_dataset = torch.utils.data.TensorDataset(
        torch.stack(combined_data),
        torch.tensor(combined_labels, dtype=torch.long),  # Convert all to tensor
        torch.tensor(combined_types, dtype=torch.long)
    )
    
    # Create mixed loader that shuffles SL and FT data together
    mixed_sl_ft_loader = torch.utils.data.DataLoader(
        dataset=combined_dataset,
        batch_size=mixed_batch_size,
        shuffle=True
    )
    
    print(f"Combined dataset created: {len(second_logit_data)} SL samples + {len(retain_subset)} FT samples = {len(combined_dataset)} total")
    relabeling_time = time.time() - relabeling_start_time
    
    print(f"Second logit dataset created with {len(second_logit_data)} samples (Time: {relabeling_time:.2f}s)")

    criterion = nn.CrossEntropyLoss()
    
    # Create two optimizers: GA and Mixed (SL+FT)
    ga_optimizer = optim.SGD(
        params=model_after.parameters(),
        lr=request.learning_rate * ga_lr_ratio,
        momentum=MOMENTUM,
        weight_decay=WEIGHT_DECAY
    )
    
    mixed_optimizer = optim.SGD(
        params=model_after.parameters(),
        lr=request.learning_rate * mixed_lr_ratio,
        momentum=MOMENTUM,
        weight_decay=WEIGHT_DECAY
    )
    
    # Option 1: MultiStepLR (original)
    # ga_scheduler = optim.lr_scheduler.MultiStepLR(
    #     optimizer=ga_optimizer,
    #     milestones=DECREASING_LR,
    #     gamma=0.2
    # )
    # mixed_scheduler = optim.lr_scheduler.MultiStepLR(
    #     optimizer=mixed_optimizer,
    #     milestones=DECREASING_LR,
    #     gamma=0.2
    # )
    
    # Option 2: CosineAnnealingLR (active)
    ga_scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer=ga_optimizer,
        T_max=request.epochs,
        eta_min=ETA_MIN * ga_lr_ratio
    )
    mixed_scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer=mixed_optimizer,
        T_max=request.epochs,
        eta_min=ETA_MIN * mixed_lr_ratio
    )

    unlearning_GA_SL_FT_V2_thread = UnlearningGASLFTV2Thread(
        request=request,
        status=status,
        model_after=model_after,
        retain_loader=retain_loader,
        forget_loader=forget_loader,
        mixed_sl_ft_loader=mixed_sl_ft_loader,  # Pass mixed loader instead
        train_loader=train_loader,
        test_loader=test_loader,
        train_set=train_set,
        test_set=test_set,
        criterion=criterion,
        ga_optimizer=ga_optimizer,
        mixed_optimizer=mixed_optimizer,
        scheduler=ga_scheduler,  # Pass GA scheduler as primary
        device=device,
        base_weights_path=base_weights_path,
        freeze_first_k_layers=freeze_first_k_layers,
        reinit_last_k_layers=reinit_last_k_layers,
        enable_epoch_metrics=enable_epoch_metrics
    )
    
    # Store additional configuration in the thread object
    unlearning_GA_SL_FT_V2_thread.mixed_scheduler = mixed_scheduler
    unlearning_GA_SL_FT_V2_thread.ga_batch_size = ga_batch_size
    unlearning_GA_SL_FT_V2_thread.mixed_batch_size = mixed_batch_size
    unlearning_GA_SL_FT_V2_thread.relabeling_time = relabeling_time
    
    unlearning_GA_SL_FT_V2_thread.start()

    # thread start
    while unlearning_GA_SL_FT_V2_thread.is_alive():
        await asyncio.sleep(0.1)
        if status.cancel_requested:
            unlearning_GA_SL_FT_V2_thread.stop()
            print("Cancellation requested, stopping the unlearning process...")
        
    status.is_unlearning = False

    # thread end
    if unlearning_GA_SL_FT_V2_thread.exception:
        print(f"An error occurred during GA+SL+FT V2 unlearning: {str(unlearning_GA_SL_FT_V2_thread.exception)}")
    elif status.cancel_requested:
        print("Unlearning process was cancelled.")
    else:
        print("Unlearning process completed successfully.")

    return status

async def run_unlearning_GA_SL_FT_V2(request, status, base_weights_path):
    try:
        status.is_unlearning = True
        status.progress = "Unlearning"
        updated_status = await unlearning_GA_SL_FT_V2(request, status, base_weights_path)
        return updated_status
    finally:
        status.cancel_requested = False
        status.progress = "Completed"