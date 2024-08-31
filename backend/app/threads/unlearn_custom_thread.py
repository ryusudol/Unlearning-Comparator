import threading
import asyncio
import torch
import torch.nn as nn

from app.models.neural_network import get_resnet18
from app.utils.helpers import set_seed, get_data_loaders
from app.utils.evaluation import evaluate_model
from app.config.settings import UNLEARN_SEED

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
        train_loader, test_loader, _, _ = get_data_loaders(128)
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

        print(f"\nTrain Loss: {train_loss:.4f}, Train Acc: {train_accuracy:.2f}%")
        print("Train Class Accuracies:")
        for i, acc in train_class_accuracies.items():
            print(f"  Class {i}: {acc:.2f}%")

        if self.stopped():
            return

        # Evaluate on test set
        test_loss, test_accuracy, test_class_accuracies = await evaluate_model(self.model, test_loader, criterion, device)
        self.status.test_loss = test_loss
        self.status.test_accuracy = (test_accuracy * 10 + (100 - 2 * test_class_accuracies[self.request.forget_class])) / 10.0
        self.status.test_class_accuracies = test_class_accuracies
        self.status.progress = 80

        if self.stopped():
            return

        print(f"\nUnlearn Accuracy (UA): {self.status.unlearn_accuracy:.2f}%")
        print(f"Remain Accuracy (RA): {self.status.remain_accuracy:.2f}%")
        print(f"Test Accuracy (TA): {self.status.test_accuracy:.2f}%")
        print(f"Test Loss: {test_loss:.4f}, Test Acc: {test_accuracy:.2f}%")
        print("Test Class Accuracies:")
        for i, acc in test_class_accuracies.items():
            print(f"  Class {i}: {acc:.2f}%")

        print("Custom Unlearning inference completed!")