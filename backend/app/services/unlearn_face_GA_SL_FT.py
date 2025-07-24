import asyncio
import torch
import torch.nn as nn
import torch.optim as optim
import os

from app.threads import UnlearningFaceGASLFTThread
from app.models import get_facenet_model
from app.utils.helpers import set_seed
from app.utils.data_loader import get_face_data_loaders
from app.config import (
    MOMENTUM,
    WEIGHT_DECAY,
    DECREASING_LR,
    UNLEARN_SEED
)

def create_second_logit_dataset(model, forget_loader, device):
    """
    Create a second logit dataset for the forget class.
    For each forget class sample, use the second highest prediction (not the ground truth) as the new label.
    """
    model.eval()
    second_logit_data = []
    
    with torch.no_grad():
        for inputs, labels in forget_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            
            # Get the second highest prediction for each sample
            _, top_indices = torch.topk(outputs, k=2, dim=1)  # Get top 2 predictions
            second_logits = top_indices[:, 1]  # Take the second highest
            
            # Store the data with second logit labels
            for i in range(inputs.size(0)):
                second_logit_data.append((inputs[i].cpu(), second_logits[i].cpu()))
    
    return second_logit_data

async def unlearning_face_GA_SL_FT(request, status, base_weights_path):
    print(f"Starting GA+SL+FT unlearning for class {request.forget_class} with {request.epochs} epochs...")
    print(f"GA LR will be: {request.learning_rate / 10:.5f}, SL LR will be: {request.learning_rate * 2:.5f}, FT LR will be: {request.learning_rate:.5f}")
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
    model_after.load_state_dict(torch.load(base_weights_path, map_location=device), strict=False)
    
    # ========== GA+SL+FT Configuration (easily configurable) ==========
    ga_lr_ratio = 0.5     # GA LR = request.lr * ga_lr_ratio (same as GA_FT)
    sl_lr_ratio = 1.0     # SL LR = request.lr * sl_lr_ratio (configurable multiplier)
    ga_batch_ratio = 1.0  # GA batch size = request.batch_size * ga_batch_ratio
    sl_batch_ratio = 1.0  # SL batch size = request.batch_size * sl_batch_ratio
    ft_batch_ratio = 1.0  # FT batch size = request.batch_size * ft_batch_ratio
    # ================================================================
    
    # Calculate batch sizes
    ga_batch_size = int(request.batch_size * ga_batch_ratio)
    sl_batch_size = int(request.batch_size * sl_batch_ratio)
    ft_batch_size = int(request.batch_size * ft_batch_ratio)
    
    print(f"Batch sizes - GA: {ga_batch_size}, SL: {sl_batch_size}, FT: {ft_batch_size}")

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
        batch_size=ft_batch_size,
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
    second_logit_data = create_second_logit_dataset(
        model_after, forget_loader, device
    )
    
    # Create second logit loader
    second_logit_dataset = torch.utils.data.TensorDataset(
        torch.stack([data[0] for data in second_logit_data]),
        torch.stack([data[1] for data in second_logit_data])
    )
    second_logit_loader = torch.utils.data.DataLoader(
        dataset=second_logit_dataset,
        batch_size=sl_batch_size,
        shuffle=True
    )
    
    print(f"Second logit dataset created with {len(second_logit_data)} samples")

    criterion = nn.CrossEntropyLoss()
    
    # Create three separate optimizers with different learning rates
    ga_optimizer = optim.SGD(
        params=model_after.parameters(),
        lr=request.learning_rate * ga_lr_ratio,
        momentum=MOMENTUM,
        weight_decay=WEIGHT_DECAY
    )
    
    sl_optimizer = optim.SGD(
        params=model_after.parameters(),
        lr=request.learning_rate * sl_lr_ratio,
        momentum=MOMENTUM,
        weight_decay=WEIGHT_DECAY
    )
    
    ft_optimizer = optim.SGD(
        params=model_after.parameters(),
        lr=request.learning_rate,
        momentum=MOMENTUM,
        weight_decay=WEIGHT_DECAY
    )
    
    # Use MultiStepLR scheduler for GA optimizer (primary)
    ga_scheduler = optim.lr_scheduler.MultiStepLR(
        optimizer=ga_optimizer,
        milestones=DECREASING_LR,
        gamma=0.2
    )
    
    # Use MultiStepLR scheduler for SL optimizer
    sl_scheduler = optim.lr_scheduler.MultiStepLR(
        optimizer=sl_optimizer,
        milestones=DECREASING_LR,
        gamma=0.2
    )
    
    # Use MultiStepLR scheduler for FT optimizer  
    ft_scheduler = optim.lr_scheduler.MultiStepLR(
        optimizer=ft_optimizer,
        milestones=DECREASING_LR,
        gamma=0.2
    )

    unlearning_GA_SL_FT_thread = UnlearningFaceGASLFTThread(
        request=request,
        status=status,
        model_before=model_before,
        model_after=model_after,
        retain_loader=retain_loader,
        forget_loader=forget_loader,
        second_logit_loader=second_logit_loader,
        train_loader=train_loader,
        test_loader=test_loader,
        train_set=train_set,
        test_set=test_set,
        criterion=criterion,
        ga_optimizer=ga_optimizer,
        sl_optimizer=sl_optimizer,
        ft_optimizer=ft_optimizer,
        scheduler=ga_scheduler,  # Pass GA scheduler as primary
        device=device,
        base_weights_path=base_weights_path
    )
    
    # Store additional configuration in the thread object
    unlearning_GA_SL_FT_thread.sl_scheduler = sl_scheduler
    unlearning_GA_SL_FT_thread.ft_scheduler = ft_scheduler
    unlearning_GA_SL_FT_thread.ga_batch_size = ga_batch_size
    unlearning_GA_SL_FT_thread.sl_batch_size = sl_batch_size
    unlearning_GA_SL_FT_thread.ft_batch_size = ft_batch_size
    
    unlearning_GA_SL_FT_thread.start()

    # thread start
    while unlearning_GA_SL_FT_thread.is_alive():
        await asyncio.sleep(0.1)
        if status.cancel_requested:
            unlearning_GA_SL_FT_thread.stop()
            print("Cancellation requested, stopping the unlearning process...")
        
    status.is_unlearning = False

    # thread end
    if unlearning_GA_SL_FT_thread.exception:
        print(f"An error occurred during GA+SL+FT unlearning: {str(unlearning_GA_SL_FT_thread.exception)}")
    elif status.cancel_requested:
        print("Unlearning process was cancelled.")
    else:
        print("Unlearning process completed successfully.")

    return status

async def run_unlearning_face_GA_SL_FT(request, status, base_weights_path):
    try:
        status.is_unlearning = True
        status.progress = "Unlearning"
        updated_status = await unlearning_face_GA_SL_FT(request, status, base_weights_path)
        return updated_status
    finally:
        status.cancel_requested = False
        status.progress = "Completed"