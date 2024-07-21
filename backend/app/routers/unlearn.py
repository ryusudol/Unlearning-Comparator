from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from ..services.training import run_unlearning
from ..models.neural_network import TrainingStatus

router = APIRouter()
status = TrainingStatus()

class UnlearningRequest(BaseModel):
    data_indices: list[int]

@router.post("/unlearn")
async def start_unlearning(request: UnlearningRequest, background_tasks: BackgroundTasks):
    if status.is_training:
        return {"message": "Cannot start unlearning while training is in progress"}
    background_tasks.add_task(run_unlearning, request, status)
    return {"message": "Unlearning started"}