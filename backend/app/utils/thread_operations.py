"""
Utility functions for thread operations to reduce code duplication in _thread files.
"""
import torch
import time
from torch.utils.data import DataLoader, Subset
from app.config import UMAP_DATA_SIZE, UMAP_DATASET, UNLEARN_SEED


def get_evaluation_functions(dataset_mode="cifar10"):
    """
    Get appropriate evaluation functions based on dataset mode.
    
    Args:
        dataset_mode: "cifar10" or "face"
    
    Returns:
        Dictionary with evaluation function references
    """
    if dataset_mode == "face":
        from app.utils.evaluation import (
            get_layer_activations_and_predictions_face,
            calculate_cka_similarity_face
        )
        return {
            'get_layer_activations_and_predictions': get_layer_activations_and_predictions_face,
            'calculate_cka_similarity': calculate_cka_similarity_face
        }
    else:
        from app.utils.evaluation import (
            get_layer_activations_and_predictions,
            calculate_cka_similarity
        )
        return {
            'get_layer_activations_and_predictions': get_layer_activations_and_predictions,
            'calculate_cka_similarity': calculate_cka_similarity
        }


def get_attack_functions(dataset_mode="cifar10"):
    """
    Get appropriate attack processing functions based on dataset mode.
    
    Args:
        dataset_mode: "cifar10" or "face"
    
    Returns:
        Dictionary with attack function references
    """
    if dataset_mode == "face":
        from app.utils.attack import process_face_attack_metrics
        return {
            'process_attack_metrics': process_face_attack_metrics
        }
    else:
        from app.utils.attack import process_attack_metrics
        return {
            'process_attack_metrics': process_attack_metrics
        }


def get_visualization_functions(dataset_mode="cifar10"):
    """
    Get appropriate visualization functions based on dataset mode.
    
    Args:
        dataset_mode: "cifar10" or "face"
    
    Returns:
        Dictionary with visualization function references
    """
    if dataset_mode == "face":
        from app.utils.visualization import compute_umap_embedding_face
        return {
            'compute_umap_embedding': compute_umap_embedding_face
        }
    else:
        from app.utils.visualization import compute_umap_embedding
        return {
            'compute_umap_embedding': compute_umap_embedding
        }


def setup_umap_subset(
    train_set, 
    test_set, 
    num_classes=10
):
    """
    Create UMAP subset and loader with consistent sampling across all threads.
    Supports both CIFAR-10 datasets (with .targets) and ImageFolder datasets (with .samples).
    
    Args:
        train_set: Training dataset
        test_set: Test dataset  
        num_classes: Number of classes (default 10 for CIFAR-10)
    
    Returns:
        Tuple of (umap_subset, umap_subset_loader, selected_indices)
    """
    dataset = train_set if UMAP_DATASET == 'train' else test_set
    
    # Handle different dataset types
    if hasattr(dataset, 'targets'):
        # CIFAR-10 style dataset
        targets = torch.tensor(dataset.targets)
    elif hasattr(dataset, 'samples'):
        # ImageFolder style dataset (face data)
        targets = torch.tensor([sample[1] for sample in dataset.samples])
    else:
        raise ValueError(f"Unsupported dataset type: {type(dataset)}")
    
    class_indices = [(targets == i).nonzero().squeeze() for i in range(num_classes)]
    
    samples_per_class = UMAP_DATA_SIZE // num_classes
    generator = torch.Generator()
    generator.manual_seed(UNLEARN_SEED)
    selected_indices = []
    
    for indices in class_indices:
        perm = torch.randperm(len(indices), generator=generator)
        selected_indices.extend(indices[perm[:samples_per_class]].tolist())
    
    umap_subset = Subset(dataset, selected_indices)
    umap_subset_loader = DataLoader(
        umap_subset, batch_size=UMAP_DATA_SIZE, shuffle=False
    )
    
    return umap_subset, umap_subset_loader, selected_indices


