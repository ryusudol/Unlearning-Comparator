from fastapi import APIRouter, BackgroundTasks, HTTPException, Form
from pydantic import BaseModel, Field
from app.services.unlearn_retrain import run_unlearning
from app.services.unlearn_RL import run_unlearning_RL
from app.models.neural_network import UnlearningStatus
from app.config.settings import UNLEARN_SEED
import json
import os

router = APIRouter()
status = UnlearningStatus()

class UnlearningRequest(BaseModel):
    seed: int = UNLEARN_SEED
    batch_size: int = Field(default=128, description="Batch size for unlearning")
    learning_rate: float = Field(default=0.01, description="Learning rate for unlearning")
    epochs: int = Field(default=5, ge=1, description="Number of unlearning epochs")
    forget_class: int = Field(default=4, ge=0, lt=10, description="Class to forget (0-9)")
    weights_filename: str = Field(default=".", description="Filename of the weights in trained_models folder")

@router.post("/unlearn/rl")
async def start_unlearning_rl(
    background_tasks: BackgroundTasks,
    request: UnlearningRequest
):
    if status.is_unlearning:
        raise HTTPException(status_code=400, detail="Unlearning is already in progress")
    status.reset()  # Reset status before starting new unlearning

    # Check if the weights file exists
    weights_path = os.path.join('trained_models', request.weights_filename)
    if not os.path.exists(weights_path):
        raise HTTPException(status_code=404, detail=f"Weights file '{request.weights_filename}' not found in trained_models folder")

    # Pass the weights file path to the run_unlearning_RL function
    background_tasks.add_task(run_unlearning_RL, request, status, weights_path)
    
    return {"message": "RL Unlearning started"}

@router.post("/unlearn/retrain")
async def start_unlearning_retrain(request: UnlearningRequest, background_tasks: BackgroundTasks):
    if status.is_unlearning:
        raise HTTPException(status_code=400, detail="Unlearning is already in progress")
    status.reset()  # Reset status before starting new unlearning
    background_tasks.add_task(run_unlearning, request, status)
    return {"message": "Unlearning (retrain) started"}

@router.get("/unlearn/status")
async def get_unlearning_status():
    return {
        "is_unlearning": status.is_unlearning,
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
        "estimated_time_remaining": status.estimated_time_remaining,
        "forget_class": status.forget_class
    }

@router.get("/unlearn/result")
async def get_unlearning_result():
    if status.is_unlearning:
        raise HTTPException(status_code=400, detail="Unlearning is still in progress")
    if status.svg_files is None:
        raise HTTPException(status_code=404, detail="No unlearning results available")
    return {"svg_files": status.svg_files}

@router.post("/unlearn/cancel")
async def cancel_unlearning():
    if not status.is_unlearning:
        raise HTTPException(status_code=400, detail="No unlearning in progress")
    status.cancel_requested = True
    return {"message": "Cancellation requested. Unlearning will stop after the current epoch."}