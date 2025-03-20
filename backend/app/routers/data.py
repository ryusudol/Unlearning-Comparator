# Python standard libraries
import base64
import io
import json
import os
from collections import OrderedDict

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, Response
from PIL import Image
import numpy as np

from app.utils import load_cifar10_data
from app.utils.data_loader import get_fixed_umap_indices

router = APIRouter()
x_train, y_train = load_cifar10_data()

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

@router.get("/data/{forget_class}/all_weights_name")
async def get_all_weights_name(forget_class: str):
    """
    Retrieve all existing weight file names for the provided forget_class.
    It looks in the 'unlearned_models/{forget_class}' directory for .pth files.
    """
    model_dir = os.path.join('unlearned_models', forget_class)
    
    if not os.path.exists(model_dir):
        raise HTTPException(status_code=404, detail=f"Directory for {forget_class} not found")
    
    # List all .pth files
    weight_files = [f for f in os.listdir(model_dir) if f.endswith('.pth')]
    
    if not weight_files:
        raise HTTPException(status_code=404, detail=f"No weight files found in {forget_class}")
    
    # Sort the file names alphabetically
    weight_files.sort()
    
    return weight_files


@router.get("/data/{forget_class}/{filename}/weights")
async def get_model_file(forget_class: str, filename: str):
    if not filename.endswith('.pth'):
        filename = f"{filename}.pth"
    
    model_dir = os.path.join('unlearned_models', forget_class)
    file_path = os.path.join(model_dir, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Model file {filename} not found")
    
    return FileResponse(file_path, media_type='application/octet-stream', filename=filename)

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

@router.delete("/data/{forget_class}/{filename}")
async def delete_files(forget_class: str, filename: str):
    response_messages = []
    
    # JSON delete
    json_filename = f"{filename}.json" if not filename.endswith('.json') else filename
    json_path = os.path.join('data', forget_class, json_filename)
    if os.path.exists(json_path):
        try:
            os.remove(json_path)
            response_messages.append(f"JSON file {json_filename} successfully deleted")
        except Exception as e:
            response_messages.append(f"Error deleting JSON file: {str(e)}")
    
    # PTH delete
    pth_filename = f"{filename}.pth" if not filename.endswith('.pth') else filename
    pth_path = os.path.join('unlearned_models', forget_class, pth_filename)
    if os.path.exists(pth_path):
        try:
            os.remove(pth_path)
            response_messages.append(f"Model file {pth_filename} successfully deleted")
        except Exception as e:
            response_messages.append(f"Error deleting model file: {str(e)}")
    
    if not response_messages:
        raise HTTPException(status_code=404, detail="No files found to delete")
    
    return {"messages": response_messages}

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

@router.get("/trained_models")
async def get_trained_model():
    """Download the trained model file (0000.pth)"""
    model_dir = 'unlearned_models/0'
    file_path = os.path.join(model_dir, '0000.pth')
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Trained model file not found")
    
    return FileResponse(
        path=file_path,
        media_type='application/octet-stream',
        filename='0000.pth'
    )


@router.get("/image/all_subset/{forget_class}")
async def get_all_subset_images(forget_class: str):
    """
    Retrieve 200 CIFAR-10 images for the given forget_class as a single API call.
    
    The original images (32x32x3) are resized to 12x12 pixels using bilinear interpolation,
    compressed in PNG format, and then base64-encoded. The selected indices are determined
    using get_fixed_umap_indices(total_samples=2000, seed=2048) (i.e., 200 images per class).
    
    The result is cached on disk as a JSON file at: data/subset/{forget_class}_all_base64.json.
    
    The returned JSON format is:
    {
      "images": [
         {"index": 123, "base64": "iVBORw0KGgoA..."},
         {"index": 456, "base64": "..." },
         ...
      ]
    }
    """
    # Validate forget_class parameter
    try:
        class_id = int(forget_class)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid forget_class parameter. Must be an integer.")

    if class_id < 0 or class_id >= 10:
        raise HTTPException(status_code=400, detail="forget_class must be between 0 and 9")
    
    # Set up the cache file path in the data/subset directory
    cache_dir = os.path.join("data", "subset", str(class_id))
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = os.path.join(cache_dir, f"{class_id}_base64.json")

    # If cached file exists, load and return it
    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
            return cached_data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading cached file: {str(e)}")

    # Global variables x_train and y_train are assumed to be loaded via load_cifar10_data() at startup
    global x_train, y_train

    # Get indices using a fixed seed (2048) such that each class gets 200 images for a total of 2000 samples
    indices_dict = get_fixed_umap_indices(total_samples=2000, seed=2048)
    if class_id not in indices_dict:
        raise HTTPException(status_code=404, detail="Indices not found for this class.")

    selected_indices = indices_dict[class_id]

    images_data = []
    for idx in selected_indices:
        orig_img = x_train[idx]  # Original image as a numpy array (32x32x3)
        img = Image.fromarray(orig_img)
        # Resize image to 12x12 using bilinear interpolation
        img_resized = img.resize((30, 30), Image.BILINEAR)
        buffer = io.BytesIO()
        # Save the resized image as PNG
        img_resized.save(buffer, format="PNG")
        base64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        images_data.append({
            "index": int(idx),
            "base64": base64_str
        })

    response_data = {"images": images_data}

    # Cache the result on disk for future requests
    try:
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(response_data, f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving cached file: {str(e)}")

    return response_data


