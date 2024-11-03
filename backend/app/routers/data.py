import os
import pickle
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from PIL import Image
import io

router = APIRouter()

def load_cifar10_batch(file):
    with open(file, 'rb') as fo:
        dict = pickle.load(fo, encoding='bytes')
    return dict[b'data'], dict[b'labels']

data_dir = 'data/cifar-10-batches-py'
x_train = []
y_train = []

for i in range(1, 6):
    filename = os.path.join(data_dir, f'data_batch_{i}')
    X, Y = load_cifar10_batch(filename)
    x_train.append(X)
    y_train.append(Y)

x_train = np.concatenate(x_train)
y_train = np.concatenate(y_train)

x_train = x_train.reshape(50000, 3, 32, 32).transpose(0, 2, 3, 1)

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