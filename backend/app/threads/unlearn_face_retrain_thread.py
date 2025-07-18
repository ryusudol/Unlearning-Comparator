import threading
import asyncio
import time
import sys
import os
import json
import torch
import uuid
from app.utils.helpers import save_model, format_distribution, compress_prob_array
from app.utils.evaluation import (
    evaluate_model_with_distributions,
    get_layer_activations_and_predictions_face,
    calculate_cka_similarity_face
)
from app.utils.attack import process_face_attack_metrics
from app.utils.visualization import compute_umap_embedding_face
from app.config import (
    UMAP_DATA_SIZE, 
    UMAP_DATASET,
    UNLEARN_SEED
)

class UnlearningFaceRetrainThread(threading.Thread):
    def __init__(
        self,
        model,
        unlearning_loader,
        full_train_loader,
        test_loader,
        train_set,
        test_set,
        criterion,
        optimizer,
        scheduler,
        device,
        epochs,
        status,
        model_name,
        dataset_name,
        learning_rate,
        forget_class
    ):
        threading.Thread.__init__(self)
        self.model = model
        self.unlearning_loader = unlearning_loader
        self.full_train_loader = full_train_loader
        self.test_loader = test_loader
        self.train_set = train_set
        self.test_set = test_set
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device
        self.epochs = epochs
        self.status = status
        self.model_name = model_name
        self.dataset_name = dataset_name
        self.learning_rate = learning_rate
        self.forget_class = forget_class
        self.exception = None
        self.loop = None
        self._stop_event = threading.Event()
        self.num_classes = 10
        self.remain_classes = [i for i in range(self.num_classes) if i != self.forget_class]

    def stop(self):
        self._stop_event.set()

    def stopped(self):
        return self._stop_event.is_set()

    def run(self):
        try:
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            self.loop.run_until_complete(self.unlearn_retrain_model())
        except Exception as e:
            self.exception = e
        finally:
            if self.loop:
                self.loop.close()

    async def unlearn_retrain_model(self):
        self.status.start_time = time.time()
        self.status.total_epochs = self.epochs
        self.status.method = "Retraining"
        self.status.recent_id = f"a00{self.forget_class}"
        
        best_test_acc = 0.0
        best_epoch = 0
        training_time = 0
        start_time = time.time()
        
        print(f"Starting face retraining excluding class {self.forget_class}...")
        
        for epoch in range(self.epochs):
            epoch_start_time = time.time()
            
            self.model.train()
            running_loss = 0.0
            correct = 0
            total = 0
            class_correct = [0] * 10
            class_total = [0] * 10

            # Training with unlearning_loader (excluding forget class)
            for i, (inputs, labels) in enumerate(self.unlearning_loader):
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
                _, predicted = outputs.max(1)
                total += labels.size(0)
                correct += predicted.eq(labels).sum().item()
                
                c = (predicted == labels).squeeze()
                for j in range(labels.size(0)):
                    label = labels[j]
                    class_correct[label] += c[j].item()
                    class_total[label] += 1
            
            self.scheduler.step()
            train_loss = running_loss / len(self.unlearning_loader)
            train_accuracy = correct / total
            train_class_accuracies = {
                i: (class_correct[i] / class_total[i] 
                    if class_total[i] > 0 else 0) 
                for i in range(10)
            }
            
            epoch_training_time = time.time() - epoch_start_time
            training_time += epoch_training_time
            
            # Evaluate on test set
            (
                test_loss, 
                test_accuracy, 
                test_class_accuracies, 
                test_label_dist, 
                test_conf_dist
            ) = await evaluate_model_with_distributions(
                self.model, 
                self.test_loader, 
                self.criterion, 
                self.device
            )
            
            if test_accuracy > best_test_acc:
                best_test_acc = test_accuracy
                best_epoch = epoch + 1
            
            # Update status
            self.status.current_epoch = epoch + 1
            self.status.current_loss = train_loss
            self.status.current_accuracy = train_accuracy
            self.status.test_loss = test_loss
            self.status.test_accuracy = test_accuracy
            self.status.train_class_accuracies = train_class_accuracies
            self.status.test_class_accuracies = test_class_accuracies
            
            if train_loss < self.status.best_loss:
                self.status.best_loss = train_loss
            if train_accuracy > self.status.best_accuracy:
                self.status.best_accuracy = train_accuracy
            if test_accuracy > self.status.best_test_accuracy:
                self.status.best_test_accuracy = test_accuracy
            
            # Update estimated time
            estimated_total_time = training_time / (epoch + 1) * self.epochs
            self.status.estimated_time_remaining = max(
                0, estimated_total_time - training_time
            )
            
            current_lr = self.optimizer.param_groups[0]['lr']

            # Print training progress
            print(f"\nEpoch [{epoch+1}/{self.epochs}]")
            print(f"Training - Loss: {train_loss:.4f}, Accuracy: {train_accuracy:.4f}")
            print(f"Test - Loss: {test_loss:.4f}, Accuracy: {test_accuracy:.4f}")
            print(f"Learning Rate: {current_lr:.5f}")
            print(f"Best Model: Epoch {best_epoch} (Test Acc: {best_test_acc:.4f})")
            
            print("\nPer-Class Accuracies:")
            print("Class |  Train  |  Test")
            print("-" * 30)
            for i in range(10):
                print(f"  {i}   | {train_class_accuracies[i]:6.4f} | {test_class_accuracies[i]:6.4f}")
            
            print(f"ETA: {self.status.estimated_time_remaining:.1f}s")
            sys.stdout.flush()
        
        rte = time.time() - start_time
        print(f"\nTotal retrain time: {rte:.1f} seconds ({rte/60:.1f} minutes)")
        
        if self.stopped():
            self.status.is_unlearning = False
            return

        # Final evaluation on full train set
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
            data_loader=self.full_train_loader,
            criterion=self.criterion, 
            device=self.device
        )
        
        print("Train Class Accuracies:")
        for i, acc in train_class_accuracies.items():
            print(f"  Class {i}: {acc:.3f}")
        print(f"Train set evaluation finished at {time.time() - start_time:.3f} seconds")

        if self.stopped():
            return

        # UMAP computation for visualization
        self.status.progress = "Computing UMAP"
        
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
        print(f"Layer activations computed at {time.time() - start_time:.3f} seconds")

        # UMAP embedding computation
        print("Computing UMAP embedding")
        forget_labels = torch.tensor([label == self.forget_class for _, label in umap_subset])
        umap_embedding = await compute_umap_embedding_face(
            activation=activations, 
            labels=predicted_labels, 
            forget_class=self.forget_class,
            forget_labels=forget_labels
        )
        print(f"UMAP embedding computed at {time.time() - start_time:.3f} seconds")

        # Generate attack metrics - this is the key part for baseline data
        print("Processing attack metrics on UMAP subset")
        values, attack_results, fqs = await process_face_attack_metrics(
            model=self.model, 
            data_loader=umap_subset_loader, 
            device=self.device, 
            forget_class=self.forget_class
        )
        print(f"Attack metrics computed at {time.time() - start_time:.3f} seconds")

        # Prepare detailed results
        detailed_results = []
        for i in range(len(umap_subset)):
            original_index = selected_indices[i]
            ground_truth = umap_subset.dataset.targets[original_index]
            is_forget = (ground_truth == self.forget_class)
            detailed_results.append([
                int(ground_truth),                             # gt
                int(predicted_labels[i]),                      # pred
                int(original_index),                           # img
                1 if is_forget else 0,                         # forget as binary
                round(float(umap_embedding[i][0]), 2),         # x coordinate
                round(float(umap_embedding[i][1]), 2),         # y coordinate
                compress_prob_array(probs[i].tolist()),        # compressed probabilities
            ])

        # Calculate metrics
        unlearn_accuracy = train_class_accuracies[self.forget_class]
        remain_accuracy = round(
            sum(train_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes), 3
        )
        test_unlearn_accuracy = test_class_accuracies[self.forget_class]
        test_remain_accuracy = round(
           sum(test_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes), 3
        )

        # Prepare results dictionary
        results = {
            "CreatedAt": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            "ID": self.status.recent_id,
            "FC": self.forget_class,
            "Type": "Retrained",
            "Base": "N/A",
            "Method": "N/A",
            "Epoch": self.epochs,
            "BS": self.unlearning_loader.batch_size,
            "LR": self.learning_rate,
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
            "cka": {"similarity": [1.0] * 10},  # Perfect similarity with itself
            "points": detailed_results,
            "attack": {
                "values": values,
                "results": attack_results
            }
        }

        # Save results to JSON file
        os.makedirs('data', exist_ok=True)
        forget_class_dir = os.path.join('data/face', str(self.forget_class))
        os.makedirs(forget_class_dir, exist_ok=True)

        result_path = os.path.join(forget_class_dir, f'{results["ID"]}.json')  
        with open(result_path, 'w') as f:
            json.dump(results, f, indent=2)

        # Save the model
        save_model(
            model=self.model, 
            forget_class=self.forget_class,
            model_name=self.status.recent_id,
            dataset_mode="face",
        )
        
        print(f"Results saved to {result_path}")
        print("Face Retraining completed!")
        self.status.progress = "Completed"