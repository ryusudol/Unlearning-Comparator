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
    get_layer_activations_and_predictions
)
from app.utils.visualization import compute_umap_embedding
from app.config.settings import (
	UMAP_DATA_SIZE, 
	UMAP_DATASET,
	UNLEARN_SEED
)


class UnlearningRLThread(threading.Thread):
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
        retain_loader
    ):
        threading.Thread.__init__(self)
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
            self.loop.run_until_complete(self.unlearn_RL_model())
        except Exception as e:
            self.exception = e
        finally:
            if self.loop:
                self.loop.close()
        
    async def unlearn_RL_model(self):
        print(f"Starting RL unlearning for class {self.request.forget_class}...")
        self.status.progress = "Unlearning"
        self.status.method = "Random-Labeling"
        self.status.recent_id = uuid.uuid4().hex[:4]
        self.status.total_epochs = self.request.epochs

        # Combine retain_loader and forget_loader
        combined_dataset = torch.utils.data.ConcatDataset([
            self.retain_loader.dataset,
            self.forget_loader.dataset
        ])
        combined_loader = torch.utils.data.DataLoader(
            combined_dataset,
            batch_size=self.request.batch_size,
            shuffle=True
        )

        dataset = self.train_set if UMAP_DATASET == 'train' else self.test_set
        generator = torch.Generator()
        generator.manual_seed(UNLEARN_SEED)
        umap_subset_indices = torch.randperm(len(dataset), generator=generator)[:UMAP_DATA_SIZE]
        umap_subset = torch.utils.data.Subset(dataset, umap_subset_indices)
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
            
            # Training on combined loader
            for i, (inputs, labels) in enumerate(combined_loader):
                if self.stopped():
                    self.status.is_unlearning = False
                    print("\nTraining cancelled mid-batch.")
                    return

                inputs, labels = inputs.to(self.device), labels.to(self.device)
                self.optimizer.zero_grad()
                outputs = self.model(inputs)

                forget_mask = (labels == self.request.forget_class)
                num_forget = forget_mask.sum().item()
                if num_forget > 0:
                    torch.manual_seed(int(time.time_ns()) % (2**32 - 1)) # Set random seed based on current time
                    random_labels = torch.tensor([
                        self.remain_classes[torch.randint(0, len(self.remain_classes), (1,)).item()]
                        for _ in range(num_forget)
                    ], device=self.device)
                    labels[forget_mask] = random_labels

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
            device=self.device,
            forget_class=self.request.forget_class
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
            forget_class=self.request.forget_class
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

        # UMAP embedding computation
        print("Computing UMAP embedding")
        forget_labels = torch.tensor([label == self.request.forget_class for _, label in umap_subset])
        umap_embedding = await compute_umap_embedding(
            activation=activations, 
            labels=predicted_labels, 
            forget_class=self.request.forget_class,
            forget_labels=forget_labels
        )

        # CKA similarity calculation
        self.status.progress = "Calculating CKA Similarity"
        print("Calculating CKA similarity")
        cka_results = await calculate_cka_similarity(
            model_before=self.model_before,
            model_after=self.model,
            train_loader=self.train_loader,
            test_loader=self.test_loader,
            forget_class=self.request.forget_class,
            device=self.device
        )

        # Prepare results
        self.status.progress = "Preparing Results"
        detailed_results = []
        for i in range(len(umap_subset)):
            original_index = umap_subset_indices[i].item()
            ground_truth = umap_subset.dataset.targets[umap_subset_indices[i]]
            is_forget = (ground_truth == self.request.forget_class)
            detailed_results.append([
                int(ground_truth),                             # gt
                int(predicted_labels[i]),                      # pred
                int(original_index),                           # img
                1 if is_forget else 0,                         # forget as binary
                round(float(umap_embedding[i][0]), 3),         # x coordinate
                round(float(umap_embedding[i][1]), 3),         # y coordinate
                compress_prob_array(probs[i].tolist()),                 # compressed probabilities
            ])

        test_unlearn_accuracy = test_class_accuracies[self.request.forget_class]
        test_remain_accuracy = round(
           sum(test_class_accuracies[i] for i in self.remain_classes) / 9.0, 3
        )

        # Save results
        results = {
            "id": self.status.recent_id,
            "fc": self.request.forget_class,
            "phase": "Unlearned",
            "init": f"000{self.request.forget_class}",
            "method": "Random-Labeling",
            "epochs": self.request.epochs,
            "BS": self.request.batch_size,
            "LR": self.request.learning_rate,
            "UA": round(unlearn_accuracy, 3),
            "RA": remain_accuracy,
            "TUA": round(test_unlearn_accuracy, 3),
            "TRA": test_remain_accuracy,
            "RTE": round(rte, 1),
            "accs": [round(v, 3) for v in train_class_accuracies.values()],
            "label_dist": format_distribution(train_label_dist),
            "conf_dist": format_distribution(train_conf_dist),
            "t_accs": [round(v, 3) for v in test_class_accuracies.values()],
            "t_label_dist": format_distribution(test_label_dist),
            "t_conf_dist": format_distribution(test_conf_dist),
            "cka": cka_results["similarity"],
            "points": detailed_results,
        }
        # Create base data directory if it doesn't exist
        os.makedirs('data', exist_ok=True)
        forget_class_dir = os.path.join('data', str(self.request.forget_class))
        os.makedirs(forget_class_dir, exist_ok=True)
        
        result_path = os.path.join(forget_class_dir, f'{results["id"]}.json')
        with open(result_path, 'w') as f:
            json.dump(results, f, indent=2)

        save_model(
            model=self.model, 
            forget_class=self.request.forget_class,
            model_name=self.status.recent_id
        )
        print(f"Results saved to {result_path}")
        print("RL Unlearning inference completed!")
        self.status.progress = "Completed"