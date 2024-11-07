import threading
import asyncio
import torch
import time
import os
import uuid
import json
from app.utils.helpers import save_model,format_distribution
from app.utils.evaluation import (
    calculate_cka_similarity,
    evaluate_model_with_distributions,
    get_layer_activations_and_predictions
)
from app.utils.visualization import compute_umap_embedding
from app.config.settings import (
	UMAP_DATA_SIZE, 
	UMAP_DATASET
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
        status
    ):
        threading.Thread.__init__(self)
        self.model_before = model_before
        self.model = model_after
        self.device = device
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
        
        start_time = time.time()

        for epoch in range(self.request.epochs):
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
            forget_epoch_acc = 100 * forget_correct / forget_total
            self.model.train()

            # Status update with forget set metrics
            elapsed_time = time.time() - start_time
            estimated_total_time = elapsed_time / (epoch + 1) * self.request.epochs
            self.status.current_epoch = epoch + 1
            self.status.total_epochs = self.request.epochs
            self.status.current_unlearn_loss = forget_epoch_loss
            self.status.current_unlearn_accuracy = forget_epoch_acc
            self.status.estimated_time_remaining = max(0, estimated_total_time - elapsed_time)
            print(f"\nEpoch [{epoch+1}/{self.request.epochs}]")
            print(f"Forget Loss: {forget_epoch_loss:.4f}, Forget Accuracy: {forget_epoch_acc:.2f}%")
            print(f"ETA: {self.status.estimated_time_remaining:.2f}s")

        rte = time.time() - start_time
        save_model(model=self.model, epochs=epoch + 1, learning_rate=self.request.learning_rate)

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

        print("Test Class Accuracies:")
        for i, acc in test_class_accuracies.items():
            print(f"  Class {i}: {acc:.3f}")
        print(f"Test set evaluation finished at {time.time() - start_time:.3f} seconds")

        if self.stopped():
            self.status.is_unlearning = False
            return

        # UMAP and activation calculation
        self.status.progress = "Computing UMAP"
        dataset = self.train_set if UMAP_DATASET == 'train' else self.test_set
        umap_subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
        umap_subset = torch.utils.data.Subset(dataset, umap_subset_indices)
        umap_subset_loader = torch.utils.data.DataLoader(
            umap_subset, batch_size=UMAP_DATA_SIZE, shuffle=False
        )
        
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
        print(f"CKA similarity calculated at {time.time() - start_time:.3f} seconds")

        # Prepare detailed results
        self.status.progress = "Preparing Results"
        detailed_results = []
        for i in range(len(umap_subset)):
            original_index = umap_subset_indices[i].item()
            ground_truth = umap_subset.dataset.targets[umap_subset_indices[i]]
            is_forget = ground_truth == self.request.forget_class
            detailed_results.append({
                "index": i,
                "ground_truth": int(ground_truth),
                "original_index": int(original_index),
                "predicted_class": int(predicted_labels[i]),
                "is_forget": bool(is_forget),
                "umap_embedding": [round(float(coord), 3) for coord in umap_embedding[i]],
                "prob": [round(float(l), 3) for l in probs[i]],
            })

        test_unlearn_accuracy = test_class_accuracies[self.request.forget_class]
        test_remain_accuracy = round(
           sum(test_class_accuracies[i] for i in self.remain_classes) / 9.0, 3
        )

        # Prepare results dictionary
        results = {
            "id": uuid.uuid4().hex[:4],
            "forget_class": self.request.forget_class,
            "phase": "Unlearned",
            "init_id": "0000",
            "method": "Fine-Tuning",
            "epochs": self.request.epochs,
            "batch_size": self.request.batch_size,
            "learning_rate": self.request.learning_rate,
            "unlearn_accuracy": round(unlearn_accuracy, 3),
            "remain_accuracy": remain_accuracy,
            "test_unlearn_accuracy": round(test_unlearn_accuracy, 3),
            "test_remain_accuracy": test_remain_accuracy,
            "RTE": round(rte, 1),
            "train_class_accuracies": {
                k: round(v, 3) for k, v in train_class_accuracies.items()
            },
            "test_class_accuracies": {
                k: round(v, 3) for k, v in test_class_accuracies.items()
            },
            "train_label_distribution": format_distribution(train_label_dist),
            "train_confidence_distribution": format_distribution(train_conf_dist),
            "test_label_distribution": format_distribution(test_label_dist),
            "test_confidence_distribution": format_distribution(test_conf_dist),
            "similarity": cka_results["similarity"],
            "detailed_results": detailed_results,
        }

        # Save results to JSON file
        os.makedirs('data', exist_ok=True)
        with open(f'data/{results["id"]}.json', 'w') as f:
            json.dump(results, f, indent=2)

        print(f"Results saved to data/{results['id']}.json")
        print("FT Unlearning inference completed!")
        self.status.progress = "Completed"