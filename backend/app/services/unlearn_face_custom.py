import asyncio
import os
import torch
import torch.nn as nn

from app.threads import UnlearningFaceCustomThread
from app.utils.helpers import set_seed
from app.utils import get_face_data_loaders
from app.config import UNLEARN_SEED
from app.models import get_facenet_model


async def unlearning_face_custom(forget_class, status, weights_path, base_weights):
    print(f"Starting Face unlearning inference for class {forget_class}...")
    set_seed(UNLEARN_SEED)
    (
        train_loader, 
        test_loader, 
        train_set, 
        test_set
    ) = get_face_data_loaders(
        batch_size=32,
        augmentation=False,
        train_dir='./data/face/train',
        test_dir='./data/face/test'
    )
    
    criterion = nn.CrossEntropyLoss()
    device = torch.device("cuda" if torch.cuda.is_available() 
                         else "mps" if torch.backends.mps.is_available() 
                         else "cpu")

    model_before = get_facenet_model(device, pretrained=False)
    model_before.load_state_dict(torch.load(f"unlearned_models/face/{forget_class}/000{forget_class}.pth", map_location=device))
    model = get_facenet_model(device, pretrained=False)
    state_dict = torch.load(weights_path, map_location=device)
    filtered_state_dict = {k: v for k, v in state_dict.items() if not k.startswith("backbone.logits")}
    model.load_state_dict(filtered_state_dict, strict=False)

    unlearning_thread = UnlearningFaceCustomThread(
        forget_class=forget_class,
        status=status,
        model_before=model_before,
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

    while unlearning_thread.is_alive():
        await asyncio.sleep(0.1)
        if status.cancel_requested:
            unlearning_thread.stop()
            print("Cancellation requested, stopping the unlearning process...")
        
    status.is_unlearning = False
   
    if unlearning_thread.is_alive():
        print("Warning: Unlearning thread did not stop within the timeout period.")

    if unlearning_thread.exception:
        print(f"An error occurred during face unlearning: {str(unlearning_thread.exception)}")
    elif status.cancel_requested:
        print("Unlearning process was cancelled.")
    else:
        print("Unlearning process completed successfully.")

    return status

async def run_unlearning_face_custom(forget_class, status, weights_path, base_weights):
    try:
        status.is_unlearning = True
        updated_status = await unlearning_face_custom(forget_class, status, weights_path, base_weights)
        return updated_status
    finally:
        status.is_unlearning = False
        status.cancel_requested = False
        status.progress = "Completed"
        os.remove(weights_path)