def calculate_accuracy_metrics(
    train_class_accuracies, 
    test_class_accuracies,
    forget_class,
    num_classes=10
):
    """
    Calculate standard accuracy metrics for unlearning evaluation.
    
    Args:
        train_class_accuracies: Per-class accuracies on training set
        test_class_accuracies: Per-class accuracies on test set
        forget_class: Class to forget
        num_classes: Total number of classes
    
    Returns:
        Dictionary with UA, RA, TUA, TRA metrics
    """
    remain_classes = [i for i in range(num_classes) if i != forget_class]
    
    ua = train_class_accuracies[forget_class]  # Unlearn Accuracy
    ra = sum(train_class_accuracies[i] for i in remain_classes) / len(remain_classes)  # Remain Accuracy
    tua = test_class_accuracies[forget_class]  # Test Unlearn Accuracy
    tra = sum(test_class_accuracies[i] for i in remain_classes) / len(remain_classes)  # Test Remain Accuracy
    
    return {
        'UA': ua,
        'RA': ra, 
        'TUA': tua,
        'TRA': tra
    }


def update_training_status(
    status,
    epoch,
    total_epochs,
    start_time,
    current_loss,
    current_accuracy
):
    """
    Update training status with consistent timing calculations.
    
    Args:
        status: Status object to update
        epoch: Current epoch (0-based)
        total_epochs: Total number of epochs
        start_time: Training start time
        current_loss: Current epoch loss
        current_accuracy: Current epoch accuracy
    """
    elapsed_time = time.time() - start_time
    estimated_total_time = elapsed_time / (epoch + 1) * total_epochs
    
    status.current_epoch = epoch + 1
    status.current_unlearn_loss = current_loss
    status.current_unlearn_accuracy = current_accuracy
    status.estimated_time_remaining = max(0, estimated_total_time - elapsed_time)


def prepare_detailed_results(
    umap_subset,
    selected_indices,
    predicted_labels,
    umap_embedding,
    probs,
    forget_class
):
    """
    Prepare detailed results for UMAP visualization with consistent format.
    Supports both CIFAR-10 datasets (with .targets) and ImageFolder datasets (with .samples).
    
    Args:
        umap_subset: UMAP subset dataset
        selected_indices: Selected sample indices
        predicted_labels: Model predictions
        umap_embedding: UMAP coordinates
        probs: Model probabilities
        forget_class: Class to forget
    
    Returns:
        List of detailed results in standard format
    """
    from app.utils.helpers import compress_prob_array
    
    detailed_results = []
    for i in range(len(umap_subset)):
        original_index = selected_indices[i]
        
        # Handle different dataset types for ground truth extraction
        if hasattr(umap_subset.dataset, 'targets'):
            # CIFAR-10 style dataset
            ground_truth = umap_subset.dataset.targets[original_index]
        elif hasattr(umap_subset.dataset, 'samples'):
            # ImageFolder style dataset (face data)
            ground_truth = umap_subset.dataset.samples[original_index][1]
        else:
            raise ValueError(f"Unsupported dataset type: {type(umap_subset.dataset)}")
        
        is_forget = (ground_truth == forget_class)
        detailed_results.append([
            int(ground_truth),                             # gt
            int(predicted_labels[i]),                      # pred
            int(original_index),                           # img
            1 if is_forget else 0,                         # forget as binary
            round(float(umap_embedding[i][0]), 2),         # x coordinate
            round(float(umap_embedding[i][1]), 2),         # y coordinate
            compress_prob_array(probs[i].tolist()),        # compressed probabilities
        ])
    
    return detailed_results


def create_base_results_dict(
    status,
    forget_class,
    base_weights_path,
    method,
    request=None,
    is_training_eval=False
):
    """
    Create base results dictionary with common fields.
    
    Args:
        status: Status object with recent_id
        forget_class: Class to forget
        base_weights_path: Path to base model weights
        method: Unlearning method name
        request: Request object with training parameters (optional)
        is_training_eval: Whether this is training evaluation
    
    Returns:
        Base results dictionary
    """
    import os
    
    results = {
        "CreatedAt": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        "ID": status.recent_id,
        "FC": "N/A" if is_training_eval else forget_class,
        "Type": "Pretrained" if is_training_eval else "Unlearned",
        "Base": os.path.basename(base_weights_path).replace('.pth', ''),
        "Method": method,
    }
    
    if request:
        results.update({
            "Epoch": request.epochs,
            "BS": request.batch_size,
            "LR": request.learning_rate,
        })
    else:
        results.update({
            "Epoch": "N/A",
            "BS": "N/A", 
            "LR": "N/A",
        })
    
    return results


