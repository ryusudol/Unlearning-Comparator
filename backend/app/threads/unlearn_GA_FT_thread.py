import torch
import time
import uuid
from app.utils.helpers import (
	format_distribution
)
from app.utils.evaluation import (
	calculate_cka_similarity,
	evaluate_model_with_distributions, 
	get_layer_activations_and_predictions
)
from app.utils.visualization import compute_umap_embedding
from app.config.settings import (
	MAX_GRAD_NORM
)
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
	calculate_comprehensive_epoch_metrics,
	initialize_epoch_metrics_system,
	update_epoch_metrics_collection,
	save_epoch_plots
)

class UnlearningGAFTThread(BaseUnlearningThread):
    def __init__(
        self,
        request,
        status,
        model_after,
        retain_loader,
        forget_loader,
        train_loader,
        test_loader,
        train_set,
        test_set,
        criterion,
        ga_optimizer,
        ft_optimizer,
        scheduler,
        device,
        base_weights_path,
        freeze_first_k_layers=0,
        reinit_last_k_layers=0,
        enable_epoch_metrics=True
    ):
        super().__init__()
        self.request = request
        self.status = status
        self.model = model_after

        self.retain_loader = retain_loader
        self.forget_loader = forget_loader
        self.train_loader = train_loader
        self.test_loader = test_loader

        self.train_set = train_set
        self.test_set = test_set
        
        self.criterion = criterion
        self.ga_optimizer = ga_optimizer  # GA optimizer with lr/10
        self.ft_optimizer = ft_optimizer  # FT optimizer with original lr
        self.scheduler = scheduler
        self.device = device
        self.base_weights_path = base_weights_path
        self.freeze_first_k_layers = freeze_first_k_layers
        self.reinit_last_k_layers = reinit_last_k_layers
        self.enable_epoch_metrics = enable_epoch_metrics
        self.num_classes = 10
        self.remain_classes = [i for i in range(self.num_classes) if i != self.request.forget_class]

    async def async_main(self):
        print(f"Starting GA+FT unlearning for class {self.request.forget_class}...")
        print(f"GA LR: {self.ga_optimizer.param_groups[0]['lr']:.5f}, FT LR: {self.ft_optimizer.param_groups[0]['lr']:.5f}")
        
        # Display batch size information if available
        ga_batch_info = f"GA Batch: {self.ga_batch_size}" if hasattr(self, 'ga_batch_size') else "GA Batch: default"
        ft_batch_info = f"FT Batch: {self.ft_batch_size}" if hasattr(self, 'ft_batch_size') else "FT Batch: default"
        print(f"Batch sizes - {ga_batch_info}, {ft_batch_info}")
        
        self.status.progress = "Unlearning"
        self.status.method = "GA+FT"
        self.status.recent_id = uuid.uuid4().hex[:4]
        self.status.total_epochs = self.request.epochs
        
        umap_subset, umap_subset_loader, selected_indices = setup_umap_subset(
            self.train_set, self.test_set, self.num_classes
        )
        
        # Apply layer freezing and reinitialization if requested
        if self.freeze_first_k_layers > 0 or self.reinit_last_k_layers > 0:
            from app.utils.layer_utils import apply_layer_modifications
            stats = apply_layer_modifications(
                model=self.model,
                freeze_first_k=self.freeze_first_k_layers,
                freeze_last_k=0,
                reinit_last_k=self.reinit_last_k_layers
            )
            
            # Print detailed information about modified layers
            print("=" * 60)
            print("LAYER MODIFICATION SUMMARY")
            print("=" * 60)
            
            if stats['frozen_layers']:
                print(f"🔒 FROZEN LAYERS ({stats['frozen_params']:,} parameters):")
                for layer in stats['frozen_layers']:
                    print(f"   - {layer}")
            
            if stats['reinitialized_layers']:
                print(f"🔄 REINITIALIZED LAYERS ({stats['reinitialized_params']:,} parameters):")
                for layer in stats['reinitialized_layers']:
                    print(f"   - {layer}")
            
            total_params = sum(p.numel() for p in self.model.parameters())
            trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
            print(f"📊 TRAINING STATISTICS:")
            print(f"   - Total parameters: {total_params:,}")
            print(f"   - Trainable parameters: {trainable_params:,}")
            print(f"   - Frozen parameters: {total_params - trainable_params:,}")
            print("=" * 60)
        
        # Epoch metrics controlled from service
        # Initialize epoch-wise metrics collection (all-or-nothing toggle)
        
        epoch_metrics = {
            'UA': [],  # Unlearning Accuracy (train)
            'RA': [],  # Retain Accuracy (remaining classes)
            'TUA': [], # Test Unlearning Accuracy
            'TRA': [], # Test Retaining Accuracy
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

        # PHASE 0: Initial Fine-Tuning on retain set for stability (if reinit_last_k > 0)
        if self.reinit_last_k_layers > 0:
            print("=" * 60)
            print("PHASE 0: Initial Fine-Tuning for GA Stability")
            print("=" * 60)
            
            self.model.train()
            self.status.current_epoch = 1
            epoch_ft_loss = 0.0
            ft_batches = 0
            
            print("Epoch 0 (Initial FT): Fine-tuning on retain set...")
            for i, (inputs, labels) in enumerate(self.retain_loader):
                if self.check_stopped_and_return(self.status):
                    return
                inputs, labels = inputs.to(self.device), labels.to(self.device)
                self.ft_optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = self.criterion(outputs, labels)
                loss.backward()

                self.ft_optimizer.step()
                epoch_ft_loss += loss.item()
                ft_batches += 1

            avg_ft_loss = epoch_ft_loss / ft_batches if ft_batches > 0 else 0.0
            
            # Evaluate on forget set after initial FT
            _, initial_forget_acc = evaluate_on_forget_set(
                self.model, self.forget_loader, self.criterion, self.device
            )
            
            # Calculate comprehensive epoch metrics if enabled (exclude from timing)
            if self.enable_epoch_metrics:
                metrics_start = time.time()
                print(f"Collecting comprehensive metrics for initial FT epoch...")
                metrics = await calculate_comprehensive_epoch_metrics(
                    self.model, self.train_loader, self.test_loader,
                    self.train_set, self.test_set, self.criterion, self.device,
                    self.request.forget_class, self.enable_epoch_metrics,
                    metrics_components['retrain_metrics_cache'] if metrics_components else None,
                    metrics_components['mia_classifier'] if metrics_components else None,
                    current_epoch=1
                )
                update_epoch_metrics_collection(epoch_metrics, metrics)
                total_metrics_time += time.time() - metrics_start
            
            # Print progress for initial FT
            additional_metrics = None
            if self.enable_epoch_metrics and epoch_metrics and len(epoch_metrics['UA']) > 1:
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
                1, self.request.epochs + 1, avg_ft_loss, initial_forget_acc,
                eta=None,
                additional_metrics=additional_metrics
            )

        for epoch in range(self.request.epochs):
            epoch_start_time = time.time()  # Epoch 시작 시간
            self.model.train()
            self.status.current_epoch = epoch + 1
            epoch_ga_loss = 0.0
            epoch_ft_loss = 0.0
            ga_batches = 0
            ft_batches = 0
            
            # Stage 1: GA stage - Gradient Ascent on forget set
            ga_stage_start = time.time()
            print(f"Epoch {epoch + 1}: Starting GA (Gradient Ascent) stage...")
            for i, (inputs, labels) in enumerate(self.forget_loader):
                if self.check_stopped_and_return(self.status):
                    return
                inputs, labels = inputs.to(self.device), labels.to(self.device)
                self.ga_optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = -self.criterion(outputs, labels)  # Negative loss for gradient ascent
                loss.backward()

                torch.nn.utils.clip_grad_norm_(self.model.parameters(), MAX_GRAD_NORM)
                self.ga_optimizer.step()
                epoch_ga_loss += (-loss.item())  # Store positive loss for display
                ga_batches += 1
            
            ga_stage_time = time.time() - ga_stage_start
            print(f"  GA stage completed in {ga_stage_time:.2f}s ({ga_batches} batches)")

            # Stage 2: FT stage - Fine-tuning on retain set
            ft_stage_start = time.time()
            print(f"Epoch {epoch + 1}: Starting FT (Fine-Tuning) stage...")
            for i, (inputs, labels) in enumerate(self.retain_loader):
                if self.check_stopped_and_return(self.status):
                    return
                inputs, labels = inputs.to(self.device), labels.to(self.device)
                self.ft_optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = self.criterion(outputs, labels)
                loss.backward()

                self.ft_optimizer.step()
                epoch_ft_loss += loss.item()
                ft_batches += 1
            
            ft_stage_time = time.time() - ft_stage_start
            print(f"  FT stage completed in {ft_stage_time:.2f}s ({ft_batches} batches)")

            # Calculate average losses for this epoch
            avg_ga_loss = epoch_ga_loss / ga_batches if ga_batches > 0 else 0.0
            avg_ft_loss = epoch_ft_loss / ft_batches if ft_batches > 0 else 0.0
            combined_loss = (avg_ga_loss + avg_ft_loss) / 2.0  # Combined loss for status
            
            # Evaluate on forget set to get forget accuracy
            _, forget_epoch_acc = evaluate_on_forget_set(
                self.model, self.forget_loader, self.criterion, self.device
            )
            
            self.scheduler.step()  # GA scheduler
            if hasattr(self, 'ft_scheduler'):
                self.ft_scheduler.step()  # FT scheduler

            # Update status with combined metrics
            update_training_status(
                self.status, epoch, self.request.epochs, start_time, 
                combined_loss, forget_epoch_acc
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
            
            # Print progress using standard format like FT
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
                epoch + 1, self.request.epochs, combined_loss, forget_epoch_acc,
                eta=self.status.estimated_time_remaining,
                additional_metrics=additional_metrics
            )
            
            epoch_total_time = time.time() - epoch_start_time
            print(f"📊 Epoch {epoch + 1} TOTAL TIME: {epoch_total_time:.2f}s (GA: {ga_stage_time:.2f}s, FT: {ft_stage_time:.2f}s)")
            print("-" * 60)

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
        ) = await evaluate_model_with_distributions (
            model=self.model, 
            data_loader=self.train_loader,
            criterion=self.criterion, 
            device=self.device,
        )
        
        unlearn_accuracy = train_class_accuracies[self.request.forget_class]
        remain_accuracy = round(
            sum(train_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes), 3
        )
        # Update training evaluation status for remain classes only
        self.status.p_training_loss = train_loss
        remain_train_accuracy = sum(train_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes)
        self.status.p_training_accuracy = remain_train_accuracy

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
            device=self.device,
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
        print(f"Layer activations computed at {time.time() - start_time:.3f} seconds")

        # UMAP embedding computation
        print("Computing UMAP embedding")
        forget_labels = torch.tensor([label == self.request.forget_class for _, label in umap_subset])
        umap_embedding = await compute_umap_embedding(
            activation=activations, 
            labels=predicted_labels, 
            forget_class=self.request.forget_class,
            forget_labels=forget_labels
        )
        print(f"UMAP embedding computed in {time.time() - start_time:.3f}s")
        
        # Process attack metrics using the same umap_subset_loader (for UI)
        print("Processing attack metrics on UMAP subset")
        values, attack_results, _ = await process_attack_metrics(
            model=self.model, 
            data_loader=umap_subset_loader, 
            device=self.device, 
            forget_class=self.request.forget_class,
            create_plots=False  # No plots for UI data
        )
        
        # Calculate Privacy Score on full dataset for final results
        print("Calculating Privacy Score on full dataset")
        _, _, final_fqs = await process_attack_metrics(
            model=self.model, 
            data_loader=self.train_loader, 
            device=self.device, 
            forget_class=self.request.forget_class,
            create_plots=False
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
        cka_results = await calculate_cka_similarity(
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
            "GA+FT", self.request
        )
        
        results.update({
            "UA": round(unlearn_accuracy, 3),
            "RA": remain_accuracy,
            "TUA": round(test_unlearn_accuracy, 3),
            "TRA": test_remain_accuracy,
            "RTE": round(rte, 1),
            "FQS": final_fqs,
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
        if self.enable_epoch_metrics and epoch_metrics:
            print("Generating epoch-wise plots...")
            plot_path = save_epoch_plots(
                epoch_metrics, "GA_FT", self.request.forget_class, self.status.recent_id
            )
  # Add epoch metrics to results (rounded to 3 decimal places)
            results["epoch_metrics"] = {
                key: [round(val, 3) for val in values] for key, values in epoch_metrics.items()
            }

        # Save results and model
        result_path = save_results_and_model(
            results, self.model, self.request.forget_class, self.status
        )
        
        print(f"Results saved to {result_path}")
        print("GA+FT Unlearning inference completed!")
        self.status.progress = "Completed"