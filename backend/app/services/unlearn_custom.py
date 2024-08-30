import asyncio
import os
from app.threads.unlearn_custom_thread import UnlearningInference

async def unlearning_custom(request, status, weights_path):
    print(f"Starting custom unlearning inference for class {request.forget_class}...")
    
    status.is_unlearning = True
    status.progress = 0
    status.forget_class = request.forget_class

    unlearning_thread = UnlearningInference(request, status, weights_path)
    unlearning_thread.start()

    while unlearning_thread.is_alive():
        await asyncio.sleep(0.1)  # Check status every 100ms

    if unlearning_thread.exception:
        print(f"An error occurred during custom unlearning: {str(unlearning_thread.exception)}")
    else:
        print("Custom Unlearning inference and visualization completed!")

    return status

async def run_unlearning_custom(request, status, weights_path):
    try:
        updated_status = await unlearning_custom(request, status, weights_path)
        return updated_status
    finally:
        status.is_unlearning = False
        status.cancel_requested = False
        status.progress = 100
        os.remove(weights_path)