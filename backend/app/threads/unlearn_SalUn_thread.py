import torch
import time
import uuid
from app.utils.helpers import format_distribution
from app.utils.evaluation import (
    calculate_cka_similarity,
    evaluate_model_with_distributions,
    get_layer_activations_and_predictions
)
from app.utils.visualization import compute_umap_embedding
from app.utils.attack import process_attack_metrics
from app.utils.thread_base import BaseUnlearningThread
from app.utils.thread_operations import (
    setup_umap_subset,
    update_training_status,
    prepare_detailed_results,
    create_base_results_dict,
    save_results_and_model,
    print_epoch_progress,
    evaluate_on_forget_set,
    calculate_accuracy_metrics,
    calculate_comprehensive_epoch_metrics,
    initialize_epoch_metrics_system,
    update_epoch_metrics_collection,
    save_epoch_plots
)


class UnlearningSalUnThread(BaseUnlearningThread):
    def __init__(
        self,
        request,
        status,
        model_before,
        model_after,
        retain_loader,
        forget_loader,
        train_loader,
        test_loader,
        train_set,
        test_set,
        criterion,
        optimizer,
        scheduler,
        device,
        base_weights_path,
        salun_config,
        enable_epoch_metrics=True
    ):
        super().__init__()
        self.request = request
        self.status = status
        self.model_before = model_before
        self.model = model_after

        self.retain_loader = retain_loader
        self.forget_loader = forget_loader
        self.train_loader = train_loader
        self.test_loader = test_loader

        self.train_set = train_set
        self.test_set = test_set
        
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device
        self.base_weights_path = base_weights_path
        self.enable_epoch_metrics = enable_epoch_metrics
        self.num_classes = 10
        self.remain_classes = [i for i in range(self.num_classes) if i != self.request.forget_class]
        
        # SalUn specific hyperparameters
        self.saliency_threshold = salun_config['saliency_threshold']
        self.use_random_labels = salun_config['use_random_labels']
        self.grad_clip = salun_config['grad_clip']
        
        # Initialize saliency mask
        self.saliency_mask = None

    def _compute_gradient_saliency(self):
        """Compute gradient-based weight saliency map using forget data"""
        print("Computing gradient-based weight saliency...")
        
        # Initialize gradient accumulator
        gradient_dict = {}
        for name, param in self.model.named_parameters():
            if param.requires_grad:
                gradient_dict[name] = torch.zeros_like(param)
        
        self.model.eval()
        
        # Compute gradients on forget dataset
        batch_count = 0
        for data, target in self.forget_loader:
            data, target = data.to(self.device), target.to(self.device)
            
            self.optimizer.zero_grad()
            output = self.model(data)
            
            # Use negative loss for gradient ascent on forget data
            loss = -self.criterion(output, target)
            loss.backward()
            
            # Accumulate gradient magnitudes
            for name, param in self.model.named_parameters():
                if param.requires_grad and param.grad is not None:
                    gradient_dict[name] += param.grad.abs()
            
            batch_count += 1
            if batch_count >= 5:  # Limit computation for efficiency
                break
        
        # Normalize by number of batches
        for name in gradient_dict:
            gradient_dict[name] /= batch_count
        
        # Generate saliency mask based on threshold
        all_grads = torch.cat([gradient_dict[name].flatten() 
                              for name in gradient_dict.keys()])
        
        # Select top-k% most salient weights
        k = int(self.saliency_threshold * len(all_grads))
        if k > 0:
            topk_values, _ = torch.topk(all_grads, k)
            threshold_value = topk_values[-1]
        else:
            threshold_value = float('inf')
        
        # Create binary mask and move to device
        mask = {}
        for name in gradient_dict.keys():
            mask[name] = (gradient_dict[name] >= threshold_value).float().to(self.device)
        
        print(f"Saliency mask created with threshold {self.saliency_threshold} "
              f"({k}/{len(all_grads)} parameters selected)")
        
        return mask


    def _apply_saliency_mask_to_gradients(self, apply_mask=True):
        """Apply saliency mask to model gradients"""
        if self.saliency_mask is None or not apply_mask:
            return
            
        with torch.no_grad():
            for name, param in self.model.named_parameters():
                if name in self.saliency_mask and param.grad is not None:
                    # Apply saliency mask: only update salient weights
                    param.grad *= self.saliency_mask[name]

    def _salun_unlearn_step(self, data, target, is_forget_batch=True):
        """Perform one SalUn unlearning step following official RL implementation"""
        data, target = data.to(self.device), target.to(self.device)
        
        # Apply random labeling to ALL samples in forget batch (excluding forget class)
        if is_forget_batch and self.use_random_labels:
            # Efficient random label assignment excluding forget class
            other_classes = [c for c in range(self.num_classes) if c != self.request.forget_class]
            rand_idx = torch.randint(0, len(other_classes), target.shape, device=self.device)
            target = torch.tensor(other_classes, device=self.device)[rand_idx]
        
        self.optimizer.zero_grad()
        output = self.model(data)
        
        # Standard cross-entropy loss (same for forget and retain)
        loss = self.criterion(output, target)
        loss.backward()
        
        # Apply saliency mask to ALL batches (official SalUn behavior)
        self._apply_saliency_mask_to_gradients(apply_mask=True)
        
        # Gradient clipping
        if self.grad_clip > 0:
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=self.grad_clip)
        
        self.optimizer.step()
        
        return loss.item()

    async def async_main(self):
        print(f"Starting SalUn unlearning for class {self.request.forget_class}...")
        self.status.progress = "Unlearning"
        self.status.method = "SalUn"
        self.status.recent_id = uuid.uuid4().hex[:4]
        self.status.total_epochs = self.request.epochs

        umap_subset, umap_subset_loader, selected_indices = setup_umap_subset(
            self.train_set, self.test_set, self.num_classes
        )
        
        # Epoch metrics controlled from service
        # Initialize epoch-wise metrics collection
        
        epoch_metrics = {
            'UA': [],  # Unlearn Accuracy (train)
            'RA': [],  # Retain Accuracy (remaining classes)
            'TUA': [], # Test Unlearn Accuracy
            'TRA': [], # Test Remaining Accuracy
            'PS': [],  # Privacy Score
            'C-MIA': [],  # Confidence-based MIA
            'E-MIA': []   # Entropy-based MIA
        } if self.enable_epoch_metrics else {}
        
        # Initialize comprehensive metrics system if enabled
        metrics_components = None
        if self.enable_epoch_metrics:
            metrics_components = await initialize_epoch_metrics_system(
                self.model, self.train_set, self.test_set, self.train_loader, self.device,
                self.request.forget_class, True, True  # Enable both PS and MIA
            )
        
        # Step 1: Compute gradient-based saliency mask
        self.status.progress = "Computing Saliency Map"
        self.saliency_mask = self._compute_gradient_saliency()
        
        # Collect epoch 0 metrics (initial state before training)
        if self.enable_epoch_metrics:
            print("Collecting initial metrics (epoch 0)...")
            initial_metrics = await calculate_comprehensive_epoch_metrics(
                self.model, self.train_loader, self.test_loader,
                self.train_set, self.test_set, self.criterion, self.device,
                self.request.forget_class, self.enable_epoch_metrics,
                metrics_components['retrain_metrics_cache'] if metrics_components else None,
                metrics_components['mia_classifier'] if metrics_components else None,
                current_epoch=0
            )
            update_epoch_metrics_collection(epoch_metrics, initial_metrics)
            
            # Display epoch 0 metrics
            if initial_metrics:
                print_epoch_progress(
                    0, self.request.epochs, 0.0, initial_metrics.get('UA', 0.0),
                    eta=None,
                    additional_metrics={
                        'UA': initial_metrics.get('UA', 0.0),
                        'RA': initial_metrics.get('RA', 0.0),
                        'TUA': initial_metrics.get('TUA', 0.0),
                        'TRA': initial_metrics.get('TRA', 0.0),
                        'PS': initial_metrics.get('PS', 0.0),
                        'C-MIA': initial_metrics.get('C-MIA', 0.0),
                        'E-MIA': initial_metrics.get('E-MIA', 0.0)
                    }
                )

        # Start timing after all preprocessing  
        start_time = time.time()
        total_metrics_time = 0  # Accumulate metrics calculation time

        # Step 2: SalUn Unlearning Training Loop (Sequential: Forget → Retain, following official CIFAR-10 approach)
        for epoch in range(self.request.epochs):
            self.model.train()
            self.status.current_epoch = epoch + 1
            running_loss = 0.0
            total = 0
            correct = 0
            
            print(f"Epoch {epoch + 1}: SalUn RL method - forget data with random labels, then retain data")
            
            # Phase 1: Process forget data with random labeling
            for i, (inputs, labels) in enumerate(self.forget_loader):
                if self.stopped():
                    self.status.is_unlearning = False
                    print("\nTraining cancelled mid-batch.")
                    return

                loss = self._salun_unlearn_step(inputs, labels, is_forget_batch=True)
                running_loss += loss

                # Track accuracy for forget data
                with torch.no_grad():
                    inputs, labels = inputs.to(self.device), labels.to(self.device)
                    outputs = self.model(inputs)
                    _, predicted = torch.max(outputs.data, 1)
                    total += labels.size(0)
                    correct += (predicted == labels).sum().item()
            
            # Phase 2: Process retain data with normal training
            for i, (inputs, labels) in enumerate(self.retain_loader):
                if self.stopped():
                    self.status.is_unlearning = False
                    print("\nTraining cancelled mid-batch.")
                    return

                loss = self._salun_unlearn_step(inputs, labels, is_forget_batch=False)
                running_loss += loss

                # Track accuracy for retain data
                with torch.no_grad():
                    inputs, labels = inputs.to(self.device), labels.to(self.device)
                    outputs = self.model(inputs)
                    _, predicted = torch.max(outputs.data, 1)
                    total += labels.size(0)
                    correct += (predicted == labels).sum().item()

            # Update learning rate
            if self.scheduler:
                self.scheduler.step()

            # Evaluate on forget loader after each epoch
            forget_epoch_loss, forget_epoch_acc = evaluate_on_forget_set(
                self.model, self.forget_loader, self.criterion, self.device
            )
            
            # Update status
            update_training_status(
                self.status, epoch, self.request.epochs, start_time, 
                forget_epoch_loss, forget_epoch_acc
            )

            # Calculate comprehensive epoch metrics if enabled (exclude from timing)
            if self.enable_epoch_metrics:
                metrics_start = time.time()
                print(f"Collecting comprehensive metrics for epoch {epoch + 1}...")
                metrics = await calculate_comprehensive_epoch_metrics(
                    self.model, self.train_loader, self.test_loader,
                    self.train_set, self.test_set, self.criterion, self.device,
                    self.request.forget_class, self.enable_epoch_metrics,
                    metrics_components['retrain_metrics_cache'] if metrics_components else None,
                    metrics_components['mia_classifier'] if metrics_components else None,
                    current_epoch=epoch + 1
                )
                update_epoch_metrics_collection(epoch_metrics, metrics)
                total_metrics_time += time.time() - metrics_start
            
            # Print progress
            additional_metrics = None
            if self.enable_epoch_metrics and epoch_metrics and len(epoch_metrics['UA']) > 0:
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

        # Calculate pure training time (excluding metrics calculation)
        rte = time.time() - start_time - total_metrics_time

        if self.check_stopped_and_return(self.status):
            return

        # Evaluate on train set
        self.status.progress = "Evaluating Train Set"
        print("Start Train set evaluation")
        (
            train_loss,
            train_accuracy,
            train_class_accuracies, 
            train_label_dist, 
            train_conf_dist
        ) = await evaluate_model_with_distributions(
            model=self.model, 
            data_loader=self.train_loader,
            criterion=self.criterion, 
            device=self.device
        )

        # Update training evaluation status for remain classes only
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

        if self.stopped():
            return
        
        # Evaluate on test set
        self.status.progress = "Evaluating Test Set"
        print("Start Test set evaluation")
        (
            test_loss, 
            test_accuracy, 
            test_class_accuracies, 
            test_label_dist, 
            test_conf_dist
        ) = await evaluate_model_with_distributions(
            model=self.model, 
            data_loader=self.test_loader, 
            criterion=self.criterion, 
            device=self.device
        )

        # Update test evaluation status for remain classes only
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
        ) = await get_layer_activations_and_predictions(
            model=self.model,
            data_loader=umap_subset_loader,
            device=self.device,
        )

        # UMAP embedding computation
        print("Computing UMAP embedding")
        forget_labels = torch.tensor([label == self.request.forget_class for _, label in umap_subset])
        umap_embedding = await compute_umap_embedding(
            activation=activations, 
            labels=predicted_labels, 
            forget_class=self.request.forget_class,
            forget_labels=forget_labels
        )
        
        # Process attack metrics using the same umap_subset_loader
        print("Processing attack metrics on UMAP subset")
        values, attack_results, fqs = await process_attack_metrics(
            model=self.model, 
            data_loader=umap_subset_loader, 
            device=self.device, 
            forget_class=self.request.forget_class,
            create_plots=False  # No plots for UI data
        )
        
        # Generate distribution plots on full forget class data (for analysis)
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
        cka_results = await calculate_cka_similarity(
            model_before=self.model_before,
            model_after=self.model,
            forget_class=self.request.forget_class,
            device=self.device,
        )

        # Calculate accuracy metrics after both train and test evaluations
        accuracy_metrics = calculate_accuracy_metrics(
            train_class_accuracies, test_class_accuracies, 
            self.request.forget_class, self.num_classes
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
            "SalUn", self.request
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
            },
            "saliency_threshold": self.saliency_threshold,  # Add SalUn-specific info
            "use_random_labels": self.use_random_labels
        })
        
        # Generate epoch-wise plots if we have collected metrics
        if self.enable_epoch_metrics and epoch_metrics:
            print("Generating epoch-wise plots...")
            plot_path = save_epoch_plots(
                epoch_metrics, "SalUn", self.request.forget_class, self.status.recent_id
            )
            if plot_path:
                results["epoch_plot_path"] = plot_path
            
            # Add epoch metrics to results (rounded to 3 decimal places)
            results["epoch_metrics"] = {
                key: [round(val, 3) for val in values] for key, values in epoch_metrics.items()
            }

        # Save results and model
        result_path = save_results_and_model(
            results, self.model, self.request.forget_class, self.status
        )
        
        print(f"Results saved to {result_path}")
        print("SalUn Unlearning inference completed!")
        self.status.progress = "Completed"