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
	calculate_comprehensive_epoch_metrics,
	initialize_epoch_metrics_system,
	update_epoch_metrics_collection,
	save_epoch_plots
)
from app.utils.layer_utils import apply_layer_modifications

class UnlearningGAThread(BaseUnlearningThread):
    def __init__(
        self,
        request,
        status,
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
        base_weights_path,
        freeze_first_k_layers=0,
        freeze_last_k_layers=0,
        reinit_last_k_layers=0,
        enable_epoch_metrics=True
    ):
        super().__init__()
        self.request = request
        self.status = status
        self.model = model_after

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
        
        # Layer modification parameters
        self.freeze_first_k_layers = freeze_first_k_layers
        self.freeze_last_k_layers = freeze_last_k_layers
        self.reinit_last_k_layers = reinit_last_k_layers
        
        # Epoch metrics configuration
        self.enable_epoch_metrics = enable_epoch_metrics

    async def async_main(self):
        print(f"Starting GA unlearning for class {self.request.forget_class}...")
        self.status.progress = "Unlearning"
        self.status.method = "Gradient-Ascent"
        self.status.recent_id = uuid.uuid4().hex[:4]
        self.status.total_epochs = self.request.epochs
        
        umap_subset, umap_subset_loader, selected_indices = setup_umap_subset(
            self.train_set, self.test_set, self.num_classes
        )
        
        # Apply layer freezing and reinitialization if requested
        if self.freeze_first_k_layers > 0 or self.freeze_last_k_layers > 0 or self.reinit_last_k_layers > 0:
            stats = apply_layer_modifications(
                model=self.model,
                freeze_first_k=self.freeze_first_k_layers,
                freeze_last_k=self.freeze_last_k_layers,
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
        
        # Initialize epoch-wise metrics collection (controlled from service)
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

        for epoch in range(self.request.epochs):
            self.model.train()
            running_loss = 0.0
            correct = 0
            total = 0
            
            for i, (inputs, labels) in enumerate(self.forget_loader):
                if self.check_stopped_and_return(self.status):
                    return
                inputs, labels = inputs.to(self.device), labels.to(self.device)
                self.optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = -self.criterion(outputs, labels)
                loss.backward()

                torch.nn.utils.clip_grad_norm_(self.model.parameters(), MAX_GRAD_NORM)
                self.optimizer.step()
                running_loss += (-loss.item())

                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()

            epoch_loss = running_loss / len(self.forget_loader)
            epoch_acc = correct / total
            self.scheduler.step()

            # Update status
            update_training_status(
                self.status, epoch, self.request.epochs, start_time, epoch_loss, epoch_acc
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
            current_lr = self.optimizer.param_groups[0]['lr']
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
                epoch + 1, self.request.epochs, epoch_loss, epoch_acc, 
                current_lr, self.status.estimated_time_remaining,
                additional_metrics
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
            test_accuracy, 
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
        values, attack_results, fqs = await process_attack_metrics(
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
            "GradientAscent", self.request
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
                epoch_metrics, "GA", self.request.forget_class, self.status.recent_id
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
        print("GA Unlearning inference completed!")
        self.status.progress = "Completed"