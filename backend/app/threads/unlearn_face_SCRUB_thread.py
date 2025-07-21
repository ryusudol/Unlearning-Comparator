import threading
import asyncio
import torch
import torch.nn.functional as F
import time
import os
import uuid
import json
from app.utils.helpers import (
	save_model,
    format_distribution,
    compress_prob_array
)
from app.models import get_facenet_model
from app.utils.evaluation import (
    calculate_cka_similarity_face,
    evaluate_model_with_distributions,
    get_layer_activations_and_predictions_face
)
from app.utils.attack import process_face_attack_metrics
from app.utils.visualization import compute_umap_embedding_face
from app.config import (
	UMAP_DATA_SIZE, 
	UMAP_DATASET,
	UNLEARN_SEED
)


class UnlearningFaceSCRUBThread(threading.Thread):
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
        threading.Thread.__init__(self)
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

        self.exception = None
        self.loop = None
        self._stop_event = threading.Event()

    def stop(self):
        self._stop_event.set()

    def stopped(self):
        return self._stop_event.is_set()

    def _create_teacher_model(self):
        """Create teacher model for knowledge distillation"""
        teacher_model = get_facenet_model(self.device, pretrained=False)
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

    def run(self):
        try:
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            self.loop.run_until_complete(self.unlearn_SCRUB_model())
        except Exception as e:
            self.exception = e
        finally:
            if self.loop:
                self.loop.close()
        
    async def unlearn_SCRUB_model(self):
        print(f"Starting SCRUB unlearning for class {self.request.forget_class}...")
        self.status.progress = "Unlearning"
        self.status.method = "SCRUB"
        self.status.recent_id = uuid.uuid4().hex[:4]
        self.status.total_epochs = self.request.epochs

        # Set up UMAP subset
        dataset = self.train_set if UMAP_DATASET == 'train' else self.test_set
        targets = torch.tensor([sample[1] for sample in dataset.samples])
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
        
        # Compute Fisher Information Matrix for important parameters
        print("Computing Fisher Information Matrix...")
        self.status.progress = "Computing Fisher Information"
        fisher_dict = self._compute_fisher_information(self.retain_loader, num_samples=1000)

        # Start timing after all preprocessing  
        start_time = time.time()

        for epoch in range(self.request.epochs):
            self.model.train()
            self.status.current_epoch = epoch + 1
            running_loss = 0.0
            total = 0
            correct = 0
            
            # SCRUB training: Two-phase approach
            # Phase 1: Maximize loss on forget set (first few epochs)
            if epoch < self.msteps:
                print(f"Epoch {epoch + 1}: Maximizing loss on forget set")
                for i, (inputs, labels) in enumerate(self.forget_loader):
                    if self.stopped():
                        self.status.is_unlearning = False
                        print("\nTraining cancelled mid-batch.")
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
            print(f"Epoch {epoch + 1}: Minimizing loss on retain set")
            for i, (inputs, labels) in enumerate(self.retain_loader):
                if self.stopped():
                    self.status.is_unlearning = False
                    print("\nTraining cancelled mid-batch.")
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

            # Evaluate on forget set after each epoch
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

            print(f"\nEpoch [{epoch+1}/{self.request.epochs}]")
            print(f"Unlearning Loss: {forget_epoch_loss:.4f}, Unlearning Accuracy: {forget_epoch_acc:.3f}")
            print(f"ETA: {self.status.estimated_time_remaining:.2f}s")

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
        ) = await get_layer_activations_and_predictions_face(
            model=self.model,
            data_loader=umap_subset_loader,
            device=self.device,
        )

        # UMAP embedding computation
        print("Computing UMAP embedding")
        forget_labels = torch.tensor([label == self.request.forget_class for _, label in umap_subset])
        umap_embedding = await compute_umap_embedding_face(
            activation=activations, 
            labels=predicted_labels, 
            forget_class=self.request.forget_class,
            forget_labels=forget_labels
        )
        
        # Process attack metrics using the same umap_subset_loader
        print("Processing attack metrics on UMAP subset")
        values, attack_results, fqs = await process_face_attack_metrics(
            model=self.model, 
            data_loader=umap_subset_loader, 
            device=self.device, 
            forget_class=self.request.forget_class
        )

        # CKA similarity calculation
        self.status.progress = "Calculating CKA Similarity"
        print("Calculating CKA similarity")
        cka_results = await calculate_cka_similarity_face(
            model_before=self.model_before,
            model_after=self.model,
            forget_class=self.request.forget_class,
            device=self.device,
        )
        
        # Prepare detailed results
        detailed_results = []
        for i in range(len(umap_subset)):
            original_index = selected_indices[i]
            ground_truth = umap_subset.dataset.samples[original_index][1]
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
            "Method": "SCRUB",
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
            "cka": cka_results["similarity"],
            "points": detailed_results,
            "attack": {
                "values": values,
                "results": attack_results
            }
        }

        # Save results to JSON file
        os.makedirs('data', exist_ok=True)
        forget_class_dir = os.path.join('data/face', str(self.request.forget_class))
        os.makedirs(forget_class_dir, exist_ok=True)

        result_path = os.path.join(forget_class_dir, f'{results["ID"]}.json')  
        with open(result_path, 'w') as f:
            json.dump(results, f, indent=2)

        save_model(
            model=self.model, 
            forget_class=self.request.forget_class,
            model_name=self.status.recent_id,
            dataset_mode="face",
        )
        print(f"Results saved to {result_path}")
        print("SCRUB Unlearning inference completed!")
        self.status.progress = "Completed"