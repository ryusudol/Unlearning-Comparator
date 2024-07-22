from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.inference import run_inference
from app.models.neural_network import InferenceStatus

router = APIRouter()
status = InferenceStatus()

@router.post("/inference")
async def start_inference(weights_file: UploadFile = File(...)):
    if status.is_inferencing:
        raise HTTPException(status_code=400, detail="Inference is already in progress")
    
    result = await run_inference(weights_file, status)
    return {"message": "Inference completed", "result": result}

@router.get("/inference/status")
async def get_inference_status():
    return {
        "is_inferencing": status.is_inferencing,
        "progress": status.progress,
        "current_step": status.current_step,
    }