def save_results_and_model(
    results,
    model,
    forget_class,
    status,
    dataset_mode="cifar10"
):
    """
    Save results to JSON and model weights with consistent file structure.
    
    Args:
        results: Results dictionary to save
        model: Model to save
        forget_class: Class to forget
        status: Status object with recent_id
        dataset_mode: Dataset mode ("cifar10" or "face")
    
    Returns:
        Path to saved results file
    """
    import os
    import json
    from app.utils.helpers import save_model
    
    # Create directory structure
    os.makedirs('data', exist_ok=True)
    if dataset_mode == "face":
        forget_class_dir = os.path.join('data/face', str(forget_class))
    else:
        forget_class_dir = os.path.join('data', str(forget_class))
    os.makedirs(forget_class_dir, exist_ok=True)
    
    # Save results
    result_path = os.path.join(forget_class_dir, f'{results["ID"]}.json')
    with open(result_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Save model
    save_model(
        model=model,
        forget_class=forget_class,
        model_name=status.recent_id,
        dataset_mode=dataset_mode
    )
    
    return result_path


def print_epoch_progress(
    epoch,
    total_epochs,
    loss,
    accuracy,
    learning_rate=None,
    eta=None,
    additional_metrics=None
):
    """
    Print epoch progress with consistent formatting.
    
    Args:
        epoch: Current epoch (1-based for display)
        total_epochs: Total number of epochs
        loss: Current loss
        accuracy: Current accuracy
        learning_rate: Current learning rate (optional)
        eta: Estimated time remaining (optional)
        additional_metrics: Additional metrics to display (optional)
    """
    print(f"\nEpoch [{epoch}/{total_epochs}]")
    if learning_rate is not None:
        print(f"Learning Rate: {learning_rate:.6f}")
    print(f"Loss: {loss:.4f}, Accuracy: {accuracy:.3f}")
    
    if additional_metrics:
        metrics_str = ", ".join([f"{k}: {v:.3f}" for k, v in additional_metrics.items()])
        print(f"Metrics - {metrics_str}")
    
    if eta is not None:
        print(f"ETA: {eta:.2f}s")


def evaluate_on_forget_set(
    model,
    forget_loader,
    criterion,
    device
):
    """
    Evaluate model on forget set and return loss and accuracy.
    
    Args:
        model: Model to evaluate
        forget_loader: DataLoader for forget set
        criterion: Loss criterion
        device: Device to use
    
    Returns:
        Tuple of (loss, accuracy)
    """
    from app.utils.evaluation import model_eval_mode
    
    running_loss = 0.0
    correct = 0
    total = 0
    
    with model_eval_mode(model):
        with torch.no_grad():
            for inputs, labels in forget_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                running_loss += loss.item()
                
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
    
    epoch_loss = running_loss / len(forget_loader)
    epoch_acc = correct / total
    
    return epoch_loss, epoch_acc


async def calculate_comprehensive_epoch_metrics(
    model,
    train_loader,
    test_loader,
    train_set,
    test_set,
    criterion,
    device,
    forget_class,
    enable_metrics=False,
    retrain_metrics_cache=None,
    mia_classifier=None,
    current_epoch=None
):
    """
    Calculate comprehensive epoch metrics (UA, RA, TUA, TRA, PS, C-MIA, E-MIA) if enabled.
    All-or-nothing approach: either calculate everything or nothing.
    
    Args:
        model: Model to evaluate
        train_loader: Training data loader
        test_loader: Test data loader
        train_set: Training dataset
        test_set: Test dataset
        criterion: Loss criterion
        device: Device to use
        forget_class: Class to forget
        enable_metrics: Whether to calculate metrics (all or nothing)
        retrain_metrics_cache: Cached retrain metrics for PS calculation
        mia_classifier: Trained MIA classifier
        
    Returns:
        Dictionary with all calculated metrics or None if disabled
    """
    if not enable_metrics:
        return None
        
    try:
        from app.utils.evaluation import evaluate_model
        
        # Evaluate on full train and test sets
        train_loss, _, train_class_accuracies = await evaluate_model(
            model, train_loader, criterion, device
        )
        test_loss, _, test_class_accuracies = await evaluate_model(
            model, test_loader, criterion, device
        )
        
        # Calculate basic accuracy metrics
        accuracy_metrics = calculate_accuracy_metrics(
            train_class_accuracies, test_class_accuracies, forget_class
        )
        
        result_metrics = accuracy_metrics.copy()
        
        # Calculate Privacy Score
        try:
            # If epoch is 0, set PS to 0 (initial state before training)
            if current_epoch is not None and current_epoch == 0:
                ps_score = 0.0
                print(f"Setting PS to 0.0 for epoch {current_epoch} (initial state)")
            else:
                from app.utils.attack_optimized_ps import calculate_ps_with_cached_retrain
                from app.utils.attack import process_attack_metrics
                
                if retrain_metrics_cache is not None:
                    # Use optimized PS calculation with cached retrain metrics
                    ps_score = await calculate_ps_with_cached_retrain(
                        unlearn_model=model,
                        data_loader=train_loader,
                        device=device,
                        forget_class=forget_class,
                        retrain_metrics_cache=retrain_metrics_cache
                    )
                else:
                    # Fallback to subset calculation for speed
                    umap_subset, umap_subset_loader, _ = setup_umap_subset(train_set, test_set, 10)
                    _, _, ps_score = await process_attack_metrics(
                        model=model,
                        data_loader=umap_subset_loader,
                        device=device,
                        forget_class=forget_class
                    )
            result_metrics['PS'] = ps_score
        except Exception as e:
            print(f"Error calculating PS: {e}")
            result_metrics['PS'] = 0.5
        
        # Calculate MIA-Efficacy
        try:
            if mia_classifier is not None:
                from app.utils.salun_mia import predict_mia_efficacy
                from torch.utils.data import DataLoader, Subset
                
                # Create forget loader for MIA calculation
                if hasattr(train_set, 'targets'):
                    forget_indices = [i for i, target in enumerate(train_set.targets) 
                                    if target == forget_class]
                elif hasattr(train_set, 'samples'):
                    forget_indices = [i for i, (_, target) in enumerate(train_set.samples) 
                                    if target == forget_class]
                else:
                    raise ValueError(f"Unsupported dataset type: {type(train_set)}")
                forget_subset = Subset(train_set, forget_indices)
                forget_loader = DataLoader(forget_subset, batch_size=128, shuffle=False)
                
                mia_results = await predict_mia_efficacy(
                    current_model=model,
                    mia_classifier=mia_classifier,
                    forget_loader=forget_loader,
                    device=device,
                    forget_class=forget_class
                )
                result_metrics['C-MIA'] = mia_results['C-MIA']
                result_metrics['E-MIA'] = mia_results['E-MIA']
            else:
                result_metrics['C-MIA'] = 0.5
                result_metrics['E-MIA'] = 0.5
        except Exception as e:
            print(f"Error calculating MIA-Efficacy: {e}")
            result_metrics['C-MIA'] = 0.5
            result_metrics['E-MIA'] = 0.5
        
        return result_metrics
        
    except Exception as e:
        print(f"Error calculating comprehensive epoch metrics: {e}")
        return None




async def initialize_epoch_metrics_system(
    model,
    train_set,
    test_set,
    train_loader,
    device,
    forget_class,
    enable_ps=False,
    enable_mia=False
):
    """
    Initialize components needed for comprehensive epoch metrics calculation.
    
    Args:
        model: Initial model for MIA classifier training
        train_set: Training dataset
        test_set: Test dataset
        train_loader: Training data loader
        device: Device to use
        forget_class: Class to forget
        enable_ps: Whether PS calculation will be needed
        enable_mia: Whether MIA calculation will be needed
        
    Returns:
        Dictionary with initialized components
    """
    components = {
        'retrain_metrics_cache': None,
        'mia_classifier': None,
        'shadow_loaders': None
    }
    
    # Initialize retrain cache for PS if enabled
    if enable_ps:
        try:
            from app.utils.attack_full_dataset import calculate_model_metrics
            from app.models.resnet import get_resnet18
            import os
            
            retrain_model_path = f"unlearned_models/{forget_class}/a00{forget_class}.pth"
            if os.path.exists(retrain_model_path):
                print("Pre-calculating retrain metrics for PS optimization...")
                retrain_model = get_resnet18().to(device)
                retrain_model.load_state_dict(torch.load(retrain_model_path, map_location=device))
                retrain_model.eval()
                
                components['retrain_metrics_cache'] = await calculate_model_metrics(
                    retrain_model, train_loader, device, forget_class, 2.0, 1.0,
                    create_plots=True, model_name="Retrain"
                )
                print(f"Retrain metrics cached: {len(components['retrain_metrics_cache']['entropies'])} samples")
                
                # Free memory
                del retrain_model
                if device.type == 'cuda':
                    torch.cuda.empty_cache()
        except Exception as e:
            print(f"Error pre-calculating retrain metrics: {e}")
    
    # Initialize MIA classifier if enabled
    if enable_mia:
        try:
            from app.utils.salun_mia import train_mia_classifier_once
            from torch.utils.data import DataLoader, Subset
            import random
            
            print("Initializing MIA classifier...")
            
            # Create shadow loaders
            if hasattr(train_set, 'targets'):
                remaining_train_indices = [i for i, target in enumerate(train_set.targets) 
                                          if target != forget_class]
            elif hasattr(train_set, 'samples'):
                remaining_train_indices = [i for i, (_, target) in enumerate(train_set.samples) 
                                          if target != forget_class]
            else:
                raise ValueError(f"Unsupported dataset type: {type(train_set)}")
            shadow_train_size = min(4500, len(remaining_train_indices))
            shadow_train_indices = random.sample(remaining_train_indices, shadow_train_size)
            shadow_train_subset = Subset(train_set, shadow_train_indices)
            shadow_train_loader = DataLoader(shadow_train_subset, batch_size=128, shuffle=False)
            
            if hasattr(test_set, 'targets'):
                remaining_test_indices = [i for i, target in enumerate(test_set.targets) 
                                         if target != forget_class]
            elif hasattr(test_set, 'samples'):
                remaining_test_indices = [i for i, (_, target) in enumerate(test_set.samples) 
                                         if target != forget_class]
            else:
                raise ValueError(f"Unsupported dataset type: {type(test_set)}")
            shadow_test_size = min(4500, len(remaining_test_indices))
            shadow_test_indices = random.sample(remaining_test_indices, shadow_test_size)
            shadow_test_subset = Subset(test_set, shadow_test_indices)
            shadow_test_loader = DataLoader(shadow_test_subset, batch_size=128, shuffle=False)
            
            components['shadow_loaders'] = {
                'shadow_train': shadow_train_loader,
                'shadow_test': shadow_test_loader
            }
            
            # Train MIA classifier
            components['mia_classifier'] = await train_mia_classifier_once(
                baseline_model=model,
                shadow_train_loader=shadow_train_loader,
                shadow_test_loader=shadow_test_loader,
                device=device,
                forget_class=forget_class
            )
            print("MIA classifier training completed!")
            
        except Exception as e:
            print(f"Error initializing MIA classifier: {e}")
    
    return components


def update_epoch_metrics_collection(
    epoch_metrics,
    metrics
):
    """
    Update epoch metrics collection with new values.
    
    Args:
        epoch_metrics: Dictionary of metric lists to update
        metrics: New metrics to append (can be None)
    """
    if metrics is None:
        return
        
    for key, value in metrics.items():
        if key in epoch_metrics:
            epoch_metrics[key].append(value)


def save_epoch_plots(
    epoch_metrics,
    method,
    forget_class,
    experiment_id
):
    """
    Save epoch-wise plots if metrics were collected.
    
    Args:
        epoch_metrics: Dictionary of collected metrics
        method: Unlearning method name
        forget_class: Class to forget
        experiment_id: Experiment ID
        
    Returns:
        Path to saved plot or None if no metrics
    """
    if not epoch_metrics or not any(epoch_metrics.values()):
        return None
        
    try:
        from app.utils.epoch_plotting import plot_epoch_metrics
        
        plot_path = plot_epoch_metrics(
            epoch_metrics=epoch_metrics,
            method=method,
            forget_class=forget_class,
            experiment_id=experiment_id
        )
        return plot_path
        
    except Exception as e:
        print(f"Error generating epoch plot: {e}")
        return None