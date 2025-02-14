import asyncio
import os
import torch
import torch.nn as nn

from app.threads import UnlearningCustomThread
from app.utils.helpers import set_seed
from app.utils.data_loader import get_data_loaders
from app.models import get_resnet18
from app.config import UNLEARN_SEED


async def unlearning_custom(forget_class, status, weights_path):
    print(f"Starting custom unlearning inference for class {forget_class}...")
    set_seed(UNLEARN_SEED)
    (
        train_loader, 
        test_loader, 
        train_set, 
        test_set
    ) = get_data_loaders(
        batch_size=1000,
        augmentation=False
    )
    
    criterion = nn.CrossEntropyLoss()
    device = torch.device("cuda" if torch.cuda.is_available() 
                         else "mps" if torch.backends.mps.is_available() 
                         else "cpu")
    model_before = get_resnet18().to(device)
    model_after = get_resnet18().to(device)
    model_before.load_state_dict(torch.load("trained_models/0000.pth", map_location=device))
    model_after.load_state_dict(torch.load(weights_path, map_location=device))

    unlearning_thread = UnlearningCustomThread(
        forget_class=forget_class,
        status=status,
        model_before=model_before,
        model_after=model_after,
        train_loader=train_loader,
        test_loader=test_loader,
        train_set=train_set,
        test_set=test_set,
        criterion=criterion,
        device=device
    )
    unlearning_thread.start()
    print("unlearning started")
    # thread start
    while unlearning_thread.is_alive():
        await asyncio.sleep(0.1)
        if status.cancel_requested:
            unlearning_thread.stop()
            print("Cancellation requested, stopping the unlearning process...")
        
    status.is_unlearning = False
   
    if unlearning_thread.is_alive():
        print("Warning: Unlearning thread did not stop within the timeout period.")

    # thread end
    if unlearning_thread.exception:
        print(f"An error occurred during custom unlearning: {str(unlearning_thread.exception)}")
    elif status.cancel_requested:
        print("Unlearning process was cancelled.")
    else:
        print("Unlearning process completed successfully.")

    return status

async def run_unlearning_custom(forget_class, status, weights_path):
    try:
        status.is_unlearning = True
        updated_status = await unlearning_custom(forget_class, status, weights_path)
        return updated_status
    finally:
        status.is_unlearning = False
        status.cancel_requested = False
        status.progress = "Completed"
        os.remove(weights_path)