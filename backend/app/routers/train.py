from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from app.services import run_training
from app.models import TrainingStatus
from app.config import (
	BATCH_SIZE, 
	LEARNING_RATE, 
	EPOCHS
)

router = APIRouter()
status = TrainingStatus()

class TrainingRequest(BaseModel):
    # seed: int = Field(default=1111, description="Random seed for reproducibility")
    batch_size: int = Field(default=BATCH_SIZE, description="Batch size for training")
    learning_rate: float = Field(default=LEARNING_RATE, description="Learning rate for optimizer")
    epochs: int = Field(default=EPOCHS, description="Number of training epochs")

@router.post("/train")
async def start_training(request: TrainingRequest, background_tasks: BackgroundTasks):
    if status.is_training:
        raise HTTPException(status_code=400, detail="Training is already in progress")
    status.reset()  # Reset status before starting new training
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
        "test_loss": status.test_loss,
        "test_accuracy": status.test_accuracy,
        "train_class_accuracies": status.train_class_accuracies,
        "test_class_accuracies": status.test_class_accuracies,
        "estimated_time_remaining": status.estimated_time_remaining
    }

@router.get("/train/result")
async def get_training_result():
    if status.is_training:
        raise HTTPException(status_code=400, detail="Training is still in progress")
    if status.svg_files is None:
        raise HTTPException(status_code=404, detail="No training results available")
    return {"svg_files": status.svg_files}

@router.post("/train/cancel")
async def cancel_training():
    if not status.is_training:
        raise HTTPException(status_code=400, detail="No training in progress")
    status.cancel_requested = True
    return {"message": "Cancellation requested. Training will stop after the current epoch."}