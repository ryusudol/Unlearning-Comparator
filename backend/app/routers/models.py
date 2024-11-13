# Python standard libraries
import io
import json
import os
from collections import OrderedDict
from typing import List

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, Response
from PIL import Image

from app.utils.data_loader import load_cifar10_data

router = APIRouter()
x_train, y_train = load_cifar10_data()

def get_trained_model_files() -> List[str]:
    saved_models_dir = 'trained_models'
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

@router.get("/data/{forget_class}/file_lists", response_model=List[str])
async def list_json_files(forget_class: str):
    data_dir = os.path.join('data', forget_class)
    if not os.path.exists(data_dir):
        raise HTTPException(status_code=404, detail=f"Directory for {forget_class} not found")
    
    json_files = [f[:-5] for f in os.listdir(data_dir) if f.endswith('.json')]
    if not json_files:
        raise HTTPException(status_code=404, detail=f"No JSON files found in {forget_class}")
    return json_files

@router.get("/data/{forget_class}/all")
async def get_all_json_files(forget_class: str):
    data_dir = os.path.join('data', forget_class)
    if not os.path.exists(data_dir):
        raise HTTPException(status_code=404, detail=f"Directory for {forget_class} not found")
    
    json_files = [f for f in os.listdir(data_dir) if f.endswith('.json')]
    if not json_files:
        raise HTTPException(status_code=404, detail=f"No JSON files found in {forget_class}")
    
    def sort_key(filename):
        if filename.startswith(f'000{forget_class}'):
            return (0, filename)
        elif filename.startswith(f'a00{forget_class}'):
            return (1, filename)
        else:
            return (2, filename)
    
    json_files.sort(key=sort_key)
    
    all_data = OrderedDict()
    for filename in json_files:
        file_path = os.path.join(data_dir, filename)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                key = filename[:-5]
                all_data[key] = json.load(f)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading file {filename}: {str(e)}")
    
    return all_data

@router.delete("/data/{forget_class}/{filename}")
async def delete_json_file(forget_class: str, filename: str):
    if not filename.endswith('.json'):
        filename = f"{filename}.json"
    
    data_dir = os.path.join('data', forget_class)
    file_path = os.path.join(data_dir, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File {filename} not found")
    
    try:
        os.remove(file_path)
        return {"message": f"File {filename} successfully deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

@router.get("/data/{forget_class}/{filename}")
async def get_json_file(forget_class: str, filename: str):
    if not filename.endswith('.json'):
        filename = f"{filename}.json"
    
    data_dir = os.path.join('data', forget_class)
    file_path = os.path.join(data_dir, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File {filename} not found")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

@router.get("/image/cifar10/{index}")
async def get_image(index: int):
    if index < 0 or index >= len(x_train):
        raise HTTPException(status_code=404, detail="Image index out of range")

    img_data = x_train[index]
    
    img = Image.fromarray(img_data)
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()

    return Response(content=img_byte_arr, media_type="image/png")

