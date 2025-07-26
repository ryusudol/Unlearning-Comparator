import os
from enum import Enum
from fastapi import (
    APIRouter,
    BackgroundTasks,
    HTTPException,
    UploadFile,
    File,
    Form
)
from pydantic import BaseModel, Field
from app.services import (
	run_unlearning_retrain,
	run_unlearning_RL,
	run_unlearning_GA,
	run_unlearning_FT,
	run_unlearning_GA_FT,
	run_unlearning_GA_SL_FT,
	run_unlearning_SCRUB,
	run_unlearning_SalUn,
	run_unlearning_custom,
    run_unlearning_face_RL,
    run_unlearning_face_GA,
    run_unlearning_face_FT,
    run_unlearning_face_GA_FT,
    run_unlearning_face_GA_SL_FT,
    run_unlearning_face_SalUn,
    run_unlearning_face_SCRUB,
    run_unlearning_face_custom
)
from app.models import UnlearningStatus


router = APIRouter()
status = UnlearningStatus()

class UnlearningRequest(BaseModel):
    # seed: int = UNLEARN_SEED
    batch_size: int = Field(
        default=128,
        description="Batch size for unlearning"
    )
    learning_rate: float = Field(
        default=0.001,
        description="Learning rate for unlearning"
    )
    epochs: int = Field(
        default=3,
        ge=1,
        description="Number of unlearning epochs"
    )
    forget_class: int = Field(
        default=4,
        ge=-1,
        lt=10,
        description="Class to forget (0-9), -1 for original"
    )
    base_weights: str = Field(
        default="0000.pth",
        description="Filename of the weights in unlearned_models folder"
    )

class DatasetMode(str, Enum):
    cifar10 = "cifar10"
    face = "face"

class UnlearningMethod(str, Enum):
    ga = "ga"
    rl = "rl"
    ft = "ft"
    ga_ft = "ga_ft"
    ga_sl_ft = "ga_sl_ft"
    scrub = "scrub"
    salun = "salun"

unlearning_runners = {
    "cifar10": {
        "ga": run_unlearning_GA,
        "rl": run_unlearning_RL,
        "ft": run_unlearning_FT,
        "ga_ft": run_unlearning_GA_FT,
        "ga_sl_ft": run_unlearning_GA_SL_FT,
        "scrub": run_unlearning_SCRUB,
        "salun": run_unlearning_SalUn,
    },
    "face": {
        "ga": run_unlearning_face_GA,
        "rl": run_unlearning_face_RL,
        "ft": run_unlearning_face_FT,
        "ga_ft": run_unlearning_face_GA_FT,
        "ga_sl_ft": run_unlearning_face_GA_SL_FT,
        "scrub": run_unlearning_face_SCRUB,
        "salun": run_unlearning_face_SalUn,
    },
}

custom_unlearning_runners = {
    "cifar10": run_unlearning_custom,
    "face": run_unlearning_face_custom,
}

@router.post("/unlearn/{dataset_mode}/custom")
async def start_unlearning_custom_merged(
    dataset_mode: DatasetMode,
    background_tasks: BackgroundTasks,
    forget_class: int = Form(..., ge=-1, lt=10),
    weights_file: UploadFile = File(...),
    base_weights: str = Form("0000.pth") # only name of the weights file
):
    if status.is_unlearning:
        raise HTTPException(
            status_code=400,
            detail="Unlearning is already in progress"
        )
    status.reset()

    try:
        runner = custom_unlearning_runners[dataset_mode.value]
    except KeyError:
        raise HTTPException(
            status_code=404,
            detail=f"Custom unlearning not available for dataset '{dataset_mode.value}'"
        )

    filename_prefix = "face_weights_" if dataset_mode == DatasetMode.face else "custom_weights_"
    weights_filename = f"{filename_prefix}{weights_file.filename}"
    weights_path = os.path.join('uploaded_models', weights_filename)
    os.makedirs('uploaded_models', exist_ok=True)

    with open(weights_path, "wb") as buffer:
        content = await weights_file.read()
        buffer.write(content)

    base_weights = f"000{forget_class}.pth" if base_weights == "0000.pth" else base_weights
    background_tasks.add_task(
        runner,
        forget_class,
        status,
        weights_path,
        base_weights
    )

    return { "message": "Custom unlearning started" }

@router.post("/unlearn/{dataset_mode}/{method}")
async def start_unlearning(
    dataset_mode: DatasetMode,
    method: UnlearningMethod,
    background_tasks: BackgroundTasks,
    request: UnlearningRequest
):
    if status.is_unlearning:
        raise HTTPException(
            status_code=400,
            detail="Unlearning is already in progress"
        )
    status.reset()

    try:
        runner = unlearning_runners[dataset_mode.value][method.value]
    except KeyError:
        raise HTTPException(
            status_code=404,
            detail=f"Unlearning method '{method.value}' not found for dataset '{dataset_mode.value}'"
        )

    base_weights_name = f"000{request.forget_class}.pth" if request.base_weights == "0000.pth" else request.base_weights
    base_weights_path = f'unlearned_models/{dataset_mode.value}/{request.forget_class}/{base_weights_name}'
    if not os.path.exists(base_weights_path):
        raise HTTPException(
            status_code=404,
            detail=f"Weights '{base_weights_path}' not found in unlearned_models/ folder"
        )

    background_tasks.add_task(runner, request, status, base_weights_path)
    return { "message": f"{method.value.upper()} Unlearning started" }

@router.post("/unlearn/retrain")
async def start_unlearning_retrain(
    request: UnlearningRequest,
    background_tasks: BackgroundTasks
):
    if status.is_unlearning:
        raise HTTPException(
            status_code=400,
            detail="Unlearning is already in progress"
        )
    status.reset()
    background_tasks.add_task(run_unlearning_retrain, request, status)
    return { "message": "Unlearning (retrain) started" }

@router.get("/unlearn/status")
async def get_unlearning_status():
    return {
        "is_unlearning": status.is_unlearning,
        "progress": status.progress,
        "recent_id": status.recent_id,
        "current_epoch": status.current_epoch,
        "total_epochs": status.total_epochs,
        "current_unlearn_loss": round(status.current_unlearn_loss, 3),
        "current_unlearn_accuracy": round(status.current_unlearn_accuracy, 3),
        "p_training_loss": round(status.p_training_loss, 3),
        "p_training_accuracy": round(status.p_training_accuracy, 3),
        "p_test_loss": round(status.p_test_loss, 3),
        "p_test_accuracy": round(status.p_test_accuracy, 3),
        "method": status.method,
        "estimated_time_remaining": round(status.estimated_time_remaining + 30.0, 2) if status.progress != "idle" else 0,
    }

@router.post("/unlearn/cancel")
async def cancel_unlearning():
    if not status.is_unlearning:
        raise HTTPException(
            status_code=400,
            detail="No unlearning in progress"
        )
    status.cancel_requested = True
    return { "message": "Cancellation requested. Unlearning will stop soon." }
