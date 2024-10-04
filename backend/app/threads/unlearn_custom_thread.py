import threading
import asyncio
import torch
import torch.nn as nn
import numpy as np
import json
import os
import uuid
from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders
from app.utils.evaluation import evaluate_model, get_layer_activations_and_predictions
from app.utils.visualization import compute_umap_embedding
from app.config.settings import UNLEARN_SEED, UMAP_DATA_SIZE, UMAP_DATASET

class UnlearningInference(threading.Thread):
    def __init__(self, request, status, weights_path):
        threading.Thread.__init__(self)
        self.request = request
        self.status = status
        self.weights_path = weights_path
        self.exception = None
        self.loop = None
        self.model = None
        self._stop_event = threading.Event()

    def stop(self):
        self._stop_event.set()

    def stopped(self):
        return self._stop_event.is_set()

    def run(self):
        try:
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            self.loop.run_until_complete(self.async_run())
        except Exception as e:
            self.exception = e
        finally:
            if self.loop:
                self.loop.close()
        
    async def async_run(self):
        if self.stopped():
            return

        print(f"Starting custom unlearning inference for class {self.request.forget_class}...")
        set_seed(UNLEARN_SEED)
        device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
        train_loader, test_loader, train_set, test_set = get_data_loaders(128)
        self.model = get_resnet18().to(device)
        self.model.load_state_dict(torch.load(self.weights_path, map_location=device))
        criterion = nn.CrossEntropyLoss()

        if self.stopped():
            return

        # Evaluate on train set
        train_loss, train_accuracy, train_class_accuracies = await evaluate_model(self.model, train_loader, criterion, device)
        self.status.current_loss = train_loss
        self.status.current_accuracy = train_accuracy
        self.status.train_class_accuracies = train_class_accuracies
        self.status.unlearn_accuracy = train_class_accuracies[self.request.forget_class]
        remain_classes = [i for i in range(10) if i != self.request.forget_class]
        self.status.remain_accuracy = sum(train_class_accuracies[i] for i in remain_classes) / len(remain_classes)
        self.status.progress = 40

        if self.stopped():
            return

        # Evaluate on test set
        test_loss, test_accuracy, test_class_accuracies = await evaluate_model(self.model, test_loader, criterion, device)
        self.status.test_loss = test_loss
        self.status.test_accuracy = (test_accuracy * 10.0 - test_class_accuracies[self.request.forget_class]) / 9.0
        self.status.test_class_accuracies = test_class_accuracies
        self.status.progress = 80

        print("Train Class Accuracies:")
        for i, acc in self.status.train_class_accuracies.items():
            print(f"  Class {i}: {acc:.3f}")
        print("Test Class Accuracies:")
        for i, acc in self.status.test_class_accuracies.items():
            print(f"  Class {i}: {acc:.3f}")

        if self.stopped():
            return

        # UMAP and activation calculation logic
        if not self.status.cancel_requested and self.model is not None:
            print("Getting data loaders for UMAP")
            dataset = train_set if UMAP_DATASET == 'train' else test_set
            subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
            subset = torch.utils.data.Subset(dataset, subset_indices)
            subset_loader = torch.utils.data.DataLoader(subset, batch_size=UMAP_DATA_SIZE, shuffle=False)
            
            print("Computing layer activations")
            activations, predicted_labels, logits, mean_logits = await get_layer_activations_and_predictions(
                model=self.model,
                data_loader=subset_loader,
                device=device,
                forget_class=self.request.forget_class
            )
            self.status.progress = 90

            print("Computing UMAP embedding")
            forget_labels = torch.tensor([label == self.request.forget_class for _, label in subset])
            umap_embedding, _ = await compute_umap_embedding(
                activations[3], 
                predicted_labels, 
                forget_class=self.request.forget_class,
                forget_labels=forget_labels
            )
            self.status.progress = 100

            print("Custom Unlearning inference and visualization completed!")

            # Prepare detailed results
            print(f"""
                len(subset): {len(subset)}, len(subset_indices): {len(subset_indices)},
                len(predicted_labels): {len(predicted_labels)}, len(activations[3]): {len(activations[3])},
                len(logits): {len(logits)}, len(umap_embedding): {len(umap_embedding)}
                """)
            detailed_results = []
            for i in range(len(subset)):
                ground_truth = subset.dataset.targets[subset_indices[i]]
                is_forget = ground_truth == self.request.forget_class
                detailed_results.append({
                    "index": i,
                    "ground_truth": int(ground_truth),
                    "predicted_class": int(predicted_labels[i]),
                    "is_forget": bool(is_forget),
                    # "activations": activations[3][i].tolist(),  # Last layer activations
                    "umap_embedding": umap_embedding[i].tolist(),
                    "logit": logits[i].tolist(),
                })
            
            # Prepare results dictionary
            results = {
                "id": uuid.uuid4().hex[:4],
                "forget_class": self.request.forget_class,
                "model": "ResNet18",
                "dataset": "CIFAR-10",
                "training": "None",
                "unlearning": {
                    "method": "Retrain",
                    "epochs": 30,
                    "batch_size": 128,
                    "learning_rate": 0.01,
                },
                "defense": "None",
                "unlearn_accuracy": f"{self.status.unlearn_accuracy:.3f}",
                "remain_accuracy": f"{self.status.remain_accuracy:.3f}",
                "test_accuracy": f"{self.status.test_accuracy:.3f}",
                "RTE": 1480.0,
                "train_class_accuracies": {str(k): f"{v:.3f}" for k, v in train_class_accuracies.items()},
                "test_class_accuracies": {str(k): f"{v:.3f}" for k, v in test_class_accuracies.items()},
                "mean_logits": float(mean_logits) if mean_logits is not None else None,
                "detailed_results": detailed_results
            }

            # Save results to JSON file
            os.makedirs('data', exist_ok=True)
            with open(f'data/{results["id"]}.json', 'w') as f:
                json.dump(results, f, indent=2)

            print(f"Results saved to data/{results['id']}.json")
        else:
            print("Custom Unlearning cancelled or model not available.")

        print("Custom Unlearning inference completed!")