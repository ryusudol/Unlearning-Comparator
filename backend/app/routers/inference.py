from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.models.neural_network import InferenceStatus
from app.services.inference import run_inference

router = APIRouter()
status = InferenceStatus()

@router.post("/inference")
async def start_inference_route(background_tasks: BackgroundTasks, weights_file: UploadFile = File(...)):
    if status.is_inferencing:
        raise HTTPException(status_code=400, detail="Inference is already in progress")
    status.reset()  # Reset status before starting new inference
    file_content = await weights_file.read()
    background_tasks.add_task(run_inference, file_content, status)
    return {"message": "Inference started"}

@router.get("/inference/status")
async def get_inference_status():
    return {
        "is_inferencing": status.is_inferencing,
        "progress": status.progress,
        "current_step": status.current_step,
        "estimated_time_remaining": status.estimated_time_remaining,
        "train_accuracy": status.train_accuracy,
        "test_accuracy": status.test_accuracy,
        "train_class_accuracies": status.train_class_accuracies,
        "test_class_accuracies": status.test_class_accuracies
    }

@router.get("/inference/result")
async def get_inference_result():
    if status.is_inferencing:
        raise HTTPException(status_code=400, detail="Inference is still in progress")
    if status.svg_files is None:
        raise HTTPException(status_code=404, detail="No inference results available")
    return {
        "svg_files": status.svg_files,
        "train_accuracy": status.train_accuracy,
        "test_accuracy": status.test_accuracy,
        "train_class_accuracies": status.train_class_accuracies,
        "test_class_accuracies": status.test_class_accuracies
    }