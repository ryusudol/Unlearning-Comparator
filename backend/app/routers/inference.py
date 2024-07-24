from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.services.inference import start_inference
from app.models.neural_network import InferenceStatus

router = APIRouter()
status = InferenceStatus()

@router.post("/inference")
async def start_inference_route(background_tasks: BackgroundTasks, weights_file: UploadFile = File(...)):
    if status.is_inferencing:
        raise HTTPException(status_code=400, detail="Inference is already in progress")
    status.reset()  # Reset status before starting new inference
    return await start_inference(weights_file, background_tasks, status)

@router.get("/inference/status")
async def get_inference_status():
    return {
        "is_inferencing": status.is_inferencing,
        "progress": status.progress,
        "current_step": status.current_step,
        "estimated_time_remaining": status.estimated_time_remaining
    }

@router.get("/inference/result")
async def get_inference_result():
    if status.is_inferencing:
        raise HTTPException(status_code=400, detail="Inference is still in progress")
    if status.svg_files is None:
        raise HTTPException(status_code=404, detail="No inference results available")
    return {"svg_files": status.svg_files}