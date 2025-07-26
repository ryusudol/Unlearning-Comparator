# Adding a New Unlearning Method: Step-by-Step Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [File Templates](#file-templates)
5. [Testing and Validation](#testing-and-validation)
6. [Troubleshooting](#troubleshooting)

## Overview

This guide provides comprehensive instructions for adding a new unlearning method to the Machine Unlearning Comparator system. The system supports both CIFAR-10 and Face datasets, requiring implementations for both.

### System Architecture

- **Backend**: FastAPI with threaded ML operations
- **Frontend**: React + TypeScript with Zustand state management
- **Datasets**: CIFAR-10 and Face recognition
- **Models**: ResNet18 (CIFAR-10), FaceNet-style (Face)

## Prerequisites

### Knowledge Requirements

- Python async/await patterns
- PyTorch model training and optimization
- Machine unlearning concepts
- TypeScript/React basics

### Development Environment

- Python 3.10+ with PyTorch
- Node.js with pnpm
- Access to the codebase repository

## Step-by-Step Implementation

### Phase 1: Backend Thread Implementation

#### Step 1.1: Create CIFAR-10 Thread Implementation

**File**: `/backend/app/threads/unlearn_{METHOD}_thread.py`

**Template Structure**:

```python
import torch
import time
import uuid
from app.utils.helpers import format_distribution
from app.utils.evaluation import evaluate_model_with_distributions
from app.utils.thread_base import BaseUnlearningThread
from app.utils.thread_operations import (
    setup_umap_subset,
    update_training_status,
    prepare_detailed_results,
    create_base_results_dict,
    save_results_and_model,
    print_epoch_progress,
    evaluate_on_forget_set,
    calculate_comprehensive_epoch_metrics,
    initialize_epoch_metrics_system,
    update_epoch_metrics_collection,
    save_epoch_plots,
    get_evaluation_functions,
    get_attack_functions,
    get_visualization_functions
)

class Unlearning{METHOD}Thread(BaseUnlearningThread):
    def __init__(self, ...):
        super().__init__()
        # Initialize parameters

    async def async_main(self):
        # Implement your unlearning algorithm
        pass
```

**Key Implementation Points**:

- Inherit from `BaseUnlearningThread`
- Use `self.check_stopped_and_return(self.status)` for cancellation
- Follow standard evaluation pipeline
- Use dataset-agnostic wrapper functions

#### Step 1.2: Create Face Dataset Thread Implementation

**File**: `/backend/app/threads/unlearn_face_{METHOD}_thread.py`

**Key Differences from CIFAR-10**:

- Class name: `UnlearningFace{METHOD}Thread`
- Use `get_evaluation_functions("face")`
- Use `save_results_and_model(..., dataset_mode="face")`
- Handle ImageFolder dataset structure

#### Step 1.3: Update Thread Package Exports

**File**: `/backend/app/threads/__init__.py`

Add imports:

```python
from .unlearn_{METHOD}_thread import Unlearning{METHOD}Thread
from .unlearn_face_{METHOD}_thread import UnlearningFace{METHOD}Thread
```

Update `__all__` list:

```python
__all__ = [
    # ... existing exports
    "Unlearning{METHOD}Thread",
    "UnlearningFace{METHOD}Thread",
]
```

### Phase 2: Backend Service Implementation

#### Step 2.1: Create CIFAR-10 Service

**File**: `/backend/app/services/unlearn_{METHOD}.py`

**Template**:

```python
import torch
from app.models.resnet import get_resnet18
from app.utils.data_loaders import get_cifar10_data_loaders
from app.utils.optimizers import get_adam_optimizer
from app.threads.unlearn_{METHOD}_thread import Unlearning{METHOD}Thread

async def unlearning_{METHOD}(request, status, base_weights_path):
    # Model setup
    model_before = get_resnet18()
    model_after = get_resnet18()

    # Load base weights
    model_before.load_state_dict(torch.load(base_weights_path))
    model_after.load_state_dict(torch.load(base_weights_path))

    # Data loaders
    train_loader, test_loader, train_set, test_set = get_cifar10_data_loaders()
    forget_loader, retain_loader = get_split_loaders(...)

    # Optimizer setup
    optimizer = get_adam_optimizer(model_after.parameters(), request.lr)

    # Thread execution
    thread = Unlearning{METHOD}Thread(...)
    thread.start()

def run_unlearning_{METHOD}(request, status, base_weights_path):
    return unlearning_{METHOD}(request, status, base_weights_path)
```

#### Step 2.2: Create Face Dataset Service

**File**: `/backend/app/services/unlearn_face_{METHOD}.py`

**Key Differences**:

- Use `get_facenet_model()` instead of `get_resnet18()`
- Use `get_face_data_loaders()` instead of `get_cifar10_data_loaders()`
- Function name: `unlearning_face_{METHOD}`

#### Step 2.3: Update Service Package Exports

**File**: `/backend/app/services/__init__.py`

Add imports:

```python
from .unlearn_{METHOD} import run_unlearning_{METHOD}
from .unlearn_face_{METHOD} import run_unlearning_face_{METHOD}
```

Update `__all__` list:

```python
__all__ = [
    # ... existing exports
    "run_unlearning_{METHOD}",
    "run_unlearning_face_{METHOD}",
]
```

### Phase 3: API Integration

#### Step 3.1: Update API Router

**File**: `/backend/app/routers/unlearn.py`

**Import new services**:

```python
from app.services import (
    # ... existing imports
    run_unlearning_{METHOD},
    run_unlearning_face_{METHOD},
)
```

**Add to UnlearningMethod enum**:

```python
class UnlearningMethod(str, Enum):
    # ... existing methods
    {METHOD_UPPER} = "{METHOD_LOWER}"
```

**Update unlearning_runners dictionary**:

```python
unlearning_runners = {
    # ... existing mappings
    UnlearningMethod.{METHOD_UPPER}: {
        "cifar10": run_unlearning_{METHOD},
        "face": run_unlearning_face_{METHOD},
    },
}
```

### Phase 4: Frontend Integration

#### Step 4.1: Update Constants

**File**: `/frontend/src/constants/experiments.ts`

Add to `UNLEARNING_METHODS` array:

```typescript
export const UNLEARNING_METHODS = [
  // ... existing methods
  { value: "{METHOD_LOWER}", label: "{METHOD_DISPLAY_NAME}" },
] as const;
```

#### Step 4.2: Update Configuration

**File**: `/frontend/src/utils/config/unlearning.ts`

Add default configuration:

```typescript
export const getDefaultUnlearningConfig = (method: string) => {
  const defaults = {
    // ... existing method configs
    {METHOD_LOWER}: {
      epochs: 10,           // Adjust based on method requirements
      learning_rate: 0.001, // Adjust based on method requirements
      batch_size: 32,       // Adjust based on method requirements
    },
  };

  return defaults[method] || defaults.ft;
};
```

### Phase 5: Algorithm Implementation Details

#### Step 5.1: Core Training Loop Template

```python
async def async_main(self):
    print(f"Starting {METHOD} unlearning for class {self.request.forget_class}...")
    self.status.progress = "Unlearning"
    self.status.method = "{METHOD_DISPLAY_NAME}"
    self.status.recent_id = uuid.uuid4().hex[:4]
    self.status.total_epochs = self.request.epochs

    # Get dataset-specific functions
    eval_functions = get_evaluation_functions("cifar10")  # or "face"
    attack_functions = get_attack_functions("cifar10")    # or "face"
    viz_functions = get_visualization_functions("cifar10") # or "face"

    # Setup UMAP subset
    umap_subset, umap_subset_loader, selected_indices = setup_umap_subset(
        self.train_set, self.test_set, self.num_classes
    )

    # Initialize epoch metrics (optional but recommended)
    enable_epoch_metrics = True
    epoch_metrics = {
        'UA': [], 'RA': [], 'TUA': [], 'TRA': [], 'PS': [], 'C-MIA': [], 'E-MIA': []
    } if enable_epoch_metrics else {}

    # Start timing
    start_time = time.time()

    # YOUR TRAINING LOOP HERE
    for epoch in range(self.request.epochs):
        if self.check_stopped_and_return(self.status):
            return

        self.model.train()
        # Implement your specific unlearning algorithm

        # Standard status update
        forget_epoch_loss, forget_epoch_acc = evaluate_on_forget_set(
            self.model, self.forget_loader, self.criterion, self.device
        )
        update_training_status(
            self.status, epoch, self.request.epochs, start_time,
            forget_epoch_loss, forget_epoch_acc
        )

    # Standard evaluation pipeline
    await self._run_evaluation_pipeline(...)
```

#### Step 5.2: Common Unlearning Patterns

**Gradient Ascent Pattern**:

```python
# Train on forget data with negative loss
for inputs, labels in self.forget_loader:
    outputs = self.model(inputs)
    loss = -self.criterion(outputs, labels)  # Negative for ascent
    loss.backward()
    torch.nn.utils.clip_grad_norm_(self.model.parameters(), MAX_GRAD_NORM)
    self.optimizer.step()
```

**Fine-tuning Pattern**:

```python
# Train on retain data with standard loss
for inputs, labels in self.retain_loader:
    outputs = self.model(inputs)
    loss = self.criterion(outputs, labels)  # Standard loss
    loss.backward()
    self.optimizer.step()
```

**Combined Data Pattern**:

```python
# Train on combined dataset with modified labels
combined_dataset = torch.utils.data.ConcatDataset([
    self.retain_loader.dataset, self.forget_loader.dataset
])
combined_loader = torch.utils.data.DataLoader(combined_dataset, ...)

for inputs, labels in combined_loader:
    # Apply your method-specific transformations
    outputs = self.model(inputs)
    loss = self.criterion(outputs, modified_labels)
    loss.backward()
    self.optimizer.step()
```

## File Templates

### Complete CIFAR-10 Thread Template

```python
import torch
import time
import uuid
from app.utils.helpers import format_distribution
from app.utils.evaluation import evaluate_model_with_distributions
from app.utils.thread_base import BaseUnlearningThread
from app.utils.thread_operations import (
    setup_umap_subset,
    update_training_status,
    prepare_detailed_results,
    create_base_results_dict,
    save_results_and_model,
    print_epoch_progress,
    evaluate_on_forget_set,
    calculate_comprehensive_epoch_metrics,
    initialize_epoch_metrics_system,
    update_epoch_metrics_collection,
    save_epoch_plots,
    get_evaluation_functions,
    get_attack_functions,
    get_visualization_functions
)


class Unlearning{METHOD}Thread(BaseUnlearningThread):
    def __init__(
        self,
        request,
        status,
        model_before,
        model_after,
        forget_loader,
        train_loader,
        test_loader,
        train_set,
        test_set,
        criterion,
        optimizer,
        scheduler,
        device,
        retain_loader,
        base_weights_path
    ):
        super().__init__()
        self.request = request
        self.status = status
        self.model_before = model_before
        self.model = model_after
        self.forget_loader = forget_loader
        self.train_loader = train_loader
        self.test_loader = test_loader
        self.retain_loader = retain_loader
        self.train_set = train_set
        self.test_set = test_set
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device
        self.base_weights_path = base_weights_path
        self.num_classes = 10
        self.remain_classes = [i for i in range(self.num_classes) if i != self.request.forget_class]

    async def async_main(self):
        print(f"Starting {METHOD} unlearning for class {self.request.forget_class}...")
        self.status.progress = "Unlearning"
        self.status.method = "{METHOD_DISPLAY_NAME}"
        self.status.recent_id = uuid.uuid4().hex[:4]
        self.status.total_epochs = self.request.epochs

        # Get dataset-specific functions
        eval_functions = get_evaluation_functions("cifar10")
        attack_functions = get_attack_functions("cifar10")
        viz_functions = get_visualization_functions("cifar10")

        umap_subset, umap_subset_loader, selected_indices = setup_umap_subset(
            self.train_set, self.test_set, self.num_classes
        )

        # Initialize epoch-wise metrics collection
        enable_epoch_metrics = True
        epoch_metrics = {
            'UA': [], 'RA': [], 'TUA': [], 'TRA': [], 'PS': [], 'C-MIA': [], 'E-MIA': []
        } if enable_epoch_metrics else {}

        # Initialize comprehensive metrics system if enabled
        metrics_components = None
        if enable_epoch_metrics:
            metrics_components = await initialize_epoch_metrics_system(
                self.model, self.train_set, self.test_set, self.train_loader, self.device,
                self.request.forget_class, True, True  # Enable both PS and MIA
            )

        # Collect epoch 0 metrics (initial state)
        if enable_epoch_metrics:
            print("Collecting initial metrics (epoch 0)...")
            initial_metrics = await calculate_comprehensive_epoch_metrics(
                self.model, self.train_loader, self.test_loader,
                self.train_set, self.test_set, self.criterion, self.device,
                self.request.forget_class, enable_epoch_metrics,
                metrics_components['retrain_metrics_cache'] if metrics_components else None,
                metrics_components['mia_classifier'] if metrics_components else None,
                current_epoch=0
            )
            update_epoch_metrics_collection(epoch_metrics, initial_metrics)

        # Start timing
        start_time = time.time()
        total_metrics_time = 0

        # TRAINING LOOP - IMPLEMENT YOUR ALGORITHM HERE
        for epoch in range(self.request.epochs):
            self.model.train()
            self.status.current_epoch = epoch + 1

            if self.check_stopped_and_return(self.status):
                return

            # TODO: Implement your specific unlearning algorithm here
            # Example patterns:

            # For gradient ascent methods:
            # for inputs, labels in self.forget_loader:
            #     outputs = self.model(inputs)
            #     loss = -self.criterion(outputs, labels)
            #     loss.backward()
            #     torch.nn.utils.clip_grad_norm_(self.model.parameters(), MAX_GRAD_NORM)
            #     self.optimizer.step()

            # For fine-tuning methods:
            # for inputs, labels in self.retain_loader:
            #     outputs = self.model(inputs)
            #     loss = self.criterion(outputs, labels)
            #     loss.backward()
            #     self.optimizer.step()

            # Evaluate on forget set
            forget_epoch_loss, forget_epoch_acc = evaluate_on_forget_set(
                self.model, self.forget_loader, self.criterion, self.device
            )

            # Update status
            update_training_status(
                self.status, epoch, self.request.epochs, start_time,
                forget_epoch_loss, forget_epoch_acc
            )

            # Calculate comprehensive epoch metrics if enabled
            if enable_epoch_metrics:
                metrics_start = time.time()
                print(f"Collecting comprehensive metrics for epoch {epoch + 1}...")
                metrics = await calculate_comprehensive_epoch_metrics(
                    self.model, self.train_loader, self.test_loader,
                    self.train_set, self.test_set, self.criterion, self.device,
                    self.request.forget_class, enable_epoch_metrics,
                    metrics_components['retrain_metrics_cache'] if metrics_components else None,
                    metrics_components['mia_classifier'] if metrics_components else None,
                    current_epoch=epoch + 1
                )
                update_epoch_metrics_collection(epoch_metrics, metrics)
                total_metrics_time += time.time() - metrics_start

            # Print progress
            additional_metrics = None
            if enable_epoch_metrics and epoch_metrics and len(epoch_metrics['UA']) > 0:
                additional_metrics = {
                    'UA': epoch_metrics['UA'][-1],
                    'RA': epoch_metrics['RA'][-1],
                    'TUA': epoch_metrics['TUA'][-1],
                    'TRA': epoch_metrics['TRA'][-1],
                    'PS': epoch_metrics['PS'][-1],
                    'C-MIA': epoch_metrics['C-MIA'][-1],
                    'E-MIA': epoch_metrics['E-MIA'][-1]
                }

            print_epoch_progress(
                epoch + 1, self.request.epochs, forget_epoch_loss, forget_epoch_acc,
                eta=self.status.estimated_time_remaining,
                additional_metrics=additional_metrics
            )

        # Calculate pure training time
        rte = time.time() - start_time - total_metrics_time

        if self.check_stopped_and_return(self.status):
            return

        # STANDARD EVALUATION PIPELINE - DO NOT MODIFY

        # Evaluate on train set
        self.status.progress = "Evaluating Train Set"
        print("Start Train set evaluation")
        (
            train_loss,
            _,
            train_class_accuracies,
            train_label_dist,
            train_conf_dist
        ) = await evaluate_model_with_distributions(
            model=self.model,
            data_loader=self.train_loader,
            criterion=self.criterion,
            device=self.device
        )

        # Update training evaluation status
        self.status.p_training_loss = train_loss
        remain_train_accuracy = sum(train_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes)
        self.status.p_training_accuracy = remain_train_accuracy

        unlearn_accuracy = train_class_accuracies[self.request.forget_class]
        remain_accuracy = round(
            sum(train_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes), 3
        )

        print("Train Class Accuracies:")
        for i, acc in train_class_accuracies.items():
            print(f"  Class {i}: {acc:.3f}")
        print(f"Train set evaluation finished at {time.time() - start_time:.3f} seconds")

        if self.check_stopped_and_return(self.status):
            return

        # Evaluate on test set
        self.status.progress = "Evaluating Test Set"
        print("Start Test set evaluation")
        (
            test_loss,
            _,
            test_class_accuracies,
            test_label_dist,
            test_conf_dist
        ) = await evaluate_model_with_distributions(
            model=self.model,
            data_loader=self.test_loader,
            criterion=self.criterion,
            device=self.device
        )

        # Update test evaluation status
        self.status.p_test_loss = test_loss
        remain_test_accuracy = sum(test_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes)
        self.status.p_test_accuracy = remain_test_accuracy

        print("Test Class Accuracies:")
        for i, acc in test_class_accuracies.items():
            print(f"  Class {i}: {acc:.3f}")
        print(f"Test set evaluation finished at {time.time() - start_time:.3f} seconds")

        if self.check_stopped_and_return(self.status):
            return

        # UMAP and activation calculation
        self.status.progress = "Computing UMAP"

        print("Computing layer activations")
        (
            activations,
            predicted_labels,
            probs,
        ) = await eval_functions['get_layer_activations_and_predictions'](
            model=self.model,
            data_loader=umap_subset_loader,
            device=self.device
        )

        # UMAP embedding computation
        print("Computing UMAP embedding")
        forget_labels = torch.tensor([label == self.request.forget_class for _, label in umap_subset])
        umap_embedding = await viz_functions['compute_umap_embedding'](
            activation=activations,
            labels=predicted_labels,
            forget_class=self.request.forget_class,
            forget_labels=forget_labels
        )

        # Process attack metrics
        print("Processing attack metrics on UMAP subset")
        values, attack_results, fqs = await attack_functions['process_attack_metrics'](
            model=self.model,
            data_loader=umap_subset_loader,
            device=self.device,
            forget_class=self.request.forget_class
        )

        # Generate distribution plots on full forget class data
        print("Generating distribution plots on full forget class data")
        from app.utils.attack_full_dataset import calculate_model_metrics
        await calculate_model_metrics(
            model=self.model,
            data_loader=self.train_loader,
            device=self.device,
            forget_class=self.request.forget_class,
            t1=2.0,
            t2=1.0,
            create_plots=True,
            model_name="Unlearn"
        )

        # CKA similarity calculation
        self.status.progress = "Calculating CKA Similarity"
        print("Calculating CKA similarity")
        cka_results = await eval_functions['calculate_cka_similarity'](
            model_before=self.model_before,
            model_after=self.model,
            forget_class=self.request.forget_class,
            device=self.device
        )

        # Prepare detailed results
        self.status.progress = "Preparing Results"
        detailed_results = prepare_detailed_results(
            umap_subset, selected_indices, predicted_labels,
            umap_embedding, probs, self.request.forget_class
        )

        test_unlearn_accuracy = test_class_accuracies[self.request.forget_class]
        test_remain_accuracy = round(
           sum(test_class_accuracies[i] for i in self.remain_classes) / 9.0, 3
        )

        # Create results dictionary
        results = create_base_results_dict(
            self.status, self.request.forget_class, self.base_weights_path,
            "{METHOD_DISPLAY_NAME}", self.request
        )

        results.update({
            "UA": round(unlearn_accuracy, 3),
            "RA": remain_accuracy,
            "TUA": round(test_unlearn_accuracy, 3),
            "TRA": test_remain_accuracy,
            "PA": round(((1 - unlearn_accuracy) + (1 - test_unlearn_accuracy) + remain_accuracy + test_remain_accuracy) / 4, 3),
            "RTE": round(rte, 1),
            "FQS": fqs,
            "accs": [round(v, 3) for v in train_class_accuracies.values()],
            "label_dist": format_distribution(train_label_dist),
            "conf_dist": format_distribution(train_conf_dist),
            "t_accs": [round(v, 3) for v in test_class_accuracies.values()],
            "t_label_dist": format_distribution(test_label_dist),
            "t_conf_dist": format_distribution(test_conf_dist),
            "cka": cka_results.get("similarity"),
            "cka_retrain": cka_results.get("similarity_retrain"),
            "points": detailed_results,
            "attack": {
                "values": values,
                "results": attack_results
            }
        })

        # Generate epoch-wise plots if we have collected metrics
        if enable_epoch_metrics and epoch_metrics:
            print("Generating epoch-wise plots...")
            plot_path = save_epoch_plots(
                epoch_metrics, "{METHOD_DISPLAY_NAME}", self.request.forget_class, self.status.recent_id
            )
            if plot_path:
                results["epoch_plot_path"] = plot_path

            # Add epoch metrics to results
            results["epoch_metrics"] = {
                key: [round(val, 3) for val in values] for key, values in epoch_metrics.items()
            }

        # Save results and model
        result_path = save_results_and_model(
            results, self.model, self.request.forget_class, self.status, dataset_mode="cifar10"
        )

        print(f"Results saved to {result_path}")
        print("{METHOD} Unlearning inference completed!")
        self.status.progress = "Completed"
```

### Complete Service Template

```python
import asyncio
import torch
import torch.nn as nn
from torch.optim.lr_scheduler import StepLR

from app.models.resnet import get_resnet18
from app.utils.data_loaders import get_cifar10_data_loaders
from app.utils.optimizers import get_adam_optimizer, get_sgd_optimizer
from app.utils.data_split import split_cifar10_by_class
from app.threads.unlearn_{METHOD}_thread import Unlearning{METHOD}Thread


async def unlearning_{METHOD}(request, status, base_weights_path):
    """
    {METHOD_DISPLAY_NAME} unlearning implementation for CIFAR-10.

    Args:
        request: UnlearningRequest with hyperparameters
        status: UnlearningStatus for progress tracking
        base_weights_path: Path to pre-trained model weights
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Model setup
    model_before = get_resnet18()
    model_after = get_resnet18()

    # Load base weights
    print(f"Loading model weights from {base_weights_path}")
    model_before.load_state_dict(torch.load(base_weights_path, map_location=device))
    model_after.load_state_dict(torch.load(base_weights_path, map_location=device))

    model_before.to(device)
    model_after.to(device)

    # Data loaders
    train_loader, test_loader, train_set, test_set = get_cifar10_data_loaders()
    forget_loader, retain_loader = split_cifar10_by_class(
        train_set, request.forget_class, request.batch_size
    )

    # Loss function
    criterion = nn.CrossEntropyLoss()

    # Optimizer setup - adjust based on your method's requirements
    optimizer = get_adam_optimizer(model_after.parameters(), request.lr)
    # Alternative: optimizer = get_sgd_optimizer(model_after.parameters(), request.lr)

    # Scheduler setup (optional)
    scheduler = StepLR(optimizer, step_size=30, gamma=0.1)

    # Set status
    status.is_unlearning = True

    # Create and start unlearning thread
    unlearning_thread = Unlearning{METHOD}Thread(
        request=request,
        status=status,
        model_before=model_before,
        model_after=model_after,
        forget_loader=forget_loader,
        train_loader=train_loader,
        test_loader=test_loader,
        train_set=train_set,
        test_set=test_set,
        criterion=criterion,
        optimizer=optimizer,
        scheduler=scheduler,
        device=device,
        retain_loader=retain_loader,
        base_weights_path=base_weights_path
    )

    unlearning_thread.start()

    # Store thread reference for potential cancellation
    status.current_thread = unlearning_thread

    return {"message": "{METHOD_DISPLAY_NAME} unlearning started", "thread_id": unlearning_thread.ident}


def run_unlearning_{METHOD}(request, status, base_weights_path):
    """
    Entry point for {METHOD_DISPLAY_NAME} unlearning.
    """
    return asyncio.create_task(unlearning_{METHOD}(request, status, base_weights_path))
```

## Testing and Validation

### Step 1: Backend Testing

```bash
# Test CIFAR-10 implementation
cd backend
hatch shell
python -c "
from app.services.unlearn_{METHOD} import run_unlearning_{METHOD}
from app.models.requests import UnlearningRequest
from app.models.status import UnlearningStatus

request = UnlearningRequest(
    forget_class=0,
    epochs=2,  # Use small number for testing
    lr=0.001,
    batch_size=32
)
status = UnlearningStatus()
base_weights = 'unlearned_models/cifar10/0/base_weights.pth'

# This should run without errors
task = run_unlearning_{METHOD}(request, status, base_weights)
"
```

### Step 2: API Testing

```bash
# Test API endpoint
curl -X POST "http://localhost:8000/api/v1/unlearn/start" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "{METHOD_LOWER}",
    "dataset": "cifar10",
    "forget_class": 0,
    "epochs": 2,
    "lr": 0.001,
    "batch_size": 32
  }'
```

### Step 3: Frontend Testing

```bash
# Start frontend
cd frontend
pnpm start

# Navigate to http://localhost:3000
# Verify new method appears in dropdown
# Test method selection and parameter configuration
```

### Step 4: Integration Testing

1. **Full Pipeline Test**: Run complete unlearning process
2. **Results Validation**: Verify results are saved correctly
3. **Visualization Test**: Check UMAP and metrics display
4. **Cancellation Test**: Verify stop functionality works

## Troubleshooting

### Common Issues

#### Import Errors

**Problem**: `ModuleNotFoundError` when importing new thread/service
**Solution**:

- Verify `__init__.py` files are updated
- Check import paths are correct
- Restart backend server

#### Thread Initialization Errors

**Problem**: Thread fails to start or crashes immediately
**Solution**:

- Check constructor parameters match expected signature
- Verify all required imports are present
- Add debug prints to identify failing component

#### API Registration Issues

**Problem**: New method doesn't appear in API or frontend
**Solution**:

- Verify enum is updated in `unlearn.py`
- Check `unlearning_runners` dictionary mapping
- Restart backend server
- Clear browser cache

#### Memory Issues

**Problem**: Out of memory during training
**Solution**:

- Reduce batch size in default configuration
- Add memory cleanup in training loop
- Monitor GPU memory usage

#### Convergence Issues

**Problem**: Method doesn't converge or produces poor results
**Solution**:

- Adjust learning rate and epochs in default config
- Verify loss function implementation
- Check gradient flow and parameter updates
- Compare with reference implementations

### Debug Checklist

- [ ] All files created with correct naming convention
- [ ] All imports added to `__init__.py` files
- [ ] API router updated with new method
- [ ] Frontend constants and config updated
- [ ] Default hyperparameters set appropriately
- [ ] Training loop implements algorithm correctly
- [ ] Error handling follows established patterns
- [ ] Results saving uses correct dataset mode
- [ ] Both CIFAR-10 and Face implementations created

### Performance Optimization

1. **Batch Size Tuning**: Adjust for optimal GPU utilization
2. **Learning Rate Scheduling**: Implement adaptive learning rates
3. **Memory Management**: Clear unnecessary tensors
4. **Gradient Accumulation**: For large effective batch sizes
5. **Mixed Precision**: Use autocast for faster training

### Best Practices

1. **Algorithm Validation**: Test on small datasets first
2. **Hyperparameter Sensitivity**: Test multiple configurations
3. **Baseline Comparison**: Compare against existing methods
4. **Documentation**: Add docstrings and comments
5. **Error Handling**: Implement robust error handling
6. **Logging**: Add informative progress logging

---

This guide provides a comprehensive framework for adding new unlearning methods. Follow each step carefully and refer to existing implementations as reference examples. The modular architecture makes it straightforward to add new methods while maintaining consistency across the codebase.
