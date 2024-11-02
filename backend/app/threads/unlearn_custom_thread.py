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
	evaluate_model_with_distributions, 
	get_layer_activations_and_predictions, 
	calculate_cka_similarity
)
from app.utils.visualization import compute_umap_embedding
from app.config.settings import UNLEARN_SEED, UMAP_DATA_SIZE, UMAP_DATASET

class UnlearningInference(threading.Thread):
    def __init__(self, forget_class, status, weights_path_before, weights_path_after):
        threading.Thread.__init__(self)
        self.forget_class = forget_class
        self.is_training_eval = (forget_class == -1)
        self.status = status
        self.weights_path_before = weights_path_before
        self.weights_path_after = weights_path_after
        self.num_classes = 10
        self.exception = None
        self.loop = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
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
        
        print(f"Starting custom unlearning inference for class {self.forget_class}...")
        set_seed(UNLEARN_SEED)

        train_loader, test_loader, train_set, test_set = get_data_loaders(batch_size=1024)
        criterion = nn.CrossEntropyLoss()
        model_before = get_resnet18().to(self.device)
        model_before.load_state_dict(torch.load(self.weights_path_before, map_location=self.device))
        model_after = get_resnet18().to(self.device)
        model_after.load_state_dict(torch.load(self.weights_path_after, map_location=self.device))

        if self.stopped():
            return
        print("Models loaded successfully!")
        print("Start Train set evaluation")

        # Evaluate on train set
        (
            train_loss, 
            train_accuracy, 
            train_class_accuracies, 
            train_label_dist, 
            train_conf_dist
        ) = await evaluate_model_with_distributions (
            model=model_after, 
            data_loader=train_loader,
            criterion=criterion, 
            device=self.device
        )
        
        self.status.current_loss = train_loss
        self.status.current_accuracy = train_accuracy
        self.status.train_class_accuracies = train_class_accuracies

        if self.is_training_eval:
            self.status.unlearn_accuracy = "N/A"
            self.status.remain_accuracy = train_accuracy
        else:
            remain_classes = [i for i in range(self.num_classes) if i != self.forget_class]
            self.status.unlearn_accuracy = train_class_accuracies[self.forget_class]
            self.status.remain_accuracy = round(sum(train_class_accuracies[i] for i in remain_classes) / len(remain_classes), 3)

        print("Train Class Accuracies:")
        for i, acc in self.status.train_class_accuracies.items():
            print(f"  Class {i}: {acc:.3f}")

        # print("Train Label Distribution:")
        # self.print_distribution(train_label_dist)
        # print("Train Confidence Distribution:")
        # self.print_distribution(train_conf_dist)

        if self.stopped():
            return
        
        # Evaluate on test set
        print("Start Test set evaluation")
        (
            test_loss, 
            test_accuracy, 
            test_class_accuracies, 
            test_label_dist, 
            test_conf_dist
        ) = await evaluate_model_with_distributions(
            model=model_after, 
            data_loader=test_loader, 
            criterion=criterion, 
            device=self.device
        )

        self.status.test_loss = test_loss
        if self.is_training_eval:
            self.status.test_accuracy = test_accuracy / 10.0
        else:
            self.status.test_accuracy = (test_accuracy * 10.0 - test_class_accuracies[self.forget_class]) / 9.0 

        self.status.test_class_accuracies = test_class_accuracies
        
        print("Test Class Accuracies:")
        for i, acc in self.status.test_class_accuracies.items():
            print(f"  Class {i}: {acc:.3f}")

        # print("Test Label Distribution:")
        # self.print_distribution(test_label_dist)
        # print("Test Confidence Distribution:")
        # self.print_distribution(test_conf_dist)

        if self.stopped():
            return

        # UMAP and activation calculation
        dataset = train_set if UMAP_DATASET == 'train' else test_set
        subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
        subset = torch.utils.data.Subset(dataset, subset_indices)
        subset_loader = torch.utils.data.DataLoader(subset, batch_size=UMAP_DATA_SIZE, shuffle=False)
        
        print("Computing layer activations")
        (
            activations, 
            predicted_labels, 
            logits, 
        ) = await get_layer_activations_and_predictions(
            model=model_after,
            data_loader=subset_loader,
            device=self.device,
        )
        print("Computing UMAP embedding")
        forget_labels = torch.tensor([label == self.forget_class for _, label in subset])
        umap_embedding, _ = await compute_umap_embedding(
            activation=activations, 
            labels=predicted_labels, 
            forget_class=self.forget_class,
            forget_labels=forget_labels
        )
        print("Custom Unlearning inference and visualization completed!")
        detailed_results = []
        for i in range(len(subset)):
            original_index = subset_indices[i].item()
            ground_truth = subset.dataset.targets[subset_indices[i]]
            is_forget = ground_truth == self.forget_class
            detailed_results.append({
                "index": i,
                "ground_truth": int(ground_truth),
                "original_index": int(original_index),
                "predicted_class": int(predicted_labels[i]),
                "is_forget": bool(is_forget),
                "umap_embedding": [round(float(coord), 3) for coord in umap_embedding[i]],
                "logit": [round(float(l), 3) for l in logits[i]],
            })
        if self.is_training_eval:
            test_unlearn_accuracy = "N/A"  # test set의 unlearn_accuracy도 N/A로 설정, 나중에 코드 합치기 (train test-> train test)
            test_remain_accuracy = test_accuracy
        else:
            remain_classes = [i for i in range(self.num_classes) if i != self.forget_class]
            test_unlearn_accuracy = test_class_accuracies[self.forget_class]
            test_remain_accuracy = round(sum(test_class_accuracies[i] for i in remain_classes))
                                         
        print("Calculating CKA similarity")
        if not self.is_training_eval:
            cka_results = await calculate_cka_similarity(
                model_before=model_before,
                model_after=model_after,
                train_loader=train_loader,
                test_loader=test_loader,
                forget_class=self.forget_class,
                device=self.device
            )

        # Prepare results dictionary
        results = {
            "id": uuid.uuid4().hex[:4],
            "forget_class": self.forget_class,
            "phase": "Training" if self.is_training_eval else "Unlearning",
            "init_id": "N/A",
            "method": "Custom",
            "epochs": 30,
            "batch_size": 128,
            "learning_rate": 0.01,
            "unlearn_accuracy": "N/A" if self.is_training_eval else round(self.status.unlearn_accuracy, 3),
            "remain_accuracy": self.status.remain_accuracy,
            "test_unlearn_accuracy": "N/A" if self.is_training_eval else round(test_unlearn_accuracy, 3),
            "test_remain_accuracy": test_remain_accuracy,
            "RTE": 1890.1,
            "train_class_accuracies": {k: round(v, 3) for k, v in train_class_accuracies.items()},
            "test_class_accuracies": {k: round(v, 3) for k, v in test_class_accuracies.items()},
            "train_label_distribution": self.format_distribution(train_label_dist),
            "train_confidence_distribution": self.format_distribution(train_conf_dist),
            "test_label_distribution": self.format_distribution(test_label_dist),
            "test_confidence_distribution": self.format_distribution(test_conf_dist),
            "similarity": "N/A" if self.is_training_eval else cka_results["similarity"],
            "detailed_results": detailed_results,
        }
        # Save results to JSON file
        os.makedirs('data', exist_ok=True)
        with open(f'data/{results["id"]}.json', 'w') as f:
            json.dump(results, f, indent=2)
        print(f"Results saved to data/{results['id']}.json")