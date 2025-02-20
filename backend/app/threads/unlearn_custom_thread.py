import threading
import asyncio
import torch
import time
import json
import os
import uuid

from app.utils.evaluation import (
	evaluate_model_with_distributions, 
	get_layer_activations_and_predictions, 
	calculate_cka_similarity,
)
from app.utils.attack import process_attack_metrics
from app.utils.visualization import compute_umap_embedding
from app.utils.helpers import (
	format_distribution, 
	compress_prob_array, 
	save_model
)
from app.config import (
	UMAP_DATA_SIZE, 
	UMAP_DATASET, 
	UNLEARN_SEED
)

class UnlearningCustomThread(threading.Thread):
    def __init__(self, 
                 forget_class,
                 status,
                 model_before,
                 model,
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
        self.model = model
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
        self.status.progress = "Starting Inference"
        self.status.method = "Custom"
        self.status.recent_id = uuid.uuid4().hex[:4]
        
        dataset = self.train_set if UMAP_DATASET == 'train' else self.test_set
        
        targets = torch.tensor(dataset.targets)
        class_indices = [(targets == i).nonzero().squeeze() for i in range(self.num_classes)]
        
        samples_per_class = UMAP_DATA_SIZE // self.num_classes
        generator = torch.Generator()
        generator.manual_seed(UNLEARN_SEED)
        
        selected_indices = []
        for indices in class_indices:
            perm = torch.randperm(len(indices), generator=generator)
            selected_indices.extend(indices[perm[:samples_per_class]].tolist())
        
        umap_subset = torch.utils.data.Subset(dataset, selected_indices)
        umap_subset_loader = torch.utils.data.DataLoader(
            umap_subset, batch_size=UMAP_DATA_SIZE, shuffle=False
        )
        
        start_time = time.time()
        
        print(f"Models loaded successfully at {time.time() - start_time:.3f} seconds")
        
        # Evaluate on train set
        self.status.progress = "Evaluating Train Set"
        print("Start Train set evaluation")

        if self.stopped():
            self.status.is_unlearning = False
            return
        
        # Evaluate on train set
        (
            train_loss,
            train_accuracy, 
            train_class_accuracies, 
            train_label_dist, 
            train_conf_dist
        ) = await evaluate_model_with_distributions (
            model=self.model, 
            data_loader=self.train_loader,
            criterion=self.criterion, 
            device=self.device,
        )

        # Update training evaluation status for remain classes only
        self.status.p_training_loss = train_loss
        if self.is_training_eval:
            self.status.p_training_accuracy = train_accuracy
        else:
            remain_train_accuracy = sum(train_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes)
            self.status.p_training_accuracy = remain_train_accuracy

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
        )

        # Update test evaluation status for remain classes only
        self.status.p_test_loss = test_loss
        if self.is_training_eval:
            self.status.p_test_accuracy = test_accuracy
        else:
            remain_test_accuracy = sum(test_class_accuracies[i] for i in self.remain_classes) / len(self.remain_classes)
            self.status.p_test_accuracy = remain_test_accuracy

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
        
        # Process attack metrics using the same umap_subset_loader (no visualization here)
        print("Processing attack metrics on UMAP subset")
        values, attack_results, fqs = await process_attack_metrics(
            model=self.model, 
            data_loader=umap_subset_loader, 
            device=self.device, 
            forget_class=self.forget_class
        )
        
        # Detailed results preparation
        detailed_results = []
        for i in range(len(umap_subset)):
            original_index = selected_indices[i]
            ground_truth = umap_subset.dataset.targets[original_index]
            is_forget = ground_truth == self.forget_class
            detailed_results.append([
                int(ground_truth),                             # gt
                int(predicted_labels[i]),                      # pred
                int(original_index),                           # img index
                1 if is_forget else 0,                         # forget flag as binary
                round(float(umap_embedding[i][0]), 2),         # x coordinate
                round(float(umap_embedding[i][1]), 2),         # y coordinate
                compress_prob_array(probs[i].tolist()),        # compressed probabilities
            ])

        # Decode comment can be updated to:
        # function decodeDetailedResults(compressedArray) {
        #   return {
        #     gt: compressedArray[0],
        #     pred: compressedArray[1],
        #     img: compressedArray[2],
        #     forget: Boolean(compressedArray[3]),
        #     xy: [compressedArray[4], compressedArray[5]],
        #     prob: compressedArray[6]
        #   };
        # }

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
        if not self.is_training_eval:
            self.status.progress = "Calculating CKA Similarity"
            print("Calculating CKA similarity")
            cka_results = await calculate_cka_similarity(
                model_before=self.model_before,
                model_after=self.model,
                train_loader=self.train_loader,
                test_loader=self.test_loader,
                forget_class=self.forget_class,
                device=self.device
            )
            print(f"CKA similarity calculated at {time.time() - start_time:.3f} seconds")

        # Prepare results dictionary with computed FQS and attack results
        results = {
            "CreatedAt": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            "ID": self.status.recent_id,
            "FC": "N/A" if self.is_training_eval else self.forget_class,
            "Type": "Pretrained" if self.is_training_eval else "Unlearned", 
            "Base": "N/A",
            "Method": "Custom",
            "Epoch": "N/A",
            "BS": "N/A",
            "LR": "N/A",
            "UA": "N/A" if self.is_training_eval else round(unlearn_accuracy, 3),
            "RA": remain_accuracy,
            "TUA": "N/A" if self.is_training_eval else round(test_unlearn_accuracy, 3),
            "TRA": test_remain_accuracy,
            "PA": round(((1 - unlearn_accuracy) + (1 - test_unlearn_accuracy) + remain_accuracy + test_remain_accuracy) / 4, 3),
            "RTE": "N/A",
            "FQS": fqs,
            "accs": [round(v, 3) for v in train_class_accuracies.values()],
            "label_dist": format_distribution(train_label_dist),
            "conf_dist": format_distribution(train_conf_dist),
            "t_accs": [round(v, 3) for v in test_class_accuracies.values()],
            "t_label_dist": format_distribution(test_label_dist),
            "t_conf_dist": format_distribution(test_conf_dist),
            "cka": "N/A" if self.is_training_eval else cka_results["similarity"],
            "points": detailed_results,
            "attack": {
                "values": values,
                "results": attack_results
            }
        }

        # Save results to JSON file
        os.makedirs('data', exist_ok=True)
        forget_class_dir = os.path.join('data', str(self.forget_class))
        os.makedirs(forget_class_dir, exist_ok=True)

        result_path = os.path.join(forget_class_dir, f'{results["id"]}.json')
        with open(result_path, 'w') as f:
            json.dump(results, f, indent=2)

        save_model(
            model=self.model, 
            forget_class=self.forget_class,
            model_name=self.status.recent_id
        )
        
        print(f"Results saved to {result_path}")
        print(f"Custom unlearning inference completed at {time.time() - start_time:.3f} seconds")
        self.status.progress = "Completed"