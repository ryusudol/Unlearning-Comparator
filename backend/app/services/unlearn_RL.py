import asyncio
import torch
import torch.nn as nn
import torch.optim as optim

from app.threads.unlearn_RL_thread import UnlearningRLThread
from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders
from app.config.settings import MOMENTUM, WEIGHT_DECAY, DECREASING_LR

async def unlearning_RL(request, status, weights_path):
    print(f"Starting RL unlearning for class {request.forget_class} with {request.epochs} epochs...")
    set_seed(request.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    train_loader, test_loader, train_set, test_set = get_data_loaders(request.batch_size)

    model = get_resnet18().to(device)
    model.load_state_dict(torch.load(weights_path, map_location=device))
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=request.learning_rate, momentum=MOMENTUM, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.MultiStepLR(optimizer, milestones=DECREASING_LR, gamma=0.2)

    status.progress = 0
    status.forget_class = request.forget_class

    unlearning_thread = UnlearningRLThread(
        model=model, 
        device=device, 
        criterion=criterion,
        optimizer=optimizer,
        scheduler=scheduler,
        request=request,
        train_loader=train_loader, 
        test_loader=test_loader,
        train_set=train_set,
        test_set=test_set,
        status=status,
        model_name="resnet18",
        dataset_name=f"RL_forget_class_{request.forget_class}"
    )
    
    unlearning_thread.start()

    while unlearning_thread.is_alive():
        if status.cancel_requested:
            unlearning_thread.stop()
            print("Cancellation requested, stopping the unlearning process...")
        await asyncio.sleep(0.2)  # Check status every 200ms

    status.is_unlearning = False
    print("unlearning completed")

    if unlearning_thread.exception:
        print(f"An error occurred during RL unlearning: {str(unlearning_thread.exception)}")
    elif status.cancel_requested:
        print("Unlearning process was cancelled.")
    else:
        print("Unlearning process completed successfully.")

    return status

async def run_unlearning_RL(request, status, weights_path):
    try:
        status.is_unlearning = True
        updated_status = await unlearning_RL(request, status, weights_path)
        return updated_status
    finally:
        status.cancel_requested = False
        status.progress = 100