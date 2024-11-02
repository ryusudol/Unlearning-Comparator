import asyncio
import os
from app.threads.unlearn_custom_thread import UnlearningInference

async def unlearning_custom(forget_class, status, weights_path):
    print(f"Starting custom unlearning inference for class {forget_class}...")
    
    status.progress = 0
    status.forget_class = forget_class

    unlearning_thread = UnlearningInference(
        forget_class=forget_class, 
        status=status, 
        weights_path_before="trained_models/0000.pth",
        weights_path_after=weights_path
    )
    unlearning_thread.start()
    print("unlearning started")
    # thread start
    while unlearning_thread.is_alive():
        if status.cancel_requested:
            unlearning_thread.stop()
            print("Cancellation requested, stopping the unlearning process...")
        await asyncio.sleep(0.2)  # Check status every 200ms

    status.is_unlearning = False
    print("unlearning canceled")
   
    if unlearning_thread.is_alive():
        print("Warning: Unlearning thread did not stop within the timeout period.")

    # thread end
    if unlearning_thread.exception:
        print(f"An error occurred during custom unlearning: {str(unlearning_thread.exception)}")
    elif status.cancel_requested:
        print("Unlearning process was cancelled.")
    else:
        print("Unlearning process completed successfully.")

    return status

async def run_unlearning_custom(forget_class, status, weights_path):
    try:
        status.is_unlearning = True
        updated_status = await unlearning_custom(forget_class, status, weights_path)
        return updated_status
    finally:
        status.is_unlearning = False
        status.cancel_requested = False
        status.progress = 100
        os.remove(weights_path)