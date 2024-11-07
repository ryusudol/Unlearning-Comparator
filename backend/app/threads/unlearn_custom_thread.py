import threading
import asyncio
import torch
import torch.nn as nn
import time
import json
import os
import uuid

from app.utils.evaluation import (
	evaluate_model_with_distributions, 
	get_layer_activations_and_predictions, 
	calculate_cka_similarity
)
from app.utils.visualization import compute_umap_embedding
from app.utils.helpers import format_distribution
from app.config.settings import UMAP_DATA_SIZE, UMAP_DATASET

class UnlearningInference(threading.Thread):
    def __init__(self, 
                 forget_class,
                 status,
                 model_before,
                 model_after,
                 train_loader,
                 test_loader,
                 train_set,
                 test_set,
                 criterion,
                 device):
        threading.Thread.__init__(self)
        self.forget_class = forget_class
        self.is_training_eval = (forget_class == -1)
        self.status = status
        self.model_before = model_before
        self.model_after = model_after
        self.train_loader = train_loader
        self.test_loader = test_loader
        self.train_set = train_set
        self.test_set = test_set
        self.criterion = criterion
        self.device = device
        self.num_classes = 10
        self.remain_classes = [i for i in range(self.num_classes) if i != self.forget_class]

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
    
    async def async_run(self):
        print(f"Starting custom unlearning inference for class {self.forget_class}...")
        
        start_time = time.time()
        print(f"Models loaded successfully at{time.time() - start_time:.3f} seconds")
        print("Start Train set evaluation")

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
            model=self.model_after, 
            data_loader=self.train_loader,
            criterion=self.criterion, 
            device=self.device
        )

        if self.is_training_eval:
            unlearn_accuracy = "N/A"
            remain_accuracy = round(train_accuracy, 3)
        else:
            unlearn_accuracy = train_class_accuracies[self.forget_class]
            remain_accuracy = round(
                sum(train_class_accuracies[i] for i in self.remain_classes) / len(self. remain_classes), 3
            )

        print("Train Class Accuracies:")
        for i, acc in train_class_accuracies.items():
            print(f"  Class {i}: {acc:.3f}")
        print(f"Train set evaluation finished at {time.time() - start_time:.3f} seconds")
        if self.stopped():
            return

        # print("Train Label Distribution:")
        # self.print_distribution(train_label_dist)
        # print("Train Confidence Distribution:")
        # self.print_distribution(train_conf_dist)
        
        # Evaluate on test set
        print("Start Test set evaluation")
        (
            test_loss, 
            test_accuracy, 
            test_class_accuracies, 
            test_label_dist, 
            test_conf_dist
        ) = await evaluate_model_with_distributions(
            model=self.model_after, 
            data_loader=self.test_loader, 
            criterion=self.criterion, 
            device=self.device
        )

        if not self.is_training_eval:
            test_accuracy = round(
                sum(test_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes), 3
            )
        
        print("Test Class Accuracies:")
        for i, acc in test_class_accuracies.items():
            print(f"  Class {i}: {acc:.3f}")

        print(f"Test set evaluation finished at {time.time() - start_time:.3f} seconds")

        if self.stopped():
            return
        # print("Test Label Distribution:")
        # self.print_distribution(test_label_dist)
        # print("Test Confidence Distribution:")
        # self.print_distribution(test_conf_dist)

        # UMAP and activation calculation
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
            model=self.model_after,
            data_loader=umap_subset_loader,
            device=self.device,
        )
        print(f"Layer activations computed at {time.time() - start_time:.3f} seconds")

        # UMAP embedding computation
        print("Computing UMAP embedding")
        forget_labels = torch.tensor([label == self.forget_class for _, label in umap_subset])
        umap_embedding = await compute_umap_embedding(
            activation=activations, 
            labels=predicted_labels, 
            forget_class=self.forget_class,
            forget_labels=forget_labels
        )
        print(f"UMAP embedding computed at {time.time() - start_time:.3f} seconds")

        # Detailed results preparation
        detailed_results = []
        for i in range(len(umap_subset)):
            original_index = umap_subset_indices[i].item()
            ground_truth = umap_subset.dataset.targets[umap_subset_indices[i]]
            is_forget = ground_truth == self.forget_class
            detailed_results.append({
                "index": i,
                "ground_truth": int(ground_truth),
                "original_index": int(original_index),
                "predicted_class": int(predicted_labels[i]),
                "is_forget": bool(is_forget),
                "umap_embedding": [round(float(coord), 3) for coord in umap_embedding[i]],
                "prob": [round(float(l), 3) for l in probs[i]],
            })

        # Test accuracy calculation
        if self.is_training_eval:
            test_unlearn_accuracy = "N/A"
            test_remain_accuracy = round(test_accuracy, 3) 
        else:
            test_unlearn_accuracy = test_class_accuracies[self.forget_class]
            test_remain_accuracy = round(
                sum(test_class_accuracies[i] for i in self.remain_classes) / 9.0, 3
            )
                                         
        # CKA similarity calculation
        print("Calculating CKA similarity")
        if not self.is_training_eval:
            cka_results = await calculate_cka_similarity(
                model_before=self.model_before,
                model_after=self.model_after,
                train_loader=self.train_loader,
                test_loader=self.test_loader,
                forget_class=self.forget_class,
                device=self.device
            )
            print(f"CKA similarity calculated at {time.time() - start_time:.3f} seconds")

        # Prepare results dictionary
        results = {
            "id": uuid.uuid4().hex[:4],
            "forget_class": "N/A" if self.is_training_eval else self.forget_class,
            "phase": "Training" if self.is_training_eval else "Unlearning",
            "init_id": "N/A",
            "method": "N/A",
            "epochs": 30,
            "batch_size": 128,
            "learning_rate": 0.01,
            "unlearn_accuracy": "N/A" if self.is_training_eval 
                else round(unlearn_accuracy, 3),
            "remain_accuracy": remain_accuracy,
            "test_unlearn_accuracy": "N/A" if self.is_training_eval 
                else round(test_unlearn_accuracy, 3),
            "test_remain_accuracy": test_remain_accuracy,
            "RTE": "N/A",
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
            "similarity": "N/A" if self.is_training_eval else cka_results["similarity"],
            "detailed_results": detailed_results,
        }
        # Save results to JSON file
        os.makedirs('data', exist_ok=True)
        with open(f'data/{results["id"]}.json', 'w') as f:
            json.dump(results, f, indent=2)
            
        print(f"Results saved to data/{results['id']}.json")
        print(f"Custom unlearning inference completed at {time.time() - start_time:.3f} seconds")