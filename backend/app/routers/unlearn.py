from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from app.services.unlearn_retrain import run_unlearning
from app.models.neural_network import UnlearningStatus
from app.config.settings import UNLEARN_SEED

router = APIRouter()
status = UnlearningStatus()

class UnlearningRequest(BaseModel):
    seed: int = Field(default=UNLEARN_SEED)
    batch_size: int
    learning_rate: float
    epochs: int
    forget_class: int

@router.post("/unlearn/retrain")
async def start_unlearning(request: UnlearningRequest, background_tasks: BackgroundTasks):
    if status.is_unlearning:
        raise HTTPException(status_code=400, detail="Unlearning is already in progress")
    status.reset()  # Reset status before starting new unlearning
    background_tasks.add_task(run_unlearning, request, status)
    return {"message": "Unlearning started"}

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