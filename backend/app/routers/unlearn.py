from fastapi import APIRouter, BackgroundTasks, HTTPException, File, UploadFile, Form
from pydantic import BaseModel, Field
from app.services.unlearn_retrain import run_unlearning
from app.services.unlearn_RL import run_unlearning_RL
from app.models.neural_network import UnlearningStatus
from app.config.settings import UNLEARN_SEED
import os
import tempfile

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

@router.post("/unlearn/rl")
async def start_unlearning_rl(
    background_tasks: BackgroundTasks,
    weights_file: UploadFile = File(...),
    seed: int = Form(UNLEARN_SEED),
    batch_size: int = Form(...),
    learning_rate: float = Form(...),
    epochs: int = Form(...),
    forget_class: int = Form(...)
):
    if status.is_unlearning:
        raise HTTPException(status_code=400, detail="Unlearning is already in progress")
    status.reset()  # Reset status before starting new unlearning

    # Create a temporary file to store the uploaded weights
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pth") as temp_file:
        temp_file.write(await weights_file.read())
        temp_file_path = temp_file.name

    request = UnlearningRequest(
        seed=seed,
        batch_size=batch_size,
        learning_rate=learning_rate,
        epochs=epochs,
        forget_class=forget_class
    )

    # Pass the temporary file path to the run_unlearning_RL function
    background_tasks.add_task(run_unlearning_RL, request, status, temp_file_path)
    
    return {"message": "RL Unlearning started"}

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