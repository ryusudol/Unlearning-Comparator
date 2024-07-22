from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List
import os

router = APIRouter()

def get_trained_model_files() -> List[str]:
    saved_models_dir = 'saved_models'
    if not os.path.exists(saved_models_dir):
        return []
    
    model_files = [f for f in os.listdir(saved_models_dir) if f.endswith('.pth')]
    return model_files

@router.get("/trained_models", response_model=List[str])
async def list_trained_models():
    model_files = get_trained_model_files()
    if not model_files:
        raise HTTPException(status_code=404, detail="No trained model files found")
    return model_files

@router.get("/trained_models/{filename}")
async def download_trained_model(filename: str):
    saved_models_dir = 'saved_models'
    file_path = os.path.join(saved_models_dir, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Trained model file not found")
    
    return FileResponse(file_path, media_type='application/octet-stream', filename=filename)