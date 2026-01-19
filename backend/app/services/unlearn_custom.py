import asyncio
import gc
import os
import torch
import torch.nn as nn

from app.threads import UnlearningCustomThread
from app.utils.helpers import set_seed
from app.utils.data_loader import get_data_loaders
from app.models import get_resnet18
from app.config import UNLEARN_SEED, GPU_ID


async def unlearning_custom(forget_class, status, weights_path, base_weights):
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
    device = torch.device(f"cuda:{GPU_ID}" if torch.cuda.is_available() 
                         else "mps" if torch.backends.mps.is_available() 
                         else "cpu")
    model = get_resnet18().to(device)
    model.load_state_dict(torch.load(weights_path, map_location=device))

    unlearning_thread = UnlearningCustomThread(
        forget_class=forget_class,
        status=status,
        model=model,
        train_loader=train_loader,
        test_loader=test_loader,
        train_set=train_set,
        test_set=test_set,
        criterion=criterion,
        device=device,
        base_weights=base_weights
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

    # Free memory before cleanup
    del unlearning_thread
    del model
    del train_loader, test_loader
    del train_set, test_set
    del criterion

    gc.collect()

    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    elif torch.backends.mps.is_available():
        torch.mps.empty_cache()

    return status

async def run_unlearning_custom(forget_class, status, weights_path, base_weights):
    try:
        status.is_unlearning = True
        updated_status = await unlearning_custom(forget_class, status, weights_path, base_weights)
        return updated_status
    finally:
        status.is_unlearning = False
        status.cancel_requested = False
        status.progress = "Completed"
        os.remove(weights_path)