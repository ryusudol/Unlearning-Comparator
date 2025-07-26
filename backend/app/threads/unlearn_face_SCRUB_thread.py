import torch
import torch.nn.functional as F
import time
import uuid
from app.utils.helpers import format_distribution
from app.models import get_facenet_model
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


class UnlearningFaceSCRUBThread(BaseUnlearningThread):
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
        scrub_config
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
        self.num_classes = 10
        self.remain_classes = [i for i in range(self.num_classes) if i != self.request.forget_class]
        
        # SCRUB specific hyperparameters (configured from service)
        self.alpha = scrub_config['alpha']                # Knowledge distillation weight
        self.beta = scrub_config['beta']                  # Forget set loss weight
        self.gamma = scrub_config['gamma']                # Retain set loss weight
        self.kd_temperature = scrub_config['kd_temperature']  # Temperature for knowledge distillation
        self.msteps = scrub_config['msteps']              # Maximum steps for forget set loss
        
        # Create teacher model (copy of original model for knowledge distillation)
        self.teacher_model = self._create_teacher_model()

    def _create_teacher_model(self):
        """Create teacher model for knowledge distillation"""
        teacher_model = get_facenet_model(self.device)
        teacher_model.load_state_dict(self.model_before.state_dict())
        teacher_model.eval()
        return teacher_model

    def _compute_fisher_information(self, data_loader, num_samples=1000):
        """Compute Fisher Information Matrix for important parameters"""
        self.model.eval()
        fisher_dict = {}
        
        # Initialize Fisher information dictionary
        for name, param in self.model.named_parameters():
            if param.requires_grad:
                fisher_dict[name] = torch.zeros_like(param)
        
        sample_count = 0
        for inputs, labels in data_loader:
            if sample_count >= num_samples:
                break
                
            inputs, labels = inputs.to(self.device), labels.to(self.device)
            
            # Forward pass
            outputs = self.model(inputs)
            loss = self.criterion(outputs, labels)
            
            # Backward pass to compute gradients
            self.model.zero_grad()
            loss.backward()
            
            # Accumulate Fisher information (square of gradients)
            for name, param in self.model.named_parameters():
                if param.requires_grad and param.grad is not None:
                    fisher_dict[name] += param.grad.data ** 2
            
            sample_count += inputs.size(0)
        
        # Normalize by number of samples
        for name in fisher_dict:
            fisher_dict[name] /= sample_count
            
        return fisher_dict

    def _scrub_loss(self, outputs, labels, teacher_outputs, is_forget_batch=False):
        """Compute SCRUB loss with knowledge distillation and selective forgetting"""
        # Teacher probabilities (detached)
        teacher_probs = F.softmax(teacher_outputs.detach() / self.kd_temperature, dim=1)
        student_logprobs = F.log_softmax(outputs / self.kd_temperature, dim=1)
        
        # Knowledge distillation loss
        kd_loss = F.kl_div(
            student_logprobs,
            teacher_probs,
            reduction='batchmean'
        ) * (self.kd_temperature ** 2)
        
        # Standard classification loss
        ce_loss = self.criterion(outputs, labels)
        
        if is_forget_batch:
            # SCRUB: KL maximization (negative)
            total_loss = -self.alpha * kd_loss
        else:
            # Retain: normal learning
            total_loss = self.alpha * kd_loss + self.gamma * ce_loss
            
        return total_loss, ce_loss.detach(), kd_loss.detach()

    async def async_main(self):
        print(f"Starting SCRUB unlearning for class {self.request.forget_class}...")
        print(f"SCRUB Config - Alpha: {self.alpha}, Beta: {self.beta}, Gamma: {self.gamma}, KD Temp: {self.kd_temperature}, MSteps: {self.msteps}")
        
        self.status.progress = "Unlearning"
        self.status.method = "SCRUB"
        self.status.recent_id = uuid.uuid4().hex[:4]
        self.status.total_epochs = self.request.epochs
        
        # Get dataset-specific functions
        eval_functions = get_evaluation_functions("face")
        attack_functions = get_attack_functions("face") 
        viz_functions = get_visualization_functions("face")
        
        umap_subset, umap_subset_loader, selected_indices = setup_umap_subset(
            self.train_set, self.test_set, self.num_classes
        )
        
        # Initialize epoch-wise metrics collection (all-or-nothing toggle)
        enable_epoch_metrics = True  # Set to True to enable comprehensive epoch-wise metrics (UA, RA, TUA, TRA, PS, MIA)
        
        epoch_metrics = {
            'UA': [],  # Unlearn Accuracy (train)
            'RA': [],  # Retain Accuracy (remaining classes)
            'TUA': [], # Test Unlearn Accuracy
            'TRA': [], # Test Remaining Accuracy
            'PS': [],  # Privacy Score
            'C-MIA': [],  # Confidence-based MIA
            'E-MIA': []   # Entropy-based MIA
        } if enable_epoch_metrics else {}
        
        # Initialize comprehensive metrics system if enabled
        metrics_components = None
        if enable_epoch_metrics:
            metrics_components = await initialize_epoch_metrics_system(
                self.model, self.train_set, self.test_set, self.train_loader, self.device,
                self.request.forget_class, True, True  # Enable both PS and MIA
            )
        
        # Collect epoch 0 metrics (initial state before training)
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
        
        # Compute Fisher Information Matrix for important parameters
        print("Computing Fisher Information Matrix...")
        self.status.progress = "Computing Fisher Information"
        fisher_dict = self._compute_fisher_information(self.retain_loader, num_samples=1000)

        # Start timing after all preprocessing  
        start_time = time.time()
        total_metrics_time = 0  # Accumulate metrics calculation time

        for epoch in range(self.request.epochs):
            self.model.train()
            self.status.current_epoch = epoch + 1
            running_loss = 0.0
            total = 0
            correct = 0
            
            # SCRUB training: Two-phase approach
            # Phase 1: Maximize loss on forget set (first few epochs)
            if epoch < self.msteps:
                for i, (inputs, labels) in enumerate(self.forget_loader):
                    if self.check_stopped_and_return(self.status):
                        return

                    inputs, labels = inputs.to(self.device), labels.to(self.device)
                    
                    # Get teacher predictions
                    with torch.no_grad():
                        teacher_outputs = self.teacher_model(inputs)
                    
                    self.optimizer.zero_grad()
                    outputs = self.model(inputs)
                    
                    # SCRUB loss for forget batch
                    loss, ce_loss, kd_loss = self._scrub_loss(
                        outputs, labels, teacher_outputs, is_forget_batch=True
                    )
                    
                    loss.backward()
                    
                    # Apply Fisher-weighted gradient clipping
                    for name, param in self.model.named_parameters():
                        if param.requires_grad and param.grad is not None and name in fisher_dict:
                            # Scale gradients by inverse Fisher information (selective dampening)
                            param.grad.data *= (1.0 / (fisher_dict[name] + 1e-8))
                    
                    # Gradient clipping
                    torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                    
                    self.optimizer.step()
                    running_loss += loss.item()

                    _, predicted = torch.max(outputs.data, 1)
                    total += labels.size(0)
                    correct += (predicted == labels).sum().item()
            
            # Phase 2: Minimize loss on retain set (always)
            for i, (inputs, labels) in enumerate(self.retain_loader):
                if self.check_stopped_and_return(self.status):
                    return

                inputs, labels = inputs.to(self.device), labels.to(self.device)
                
                # Get teacher predictions
                with torch.no_grad():
                    teacher_outputs = self.teacher_model(inputs)
                
                self.optimizer.zero_grad()
                outputs = self.model(inputs)
                
                # SCRUB loss for retain batch
                loss, ce_loss, kd_loss = self._scrub_loss(
                    outputs, labels, teacher_outputs, is_forget_batch=False
                )
                
                loss.backward()
                
                # Standard gradient clipping for retain samples
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                
                self.optimizer.step()
                running_loss += loss.item()

                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()

            # Update learning rate
            if self.scheduler:
                self.scheduler.step()

            # Evaluate on forget set to get forget accuracy
            _, forget_epoch_acc = evaluate_on_forget_set(
                self.model, self.forget_loader, self.criterion, self.device
            )
            
            epoch_loss = running_loss / (len(self.forget_loader) + len(self.retain_loader))

            # Update status with combined metrics
            update_training_status(
                self.status, epoch, self.request.epochs, start_time, 
                epoch_loss, forget_epoch_acc
            )

            # Calculate comprehensive epoch metrics if enabled (exclude from timing)
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
            phase_info = f"Phase: {'GA+Retain' if epoch < self.msteps else 'Retain-only'}"
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
                epoch + 1, self.request.epochs, epoch_loss, forget_epoch_acc,
                eta=self.status.estimated_time_remaining,
                additional_metrics=additional_metrics
            )
            
            # Print SCRUB-specific info
            print(f"  {phase_info} (SCRUB α={self.alpha}, β={self.beta}, γ={self.gamma})")

        # Calculate pure training time (excluding metrics calculation)
        rte = time.time() - start_time - total_metrics_time
        
        if self.check_stopped_and_return(self.status):
            return

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
        ) = await eval_functions['get_layer_activations_and_predictions'](
            model=self.model,
            data_loader=umap_subset_loader,
            device=self.device,
        )
        print(f"Layer activations computed at {time.time() - start_time:.3f} seconds")

        # UMAP embedding computation
        print("Computing UMAP embedding")
        forget_labels = torch.tensor([label == self.request.forget_class for _, label in umap_subset])
        umap_embedding = await viz_functions['compute_umap_embedding'](
            activation=activations, 
            labels=predicted_labels, 
            forget_class=self.request.forget_class,
            forget_labels=forget_labels
        )
        print(f"UMAP embedding computed in {time.time() - start_time:.3f}s")
        
        # Add attack metrics processing
        print("Processing attack metrics on UMAP subset")
        values, attack_results, fqs = await attack_functions['process_attack_metrics'](
            model=self.model, 
            data_loader=umap_subset_loader, 
            device=self.device, 
            forget_class=self.request.forget_class
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

        # Compute CKA similarity
        self.status.progress = "Calculating CKA Similarity"
        print("Calculating CKA similarity")
        self.model.eval()  # Ensure model is in eval mode for CKA calculation
        cka_results = await eval_functions['calculate_cka_similarity'](
            model_before=self.model_before,
            model_after=self.model,
            forget_class=self.request.forget_class,
            device=self.device,
        )
        print(f"CKA similarity calculated at {time.time() - start_time:.3f} seconds")

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
            "SCRUB", self.request
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
            # SCRUB-specific hyperparameters
            "scrub_alpha": self.alpha,
            "scrub_beta": self.beta,
            "scrub_gamma": self.gamma,
            "scrub_kd_temperature": self.kd_temperature,
            "scrub_msteps": self.msteps
        })
        
        # Generate epoch-wise plots if we have collected metrics
        if enable_epoch_metrics and epoch_metrics:
            print("Generating epoch-wise plots...")
            plot_path = save_epoch_plots(
                epoch_metrics, "SCRUB", self.request.forget_class, self.status.recent_id
            )
            if plot_path:
                results["epoch_plot_path"] = plot_path
            
            # Add epoch metrics to results (rounded to 3 decimal places)
            results["epoch_metrics"] = {
                key: [round(val, 3) for val in values] for key, values in epoch_metrics.items()
            }

        # Save results and model
        result_path = save_results_and_model(
            results, self.model, self.request.forget_class, self.status, dataset_mode="face"
        )
        
        print(f"Results saved to {result_path}")
        print("SCRUB Unlearning inference completed!")
        self.status.progress = "Completed"