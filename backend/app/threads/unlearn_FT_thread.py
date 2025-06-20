import threading
import asyncio
import torch
import time
import os
import uuid
import json
from app.utils.helpers import (
	save_model, 
    format_distribution, 
    compress_prob_array   
)
from app.utils.evaluation import (
    calculate_cka_similarity,
    evaluate_model_with_distributions,
    get_layer_activations_and_predictions,
    evaluate_model
)
from app.utils.attack import process_attack_metrics
from app.utils.attack_full_dataset import process_attack_metrics_full_dataset
from app.utils.attack_optimized_ps import calculate_ps_with_cached_retrain
from app.utils.visualization import compute_umap_embedding
from app.utils.epoch_plotting import plot_epoch_metrics
from app.config import (
	UMAP_DATA_SIZE, 
	UMAP_DATASET,
	UNLEARN_SEED
)


class UnlearningFTThread(threading.Thread):
    def __init__(
        self,
        model_before,
        model_after,
        device,
        criterion,
        optimizer,
        scheduler,
        request,
        retain_loader,
        forget_loader,
        train_loader,
        test_loader,
        train_set,
        test_set,
        status,
        base_weights_path
    ):
        threading.Thread.__init__(self)
        self.model_before = model_before
        self.model = model_after
        self.device = device
        self.base_weights_path = base_weights_path
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.request = request
        self.retain_loader = retain_loader
        self.forget_loader = forget_loader
        self.train_loader = train_loader
        self.test_loader = test_loader
        self.train_set = train_set
        self.test_set = test_set
        self.status = status
        self.num_classes = 10
        self.remain_classes = [i for i in range(self.num_classes) if i != self.request.forget_class]

        self.exception = None
        self.loop = None
        self._stop_event = threading.Event()

    def stop(self):
        self._stop_event.set()

    def stopped(self):
        return self._stop_event.is_set()

    def run(self):
        try:
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            self.loop.run_until_complete(self.unlearn_FT_model())
        except Exception as e:
            self.exception = e
        finally:
            if self.loop:
                self.loop.close()
        
    async def unlearn_FT_model(self):
        print(f"Starting FT unlearning for class {self.request.forget_class}...")
        self.status.progress = "Unlearning"
        self.status.method = "Fine-Tuning"
        self.status.recent_id = uuid.uuid4().hex[:4]
        self.status.total_epochs = self.request.epochs
        
        # Initialize epoch-wise metrics collection
        epoch_metrics = {
            'UA': [],  # Unlearn Accuracy (train)
            'TA': [],  # Training Accuracy (remaining classes)
            'TUA': [], # Test Unlearn Accuracy
            'TRA': [], # Test Remaining Accuracy
            'PS': []   # Privacy Score
        }
        
        # Pre-calculate retrain metrics once for PS calculation (optimization)
        retrain_metrics_cache = None
        if True:  # Will be used if enable_epoch_metrics and use_full_dataset are True
            try:
                from app.utils.attack_full_dataset import calculate_model_metrics
                from app.models import get_resnet18
                import os
                
                retrain_model_path = f"unlearned_models/{self.request.forget_class}/a00{self.request.forget_class}.pth"
                if os.path.exists(retrain_model_path):
                    print("Pre-calculating retrain metrics for PS optimization...")
                    retrain_model = get_resnet18().to(self.device)
                    retrain_model.load_state_dict(torch.load(retrain_model_path, map_location=self.device))
                    retrain_model.eval()
                    
                    retrain_metrics_cache = await calculate_model_metrics(
                        retrain_model, self.train_loader, self.device, self.request.forget_class, 2.0, 1.0
                    )
                    print(f"Retrain metrics cached: {len(retrain_metrics_cache['entropies'])} samples")
                    
                    # Free memory
                    del retrain_model
                    torch.cuda.empty_cache() if self.device.type == 'cuda' else None
                else:
                    print(f"Warning: Retrain model not found at {retrain_model_path}")
            except Exception as e:
                print(f"Error pre-calculating retrain metrics: {e}")
                retrain_metrics_cache = None
        
        dataset = self.train_set if UMAP_DATASET == 'train' else self.test_set
        targets = torch.tensor(dataset.targets)
        class_indices = [(targets == i).nonzero().squeeze() for i in range(self.num_classes)]
        
        samples_per_class = UMAP_DATA_SIZE // self.num_classes
        generator = torch.Generator()
        generator.manual_seed(UNLEARN_SEED)
        selected_indices = []
        for indices in class_indices:
            perm = torch.randperm(len(indices), generator=generator)
            selected_indices.extend(indices[perm[:samples_per_class]].tolist())
        
        umap_subset = torch.utils.data.Subset(dataset, selected_indices)
        umap_subset_loader = torch.utils.data.DataLoader(
            umap_subset, batch_size=UMAP_DATA_SIZE, shuffle=False
        )

        start_time = time.time()
        for epoch in range(self.request.epochs):
            self.model.train()
            self.status.current_epoch = epoch + 1
            running_loss = 0.0
            total = 0
            correct = 0
            
            for i, (inputs, labels) in enumerate(self.retain_loader):
                if self.stopped():
                    self.status.is_unlearning = False
                    print("\nTraining cancelled mid-batch.")
                    return

                inputs, labels = inputs.to(self.device), labels.to(self.device)
                self.optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = self.criterion(outputs, labels)
                loss.backward()

                self.optimizer.step()
                running_loss += loss.item()

                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()

            # Evaluate on forget loader after each epoch
            self.model.eval()
            forget_running_loss = 0.0
            forget_correct = 0
            forget_total = 0
            
            with torch.no_grad():
                for inputs, labels in self.forget_loader:
                    inputs, labels = inputs.to(self.device), labels.to(self.device)
                    outputs = self.model(inputs)
                    loss = self.criterion(outputs, labels)
                    forget_running_loss += loss.item()

                    _, predicted = torch.max(outputs.data, 1)
                    forget_total += labels.size(0)
                    forget_correct += (predicted == labels).sum().item()

            forget_epoch_loss = forget_running_loss / len(self.forget_loader)
            forget_epoch_acc = forget_correct / forget_total

            # Status update with forget set metrics
            elapsed_time = time.time() - start_time
            estimated_total_time = elapsed_time / (epoch + 1) * self.request.epochs
            
            self.status.current_unlearn_loss = forget_epoch_loss
            self.status.current_unlearn_accuracy = forget_epoch_acc
            self.status.estimated_time_remaining = max(0, estimated_total_time - elapsed_time)

            # Collect epoch-wise metrics (every epoch)
            enable_epoch_metrics = False  # Set to False to disable epoch-wise metrics collection
            
            if enable_epoch_metrics:
                print(f"Collecting metrics for epoch {epoch + 1}...")
                
                # Evaluate on full train and test sets
                train_loss, _, train_class_accuracies = await evaluate_model(
                    self.model, self.train_loader, self.criterion, self.device
                )
                test_loss, _, test_class_accuracies = await evaluate_model(
                    self.model, self.test_loader, self.criterion, self.device
                )
                
                # Calculate metrics
                ua = train_class_accuracies[self.request.forget_class]  # Unlearn Accuracy
                ta = sum(train_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes)  # Train Accuracy
                tua = test_class_accuracies[self.request.forget_class]  # Test Unlearn Accuracy
                tra = sum(test_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes)  # Test Remaining Accuracy
                
                # Calculate Privacy Score 
                # Option 1: Use subset for faster epoch-wise calculation (current)
                # Option 2: Use full dataset for accurate calculation (slow)
                use_full_dataset = True  # Set to True for full dataset PS
                
                try:
                    if use_full_dataset and retrain_metrics_cache is not None:
                        # Use optimized PS calculation with cached retrain metrics
                        epoch_ps = await calculate_ps_with_cached_retrain(
                            unlearn_model=self.model, 
                            data_loader=self.train_loader, 
                            device=self.device, 
                            forget_class=self.request.forget_class,
                            retrain_metrics_cache=retrain_metrics_cache
                        )
                    elif use_full_dataset:
                        # Fallback to original full dataset calculation (slow)
                        _, _, epoch_ps = await process_attack_metrics_full_dataset(
                            unlearn_model=self.model, 
                            data_loader=self.train_loader, 
                            device=self.device, 
                            forget_class=self.request.forget_class,
                            retrain_model_path=f"unlearned_models/{self.request.forget_class}/a00{self.request.forget_class}.pth"
                        )
                    else:
                        # Use subset for efficiency (original approach)
                        _, _, epoch_ps = await process_attack_metrics(
                            model=self.model, 
                            data_loader=umap_subset_loader, 
                            device=self.device, 
                            forget_class=self.request.forget_class
                        )
                    ps = epoch_ps  # Privacy Score from attack metrics
                except Exception as e:
                    print(f"Error calculating PS for epoch {epoch + 1}: {e}")
                    ps = 0.5  # Default value if calculation fails
                
                # Store metrics
                epoch_metrics['UA'].append(ua)
                epoch_metrics['TA'].append(ta)
                epoch_metrics['TUA'].append(tua)
                epoch_metrics['TRA'].append(tra)
                epoch_metrics['PS'].append(ps)

            # Get current learning rate
            current_lr = self.optimizer.param_groups[0]['lr']
            
            print(f"\nEpoch [{epoch+1}/{self.request.epochs}]")
            print(f"Learning Rate: {current_lr:.6f}")
            print(f"Forget Loss: {forget_epoch_loss:.4f}, Forget Accuracy: {forget_epoch_acc:.3f}")
            
            # Show metrics if collected this epoch
            if len(epoch_metrics['UA']) > 0:
                latest_ua = epoch_metrics['UA'][-1]
                latest_ta = epoch_metrics['TA'][-1]
                latest_tua = epoch_metrics['TUA'][-1]
                latest_tra = epoch_metrics['TRA'][-1]
                latest_ps = epoch_metrics['PS'][-1]
                
                print(f"Metrics - UA: {latest_ua:.3f}, TA: {latest_ta:.3f}, TUA: {latest_tua:.3f}, TRA: {latest_tra:.3f}, PS: {latest_ps:.3f}")
            
            print(f"ETA: {self.status.estimated_time_remaining:.2f}s")
            
            # Update learning rate scheduler
            self.scheduler.step()

        rte = time.time() - start_time
        

        if self.stopped():
            self.status.is_unlearning = False
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
            device=self.device,
            # forget_class=self.request.forget_class
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
            device=self.device,
            # forget_class=self.request.forget_class   
        )

        # Update test evaluation status for remain classes only
        self.status.p_test_loss = test_loss
        remain_test_accuracy = sum(test_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes)
        self.status.p_test_accuracy = remain_test_accuracy

        print("Test Class Accuracies:")
        for i, acc in test_class_accuracies.items():
            print(f"  Class {i}: {acc:.3f}")
        print(f"Test set evaluation finished at {time.time() - start_time:.3f} seconds")

        if self.stopped():
            self.status.is_unlearning = False
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
        print(f"UMAP embedding computed at {time.time() - start_time:.3f} seconds")

        # Process attack metrics using the same umap_subset_loader (no visualization here)
        print("Processing attack metrics on UMAP subset")
        values, attack_results, fqs = await process_attack_metrics(
            model=self.model, 
            data_loader=umap_subset_loader, 
            device=self.device, 
            forget_class=self.request.forget_class
        )
        # CKA similarity calculation
        self.status.progress = "Calculating CKA Similarity"
        print("Calculating CKA similarity")
        cka_results = await calculate_cka_similarity(
            model_before=self.model_before,
            model_after=self.model,
            forget_class=self.request.forget_class,
            device=self.device,
            batch_size=self.request.batch_size
        )
        print(f"CKA similarity calculated at {time.time() - start_time:.3f} seconds")

        # Prepare detailed results
        detailed_results = []
        for i in range(len(umap_subset)):
            original_index = selected_indices[i]
            ground_truth = umap_subset.dataset.targets[original_index]
            is_forget = (ground_truth == self.request.forget_class)
            detailed_results.append([
                int(ground_truth),                             # gt
                int(predicted_labels[i]),                      # pred
                int(original_index),                           # img
                1 if is_forget else 0,                         # forget as binary
                round(float(umap_embedding[i][0]), 2),         # x coordinate
                round(float(umap_embedding[i][1]), 2),         # y coordinate
                compress_prob_array(probs[i].tolist()),        # compressed probabilities
            ])

        test_unlearn_accuracy = test_class_accuracies[self.request.forget_class]
        test_remain_accuracy = round(
           sum(test_class_accuracies[i] for i in self.remain_classes) / 9.0, 3
        )

        # Prepare results dictionary
        results = {
            "CreatedAt": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            "ID": self.status.recent_id,
            "FC": self.request.forget_class,
            "Type": "Unlearned",
            "Base": os.path.basename(self.base_weights_path).replace('.pth', ''),
            "Method": "FineTuning",
            "Epoch": self.request.epochs,
            "BS": self.request.batch_size,
            "LR": self.request.learning_rate,
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
        }

        # Generate epoch-wise plots if we have collected metrics
        if epoch_metrics['UA']:  # Check if we have any metrics collected
            print("Generating epoch-wise plots...")
            try:
                plot_path = plot_epoch_metrics(
                    epoch_metrics=epoch_metrics,
                    method="FT",
                    forget_class=self.request.forget_class,
                    experiment_id=self.status.recent_id
                )
                results["epoch_plot_path"] = plot_path
            except Exception as e:
                print(f"Error generating epoch plot: {e}")

        # Add epoch metrics to results
        results["epoch_metrics"] = epoch_metrics

        # Save results to JSON file
        os.makedirs('data', exist_ok=True)
        forget_class_dir = os.path.join('data', str(self.request.forget_class))
        os.makedirs(forget_class_dir, exist_ok=True)

        result_path = os.path.join(forget_class_dir, f'{results["ID"]}.json')  
        with open(result_path, 'w') as f:
            json.dump(results, f, indent=2)

        save_model(
            model=self.model, 
            forget_class=self.request.forget_class,
            model_name=self.status.recent_id,
        )
        print(f"Results saved to {result_path}")
        print("FT Unlearning inference completed!")
        self.status.progress = "Completed"