import asyncio
import torch
import torch.nn as nn
import torch.optim as optim

from app.threads.unlearn_GA_thread import UnlearningGAThread
from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders
from app.config.settings import MOMENTUM, WEIGHT_DECAY, DECREASING_LR

async def unlearning_GA(request, status, weights_path):
    print(f"Starting GA unlearning for class {request.forget_class} with {request.epochs} epochs...")
    set_seed(request.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    train_loader, test_loader, train_set, test_set = get_data_loaders(request.batch_size)
    # Create Unlearning Settings
    forget_indices = [i for i, (_, label) in enumerate(train_set) if label == request.forget_class]
    forget_subset = torch.utils.data.Subset(train_set, forget_indices)
    forget_loader = torch.utils.data.DataLoader(forget_subset, batch_size=request.batch_size, shuffle=True)

    model = get_resnet18().to(device)
    model.load_state_dict(torch.load(weights_path, map_location=device))
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=request.learning_rate, momentum=MOMENTUM, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.MultiStepLR(optimizer, milestones=DECREASING_LR, gamma=0.2)

    status.progress = 0
    status.forget_class = request.forget_class

    unlearning_thread = UnlearningGAThread(
        model=model, 
        device=device, 
        criterion=criterion,
        optimizer=optimizer,
        scheduler=scheduler,
        request=request,
        forget_loader=forget_loader,
        train_loader=train_loader, 
        test_loader=test_loader,
        train_set=train_set,
        test_set=test_set,
        status=status,
        model_name="resnet18",
        dataset_name=f"CIFAR10_GA_forget_class_{request.forget_class}"
    )
    
    unlearning_thread.start()

    # thread start

    while unlearning_thread.is_alive():
        if status.cancel_requested:
            unlearning_thread.stop()
            print("Cancellation requested, stopping the unlearning process...")
        await asyncio.sleep(0.2)  # Check status every 100ms

    status.is_unlearning = False
    print("unlearning canceled")

    # thread end

    if unlearning_thread.exception:
        print(f"An error occurred during custom unlearning: {str(unlearning_thread.exception)}")
    elif status.cancel_requested:
        print("Unlearning process was cancelled.")
    else:
        print("Unlearning process completed successfully.")

    return status

async def run_unlearning_GA(request, status, weights_path):
    try:
        status.is_unlearning = True
        updated_status = await unlearning_GA(request, status, weights_path)
        return updated_status
    finally:
        status.cancel_requested = False
        status.progress = 100