import asyncio
import torch
import torch.nn as nn
import torch.optim as optim
from facenet_pytorch import InceptionResnetV1

from app.threads import UnlearningFaceGAThread
from app.models import FaceNetClassifier
from app.utils.helpers import set_seed
from app.utils.data_loader import get_face_data_loaders
from app.config import (
	MOMENTUM, 
	WEIGHT_DECAY, 
	DECREASING_LR,
	UNLEARN_SEED
)

async def unlearning_face_GA(request, status, base_weights_path):
    print(f"Starting GA unlearning for class {request.forget_class} with {request.epochs} epochs...")
    set_seed(UNLEARN_SEED)
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
    
    device = torch.device(
        "cuda" if torch.cuda.is_available() 
        else "mps" if torch.backends.mps.is_available() 
        else "cpu"
    )
    
    def get_facenet_model(pretrained=True):
        backbone = InceptionResnetV1(
            classify=False,
            pretrained="vggface2" if pretrained else None,
        )
        classifier = nn.Linear(512, 10)
        return FaceNetClassifier(backbone, classifier).to(device)

    # Create Unlearning Settings
    model_before = None
    model_after = get_facenet_model(pretrained=False)
    state_dict = torch.load(base_weights_path, map_location=device)
    filtered_state_dict = {
        k: v for k, v in state_dict.items() if not k.startswith("backbone.logits")
    }
    model_after.load_state_dict(filtered_state_dict, strict=False)
    
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
    unlearning_GA_thread = UnlearningFaceGAThread(
        request=request,
        status=status,
        model_before=model_before,
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
        base_weights_path=base_weights_path
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

async def run_unlearning_face_GA(request, status, base_weights_path):
    try:
        status.is_unlearning = True
        status.progress = "Unlearning"
        updated_status = await unlearning_face_GA(request, status, base_weights_path)
        return updated_status
    finally:
        status.cancel_requested = False
        status.progress = "Completed"