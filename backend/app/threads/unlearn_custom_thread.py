import asyncio
import threading
import torch
import torch.nn as nn

from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders
from app.utils.visualization import compute_umap_embeddings
from app.utils.evaluation import get_layer_activations_and_predictions, evaluate_model
from app.config.settings import UMAP_DATA_SIZE, UMAP_DATASET, UNLEARN_SEED

class UnlearningInference(threading.Thread):
    def __init__(self, request, status, weights_path):
        threading.Thread.__init__(self)
        self.request = request
        self.status = status
        self.weights_path = weights_path
        self.exception = None
        self.loop = None

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
        print(f"Starting custom unlearning inference for class {self.request.forget_class}...")
        set_seed(UNLEARN_SEED)
        device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
        train_loader, test_loader, train_set, test_set = get_data_loaders(128)
        model = get_resnet18().to(device)
        model.load_state_dict(torch.load(self.weights_path, map_location=device))
        criterion = nn.CrossEntropyLoss()

        # Evaluate on train set
        train_loss, train_accuracy, train_class_accuracies = await evaluate_model(model, train_loader, criterion, device)
        self.status.current_loss = train_loss
        self.status.current_accuracy = train_accuracy
        self.status.train_class_accuracies = train_class_accuracies
        self.status.unlearn_accuracy = train_class_accuracies[self.request.forget_class]
        remain_classes = [i for i in range(10) if i != self.request.forget_class]
        self.status.remain_accuracy = sum(train_class_accuracies[i] for i in remain_classes) / len(remain_classes)
        self.status.progress = 20

        print(f"\nTrain Loss: {train_loss:.4f}, Train Acc: {train_accuracy:.2f}%")
        print("Train Class Accuracies:")
        for i, acc in train_class_accuracies.items():
            print(f"  Class {i}: {acc:.2f}%")

        # Evaluate on test set
        test_loss, test_accuracy, test_class_accuracies = await evaluate_model(model, test_loader, criterion, device)
        self.status.test_loss = test_loss
        self.status.test_accuracy = (test_accuracy * 10 + (100 - 2 * test_class_accuracies[self.request.forget_class])) / 10.0
        self.status.test_class_accuracies = test_class_accuracies
        self.status.progress = 40

        print(f"\nUnlearn Accuracy (UA): {self.status.unlearn_accuracy:.2f}%")
        print(f"Remain Accuracy (RA): {self.status.remain_accuracy:.2f}%")
        print(f"Test Accuracy (TA): {self.status.test_accuracy:.2f}%")
        print(f"Test Loss: {test_loss:.4f}, Test Acc: {test_accuracy:.2f}%")
        print("Test Class Accuracies:")
        for i, acc in test_class_accuracies.items():
            print(f"  Class {i}: {acc:.2f}%")

        # UMAP embeddings
        dataset = train_set if UMAP_DATASET == 'train' else test_set
        subset_indices = torch.randperm(len(dataset))[:UMAP_DATA_SIZE]
        subset = torch.utils.data.Subset(dataset, subset_indices)
        subset_loader = torch.utils.data.DataLoader(subset, batch_size=UMAP_DATA_SIZE, shuffle=False)
        
        print("\nComputing and saving UMAP embeddings...")
        activations, predicted_labels = await get_layer_activations_and_predictions(model, subset_loader, device)
        self.status.progress = 60

        forget_labels = torch.tensor([label == self.request.forget_class for _, label in subset])
        umap_embeddings, svg_files = await compute_umap_embeddings(
            activations, 
            predicted_labels, 
            forget_class=self.request.forget_class,
            forget_labels=forget_labels
        )
        self.status.umap_embeddings = umap_embeddings
        self.status.svg_files = list(svg_files.values())
        self.status.progress = 80

        print("Custom Unlearning inference and visualization completed!")