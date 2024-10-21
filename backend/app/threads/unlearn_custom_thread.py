import threading
import asyncio
import torch
import torch.nn as nn

import json
import os
import uuid
from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders
from app.utils.evaluation import (
	evaluate_model, 
	evaluate_model_with_distributions, 
	get_layer_activations_and_predictions, 
	calculate_cka_similarity
)
from app.utils.visualization import compute_umap_embedding
from app.config.settings import UNLEARN_SEED, UMAP_DATA_SIZE, UMAP_DATASET

class UnlearningInference(threading.Thread):
    def __init__(self, request, status, weights_path_before, weights_path_after):
        threading.Thread.__init__(self)
        self.request = request
        self.status = status
        self.weights_path_before = weights_path_before
        self.weights_path_after = weights_path_after
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
        
    def print_distribution(self, distribution):
        for i in range(10):
            print(f"  Class {i}:")
            for j in range(10):
                print(f"    Predicted as {j}: {distribution[i][j]:.3f}")

    def format_distribution(self, distribution):
        return {
            f"gt_{i}": {
                f"pred_{j}": round(float(distribution[i][j]), 3) for j in range(10)
            }
            for i in range(10)
        }
    
    async def async_run(self):
        if self.stopped():
            return

        print(f"Starting custom unlearning inference for class {self.request.forget_class}...")
        set_seed(UNLEARN_SEED)
        device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
        train_loader, test_loader, train_set, test_set = get_data_loaders(256)
        self.model_before = get_resnet18().to(device)
        self.model_before.load_state_dict(torch.load(self.weights_path_before, map_location=device))
        self.model_after = get_resnet18().to(device)
        self.model_after.load_state_dict(torch.load(self.weights_path_after, map_location=device))
        criterion = nn.CrossEntropyLoss()

        if self.stopped():
            return

        # Evaluate on train set
        (
            train_loss, 
            train_accuracy, 
            train_class_accuracies, 
            train_label_dist, 
            train_conf_dist
        ) = await evaluate_model_with_distributions (
            self.model_after, 
            train_loader, 
            criterion, 
            device
        )
        
        self.status.current_loss = train_loss
        self.status.current_accuracy = train_accuracy
        self.status.train_class_accuracies = train_class_accuracies
        self.status.unlearn_accuracy = train_class_accuracies[self.request.forget_class]
        remain_classes = [i for i in range(10) if i != self.request.forget_class]
        self.status.remain_accuracy = round(sum(train_class_accuracies[i] for i in remain_classes) / len(remain_classes), 3)
        self.status.progress = 40

        print("Train Label Distribution:")
        self.print_distribution(train_label_dist)
        print("Train Confidence Distribution:")
        self.print_distribution(train_conf_dist)

        if self.stopped():
            return

        # Evaluate on test set
        (
            test_loss, 
            test_accuracy, 
            test_class_accuracies, 
            test_label_dist, 
            test_conf_dist
        ) = await evaluate_model_with_distributions(
            self.model_after, 
            test_loader, 
            criterion, 
            device
        )
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

        print("Test Label Distribution:")
        self.print_distribution(test_label_dist)
        print("Test Confidence Distribution:")
        self.print_distribution(test_conf_dist)

        if self.stopped():
            return

        # UMAP and activation calculation logic
        if not self.status.cancel_requested and self.model_after is not None:
            print("Getting data loaders for UMAP")
            dataset = train_set if UMAP_DATASET == 'train' else test_set
            subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
            subset = torch.utils.data.Subset(dataset, subset_indices)
            subset_loader = torch.utils.data.DataLoader(subset, batch_size=UMAP_DATA_SIZE, shuffle=False)
            
            print("Computing layer activations")
            activations, predicted_labels, logits, mean_logits = await get_layer_activations_and_predictions(
                model=self.model_after,
                data_loader=subset_loader,
                device=device,
                forget_class=self.request.forget_class
            )
            self.status.progress = 90

            print("Computing UMAP embedding")
            forget_labels = torch.tensor([label == self.request.forget_class for _, label in subset])
            umap_embedding, _ = await compute_umap_embedding(
                activations, 
                predicted_labels, 
                forget_class=self.request.forget_class,
                forget_labels=forget_labels
            )
            self.status.progress = 100

            print("Custom Unlearning inference and visualization completed!")

            detailed_results = []
            for i in range(len(subset)):
                original_index = subset_indices[i].item()
                ground_truth = subset.dataset.targets[subset_indices[i]]
                is_forget = ground_truth == self.request.forget_class
                detailed_results.append({
                    "index": i,
                    "ground_truth": int(ground_truth),
                    "original_index": int(original_index),
                    "predicted_class": int(predicted_labels[i]),
                    "is_forget": bool(is_forget),
                    "umap_embedding": [round(float(coord), 3) for coord in umap_embedding[i]],
                    "logit": [round(float(l), 3) for l in logits[i]],
                })
            
            test_unlearn_accuracy = test_class_accuracies[self.request.forget_class]
            test_remain_accuracy = round(sum(test_class_accuracies[i] for i in remain_classes) / len(remain_classes), 3)
            

            print("Calculating CKA similarity")
            cka_results = await calculate_cka_similarity(
                model_before=self.model_before,
                model_after=self.model_after,
                train_loader=train_loader,
                test_loader=test_loader,
                forget_class=self.request.forget_class,
                device=device
            )
            self.status.progress = 95

            # Prepare results dictionary
            results = {
                "id": uuid.uuid4().hex[:4],
                "forget_class": self.request.forget_class,
                "phase": "Unlearning",
                "init_id": "0000",
                "method": "Retrain",
                "epochs": 30,
                "batch_size": 128,
                "learning_rate": 0.01,
                "unlearn_accuracy": round(self.status.unlearn_accuracy, 3),
                "remain_accuracy": self.status.remain_accuracy,
                "test_unlearn_accuracy": round(test_unlearn_accuracy, 3),
                "test_remain_accuracy": test_remain_accuracy,
                "RTE": 1890.1,
                "train_class_accuracies": {k: round(v, 3) for k, v in train_class_accuracies.items()},
                "test_class_accuracies": {k: round(v, 3) for k, v in test_class_accuracies.items()},
                "train_label_distribution": self.format_distribution(train_label_dist),
                "train_confidence_distribution": self.format_distribution(train_conf_dist),
                "test_label_distribution": self.format_distribution(test_label_dist),
                "test_confidence_distribution": self.format_distribution(test_conf_dist),
                "similarity": cka_results["similarity"],
                "detailed_results": detailed_results,
            }

            # Save results to JSON file
            os.makedirs('data', exist_ok=True)
            with open(f'data/{results["id"]}.json', 'w') as f:
                json.dump(results, f, indent=2)

            print(f"Results saved to data/{results['id']}.json")
        else:
            print("Custom Unlearning cancelled or model not available.")

        print("Custom Unlearning inference completed!")