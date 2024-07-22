from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from ..services.training import run_training
from ..models.neural_network import TrainingStatus

router = APIRouter()
status = TrainingStatus()

class TrainingRequest(BaseModel):
    seed: int
    batch_size: int
    learning_rate: float
    epochs: int

@router.post("/train")
async def start_training(request: TrainingRequest, background_tasks: BackgroundTasks):
    if status.is_training:
        return {"message": "Training is already in progress"}
    background_tasks.add_task(run_training, request, status)
    return {"message": "Training started"}

@router.get("/train/status")
async def get_status():
    return {
        "is_training": status.is_training,
        "progress": status.progress,
        "current_epoch": status.current_epoch,
        "total_epochs": status.total_epochs,
        "current_loss": status.current_loss,
        "best_loss": status.best_loss,
        "current_accuracy": status.current_accuracy,
        "best_accuracy": status.best_accuracy,
        "estimated_time_remaining": status.estimated_time_remaining
    }