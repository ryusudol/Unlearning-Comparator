import torch
import time
import uuid
from app.utils.helpers import format_distribution
from app.utils.evaluation import evaluate_model_with_distributions
from app.utils.thread_base import BaseUnlearningThread
from app.utils.thread_operations import (
    setup_umap_subset,
    prepare_detailed_results,
    create_base_results_dict,
    save_results_and_model,
    get_evaluation_functions,
    get_attack_functions,
    get_visualization_functions
)

class UnlearningFaceCustomThread(BaseUnlearningThread):
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
                 device,
                 base_weights):
        super().__init__()
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
        self.base_weights = base_weights
        self.num_classes = 10
        self.remain_classes = [i for i in range(self.num_classes) if i != self.forget_class]
        
    def print_distribution(self, distribution):
        for i in range(10):
            print(f"  Class {i}:")
            for j in range(10):
                print(f"    Predicted as {j}: {distribution[i][j]:.3f}")
    
    async def async_main(self):
        print(f"Starting Face unlearning inference for class {self.forget_class}...")
        self.status.progress = "Starting Inference"
        self.status.method = "Custom"
        self.status.recent_id = uuid.uuid4().hex[:4]
        
        # Get dataset-specific functions
        eval_functions = get_evaluation_functions("face")
        attack_functions = get_attack_functions("face") 
        viz_functions = get_visualization_functions("face")

        umap_subset, umap_subset_loader, selected_indices = setup_umap_subset(
            self.train_set, self.test_set, self.num_classes
        )
        
        start_time = time.time()
        
        print(f"Models loaded successfully at {time.time() - start_time:.3f} seconds")
        
        # Evaluate on train set
        self.status.progress = "Evaluating Train Set"
        print("Start Train set evaluation")

        if self.check_stopped_and_return(self.status):
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
        if self.check_stopped_and_return(self.status):
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

        if self.check_stopped_and_return(self.status):
            return
        
        # UMAP and activation calculation
        self.status.progress = "Computing UMAP"
        
        print("Computing layer activations")
        (
            activations,
            predicted_labels,
            probs,
        ) = await eval_functions['get_layer_activations_and_predictions'](
            model=self.model,
            data_loader=umap_subset_loader,
            device=self.device,
        )
        print(f"Layer activations computed at {time.time() - start_time:.3f} seconds")

        # UMAP embedding computation
        print("Computing UMAP embedding")
        forget_labels = torch.tensor([label == self.forget_class for _, label in umap_subset])
        umap_embedding = await viz_functions['compute_umap_embedding'](
            activation=activations, 
            labels=predicted_labels, 
            forget_class=self.forget_class,
            forget_labels=forget_labels
        )
        print(f"UMAP embedding computed at {time.time() - start_time:.3f} seconds")
        
        # Process attack metrics using the same umap_subset_loader
        print("Processing attack metrics on UMAP subset")
        values, attack_results, fqs = await attack_functions['process_attack_metrics'](
            model=self.model,
            data_loader=umap_subset_loader,
            device=self.device,
            forget_class=self.forget_class
        )
        
        # Prepare detailed results
        detailed_results = prepare_detailed_results(
            umap_subset, selected_indices, predicted_labels, 
            umap_embedding, probs, self.forget_class
        )

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
                                         
        # # CKA similarity calculation
        if not self.is_training_eval:
            self.status.progress = "Calculating CKA Similarity"
            print("Calculating CKA similarity")
            cka_results = await eval_functions['calculate_cka_similarity'](
                model_before=self.model_before,
                model_after=self.model,
                forget_class=self.forget_class,
                device=self.device
            )
            print(f"CKA similarity calculated at {time.time() - start_time:.3f} seconds")

        # Create results dictionary using unified structure
        request_stub = type('obj', (object,), {'epochs': "N/A", 'batch_size': "N/A", 'learning_rate': "N/A"})()
        results = create_base_results_dict(
            self.status, self.forget_class, self.base_weights, 
            "Custom", request_stub
        )
        
        results.update({
            "UA": "N/A" if self.is_training_eval else round(unlearn_accuracy, 3),
            "RA": remain_accuracy,
            "TUA": "N/A" if self.is_training_eval else round(test_unlearn_accuracy, 3),
            "TRA": test_remain_accuracy,
            "PA": "N/A" if self.is_training_eval else round(((1 - unlearn_accuracy) + (1 - test_unlearn_accuracy) + remain_accuracy + test_remain_accuracy) / 4, 3),
            "RTE": "N/A",
            "FQS": fqs,
            "accs": [round(v, 3) for v in train_class_accuracies.values()],
            "label_dist": format_distribution(train_label_dist),
            "conf_dist": format_distribution(train_conf_dist),
            "t_accs": [round(v, 3) for v in test_class_accuracies.values()],
            "t_label_dist": format_distribution(test_label_dist),
            "t_conf_dist": format_distribution(test_conf_dist),
            "cka": "N/A" if self.is_training_eval else cka_results.get("similarity"),
            "cka_retrain": "N/A" if self.is_training_eval else cka_results.get("similarity_retrain"),
            "points": detailed_results,
            "attack": {
                "values": values,
                "results": attack_results
            }
        })

        # Save results and model using unified function
        result_path = save_results_and_model(
            results, self.model, self.forget_class, self.status, dataset_mode="face"
        )
        
        print(f"Results saved to {result_path}")
        print(f"Custom unlearning inference completed at {time.time() - start_time:.3f} seconds")
        self.status.progress = "Completed"
