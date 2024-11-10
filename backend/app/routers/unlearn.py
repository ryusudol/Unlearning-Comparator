from fastapi import (
    APIRouter, 
    BackgroundTasks, 
    HTTPException, 
    UploadFile, 
    File, 
    Form
)
from pydantic import BaseModel, Field
from app.services.unlearn_retrain import run_unlearning_retrain
from app.services.unlearn_RL import run_unlearning_RL
from app.services.unlearn_GA import run_unlearning_GA 
from app.services.unlearn_FT import run_unlearning_FT
from app.services.unlearn_custom import run_unlearning_custom

from app.models.neural_network import UnlearningStatus
import os

router = APIRouter()
status = UnlearningStatus()

class UnlearningRequest(BaseModel):
    # seed: int = UNLEARN_SEED
    batch_size: int = Field(
        default=128, 
        description="Batch size for unlearning"
    )
    learning_rate: float = Field(
        default=0.001, 
        description="Learning rate for unlearning"
    )
    epochs: int = Field(
        default=3, 
        ge=1, 
        description="Number of unlearning epochs"
    )
    forget_class: int = Field(
        default=4, 
        ge=-1, 
        lt=10, 
        description="Class to forget (0-9), -1 for original"
    )
    # weights_filename: str = Field(
    #     default="0000.pth", 
    #     description="Filename of the weights in trained_models folder"
    # )

@router.post("/unlearn/ga")
async def start_unlearning_ga(
    background_tasks: BackgroundTasks,
    request: UnlearningRequest
):
    if status.is_unlearning:
        raise HTTPException(
            status_code=400, 
            detail="Unlearning is already in progress"
        )
    status.reset()
    weights_path = 'trained_models/0000.pth'
    if not os.path.exists(weights_path):
        raise HTTPException(
            status_code=404, 
            detail=f"Weights '{weights_path}' not found in trained_models/ folder"
        )

    background_tasks.add_task(run_unlearning_GA, request, status, weights_path)
    return {"message": "GA Unlearning started"}

@router.post("/unlearn/rl")
async def start_unlearning_rl(
    background_tasks: BackgroundTasks,
    request: UnlearningRequest
):
    if status.is_unlearning:
        raise HTTPException(
            status_code=400, 
            detail="Unlearning is already in progress"
        )
    status.reset()
    weights_path = 'trained_models/0000.pth'
    if not os.path.exists(weights_path):
        raise HTTPException(
            status_code=404, 
            detail=f"Weights '{weights_path}' not found in trained_models/ folder"
        )

    background_tasks.add_task(run_unlearning_RL, request, status, weights_path)
    return {"message": "RL Unlearning started"}

@router.post("/unlearn/ft")
async def start_unlearning_ft(
    background_tasks: BackgroundTasks,
    request: UnlearningRequest
):
    if status.is_unlearning:
        raise HTTPException(
            status_code=400, 
            detail="Unlearning is already in progress"
        )
    status.reset()
    weights_path = 'trained_models/0000.pth'
    if not os.path.exists(weights_path):
        raise HTTPException(
            status_code=404, 
            detail=f"Weights '{weights_path}' not found in trained_models/ folder"
        )

    background_tasks.add_task(run_unlearning_FT, request, status, weights_path)
    return {"message": "FT Unlearning started"}

@router.post("/unlearn/retrain")
async def start_unlearning_retrain(
    request: UnlearningRequest, 
    background_tasks: BackgroundTasks
):
    if status.is_unlearning:
        raise HTTPException(
            status_code=400, 
            detail="Unlearning is already in progress"
        )
    status.reset()
    background_tasks.add_task(run_unlearning_retrain, request, status)
    return {"message": "Unlearning (retrain) started"}

@router.get("/unlearn/status")
async def get_unlearning_status():
    return {
        "is_unlearning": status.is_unlearning,
        "progress": status.progress,
        "recent_id": status.recent_id,
        "current_epoch": status.current_epoch,
        "total_epochs": status.total_epochs,
        "current_unlearn_loss": round(status.current_unlearn_loss, 2),
        "current_unlearn_accuracy": round(status.current_unlearn_accuracy, 2),
        "estimated_time_remaining": round(status.estimated_time_remaining + 60.0, 2) if status.progress != "idle" else 0,
    }

@router.post("/unlearn/custom")
async def start_unlearning_custom(
    background_tasks: BackgroundTasks,
    forget_class: int = Form(..., ge=-1, lt=10),
    weights_file: UploadFile = File(...)
):
    if status.is_unlearning:
        raise HTTPException(
            status_code=400, 
            detail="Unlearning is already in progress"
        )
    status.reset()

    weights_filename = f"custom_weights_{weights_file.filename}"
    weights_path = os.path.join('uploaded_models', weights_filename)
    os.makedirs('uploaded_models', exist_ok=True)
    
    with open(weights_path, "wb") as buffer:
        content = await weights_file.read()
        buffer.write(content)
    
    background_tasks.add_task(
        run_unlearning_custom, 
        forget_class, 
        status,
        weights_path
    )
    
    return {"message": "Custom Unlearning started"}

@router.post("/unlearn/cancel")
async def cancel_unlearning():
    if not status.is_unlearning:
        raise HTTPException(
            status_code=400, 
            detail="No unlearning in progress"
        )
    status.cancel_requested = True
    return {
        "message": "Cancellation requested. Unlearning will stop soon."
    }