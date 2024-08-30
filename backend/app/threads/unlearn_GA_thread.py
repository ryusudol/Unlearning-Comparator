import threading
import asyncio
import torch
import time
import sys
import os
import matplotlib.pyplot as plt
from app.utils.helpers import save_model
from app.utils.evaluation import evaluate_model
from app.config.settings import MAX_GRAD_NORM

class UnlearningGAThread(threading.Thread):
    def __init__(self, model, forget_loader, train_loader, test_loader, criterion, optimizer, scheduler,
                 device, epochs, status, model_name, dataset_name, learning_rate, forget_class):
        threading.Thread.__init__(self)
        self.model = model
        self.forget_loader = forget_loader
        self.train_loader = train_loader
        self.test_loader = test_loader
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

    async def unlearn_GA_model(self):
        self.model.train()
        self.status.start_time = time.time()
        self.status.total_epochs = self.epochs
        
        train_accuracies = []
        test_accuracies = []

        for epoch in range(self.epochs):
            running_loss = 0.0
            
            for i, (inputs, labels) in enumerate(self.forget_loader):
                if self.status.cancel_requested:
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

            if self.status.cancel_requested:
                self.status.is_unlearning = False
                print("\nUnlearning cancelled.")
                return
            
            self.scheduler.step()

            # Evaluate on train set
            train_loss, train_accuracy, train_class_accuracies = await evaluate_model(self.model, self.train_loader, self.criterion, self.device)
            
            # Evaluate on test set
            test_loss, test_accuracy, test_class_accuracies = await evaluate_model(self.model, self.test_loader, self.criterion, self.device)
            
            train_accuracies.append(train_accuracy)
            test_accuracies.append(test_accuracy)

            # Save current model (last epoch)
            if epoch == self.epochs - 1:
                save_dir = 'unlearned_models'
                save_model(self.model, save_dir, self.model_name, self.dataset_name, epoch + 1, self.learning_rate)
                print(f"Model saved after epoch {epoch + 1}")

            # Update status
            self.status.current_epoch = epoch + 1
            self.status.progress = (epoch + 1) / self.epochs * 80
            self.status.current_loss = train_loss
            self.status.current_accuracy = train_accuracy
            self.status.test_loss = test_loss
            self.status.test_accuracy = test_accuracy
            self.status.train_class_accuracies = train_class_accuracies
            self.status.test_class_accuracies = test_class_accuracies
            
            elapsed_time = time.time() - self.status.start_time
            estimated_total_time = elapsed_time / (epoch + 1) * self.epochs
            self.status.estimated_time_remaining = max(0, estimated_total_time - elapsed_time)
            
            current_lr = self.optimizer.param_groups[0]['lr']

            print(f"\nEpoch [{epoch+1}/{self.epochs}]")
            print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_accuracy:.2f}%")
            print(f"Test Loss: {test_loss:.4f}, Test Acc: {test_accuracy:.2f}%")
            print(f"Current LR: {current_lr}")
            print("Train Class Accuracies:")
            for i, acc in train_class_accuracies.items():
                print(f"  Class {i}: {acc:.2f}%")
            print("Test Class Accuracies:")
            for i, acc in test_class_accuracies.items():
                print(f"  Class {i}: {acc:.2f}%")
            print(f"Progress: {self.status.progress:.5f}%, ETA: {self.status.estimated_time_remaining:.2f}s")
            
            sys.stdout.flush()
        
        print()  # Print a newline at the end of unlearning

        # if not self.status.cancel_requested:
        #     plt.figure(figsize=(10, 6))
        #     plt.plot(range(1, self.epochs + 1), train_accuracies, label='Train Accuracy')
        #     plt.plot(range(1, self.epochs + 1), test_accuracies, label='Test Accuracy')
        #     plt.xlabel('Epochs')
        #     plt.ylabel('Accuracy (%)')
        #     plt.title(f'Training and Test Accuracy for {self.model_name} on {self.dataset_name}')
        #     plt.legend()
        #     plt.grid(True)
        #     plot_filename = f"accuracy_plot_{self.model_name}_{self.dataset_name}_{self.epochs}epochs_{self.learning_rate}lr.png"
        #     plot_path = os.path.join('unlearned_models', plot_filename)
        #     plt.savefig(plot_path)
        #     plt.close()
        #     print(f"Accuracy plot saved to {plot_path}")