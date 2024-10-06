import base64
import json
import threading
import asyncio
import uuid
import numpy as np
import torch
import time
import os
import matplotlib.pyplot as plt
from app.utils.helpers import save_model
from app.utils.evaluation import evaluate_model, get_layer_activations_and_predictions
from app.utils.visualization import compute_umap_embedding
from app.config.settings import MAX_GRAD_NORM, UMAP_DATA_SIZE, UMAP_DATASET

class UnlearningGAThread(threading.Thread):
    def __init__(self, 
                 model,
                 device,
                 criterion,
                 optimizer,
                 scheduler,
                 request,
                 forget_loader,
                 train_loader,
                 test_loader,
                 train_set,
                 test_set,
                 status,
                 model_name, 
                 dataset_name
                 ):
        threading.Thread.__init__(self)
        self.model = model
        self.device = device
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.request = request
        self.forget_loader = forget_loader
        self.train_loader = train_loader
        self.test_loader = test_loader
        self.train_set = train_set
        self.test_set = test_set
        self.status = status
        self.model_name = model_name
        self.dataset_name = dataset_name

        self.exception = None
        self.loop = None
        self._stop_event = threading.Event()

    def run(self):
        try:
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            self.loop.run_until_complete(self.unlearn_GA_model())
        except Exception as e:
            self.exception = e
        finally:
            if self.loop:
                self.loop.close()

    def stop(self):
        self._stop_event.set()

    def stopped(self):
        return self._stop_event.is_set()
    
    async def unlearn_GA_model(self):
        self.model.train()
        self.status.start_time = time.time()
        self.status.total_epochs = self.request.epochs
        
        train_accuracies = []
        test_accuracies = []

        for epoch in range(self.request.epochs):
            running_loss = 0.0
            
            for i, (inputs, labels) in enumerate(self.forget_loader):
                if self.stopped():
                    self.status.is_unlearning = False
                    print("\nTraining cancelled mid-batch.")
                    return
                
                inputs, labels = inputs.to(self.device), labels.to(self.device)
                self.optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = -self.criterion(outputs, labels)
                loss.backward()

                torch.nn.utils.clip_grad_norm_(self.model.parameters(), MAX_GRAD_NORM)
                self.optimizer.step()
                running_loss += loss.item()

            if self.stopped():
                self.status.is_unlearning = False
                print("\nTraining cancelled mid-batch.")
                return

            self.scheduler.step()

            # Evaluate on train set
            train_loss, train_accuracy, train_class_accuracies = await evaluate_model(self.model, self.train_loader, self.criterion, self.device)
            
            # Evaluate on test set
            test_loss, test_accuracy, test_class_accuracies = await evaluate_model(self.model, self.test_loader, self.criterion, self.device)
            
            train_accuracies.append(train_accuracy)
            test_accuracies.append(test_accuracy)

            # Save current model (last epoch)
            if epoch == self.request.epochs - 1:
                save_dir = 'unlearned_models'
                save_model(self.model, save_dir, self.model_name, self.dataset_name, epoch + 1, self.request.learning_rate)
                print(f"Model saved after epoch {epoch + 1}")

            # Update status
            self.status.current_epoch = epoch + 1
            self.status.progress = (epoch + 1) / self.request.epochs * 80
            self.status.current_loss = train_loss
            self.status.current_accuracy = train_accuracy
            self.status.test_loss = test_loss
            self.status.test_accuracy = test_accuracy
            self.status.train_class_accuracies = train_class_accuracies
            self.status.test_class_accuracies = test_class_accuracies
            
            elapsed_time = time.time() - self.status.start_time
            estimated_total_time = elapsed_time / (epoch + 1) * self.request.epochs
            self.status.estimated_time_remaining = max(0, estimated_total_time - elapsed_time)
            
            current_lr = self.optimizer.param_groups[0]['lr']

            print(f"\nEpoch [{epoch+1}/{self.request.epochs}]")
            print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_accuracy:.3f}")
            print(f"Test Loss: {test_loss:.4f}, Test Acc: {test_accuracy:.3f}")
            print(f"Current LR: {current_lr}")
            print("Train Class Accuracies:")
            for i, acc in train_class_accuracies.items():
                print(f"  Class {i}: {acc:.3f}")
            print("Test Class Accuracies:")
            for i, acc in test_class_accuracies.items():
                print(f"  Class {i}: {acc:.3f}")
            print(f"Progress: {self.status.progress:.2f}%, ETA: {self.status.estimated_time_remaining:.2f}s")
            
        # Print a newline at the end of unlearning
        print()
        
        # UMAP and activation calculation logic
        logits = None
        mean_logits = None
        umap_embeddings = None
        svg_files = None
        if not self.stopped() and self.model is not None:
            print("Getting data loaders for UMAP")
            dataset = self.train_set if UMAP_DATASET == 'train' else self.test_set
            subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
            subset = torch.utils.data.Subset(dataset, subset_indices)
            subset_loader = torch.utils.data.DataLoader(subset, batch_size=UMAP_DATA_SIZE, shuffle=False)
            
            print("Computing layer activations")
            activations, predicted_labels, logits, mean_logits = await get_layer_activations_and_predictions(
                model=self.model,
                data_loader=subset_loader,
                device=self.device,
                forget_class=self.request.forget_class
            )
            self.status.progress = 90

            print("Computing UMAP embeddings")
            forget_labels = torch.tensor([label == self.request.forget_class for _, label in subset])
            umap_embeddings, svg_files = await compute_umap_embedding(
                activations, 
                predicted_labels, 
                forget_class=self.request.forget_class,
                forget_labels=forget_labels
            )
            self.status.umap_embeddings = umap_embeddings
            self.status.svg_files = svg_files
            self.status.progress = 100
            print("Custom Unlearning inference and visualization completed!")
        else:
            print("Custom Unlearning cancelled or model not available.")

        # Encode SVG files
        encoded_svg_files = {
            f"{layer}": base64.b64encode(svg).decode('utf-8') 
            for layer, svg in self.status.svg_files.items()
        }

        # Prepare results dictionary
        results = {
            "id": uuid.uuid4().hex[:4],
            "forget_class": self.request.forget_class,
            "model": "ResNet18",
            "dataset": "CIFAR-10",
            "training": "None",
            "unlearning": {
                "method": "Gradient-Ascent",
                "epochs": self.request.epochs,
                "batch_size": self.request.batch_size,
                "learning_rate": self.request.learning_rate,
            },
            "defense": "None",
            "unlearn_accuracy": f"{self.status.unlearn_accuracy:.3f}",
            "remain_accuracy": f"{self.status.remain_accuracy:.3f}",
            "test_accuracy": f"{self.status.test_accuracy:.3f}",
            "MIA": 0,
            "RTE": 1480.0,
            "train_class_accuracies": {str(k): f"{v:.3f}" for k, v in train_class_accuracies.items()},
            "test_class_accuracies": {str(k): f"{v:.3f}" for k, v in test_class_accuracies.items()},
            "logits": logits.tolist() if isinstance(logits, (np.ndarray, torch.Tensor)) else logits,
            "mean_logits": float(mean_logits) if mean_logits is not None else None,
            "embeddings": {k: v.tolist() if isinstance(v, (np.ndarray, torch.Tensor)) else v for k, v in umap_embeddings.items()},
            "svg_files": encoded_svg_files,
        }

        def json_serializable(obj):
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            raise TypeError(f"Type {type(obj)} not serializable")

        # Save results to JSON file
        os.makedirs('data', exist_ok=True)
        with open(f'data/result_GA_{results["id"]}_forget_{self.request.forget_class}.json', 'w') as f:
            json.dump(results, f, indent=2, default=json_serializable)

        print(f"Results saved to data/result_{results['id']}.json")
        print("Custom Unlearning inference completed!")