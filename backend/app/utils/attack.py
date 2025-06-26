import torch
import numpy as np
import torch.nn.functional as F
import matplotlib.pyplot as plt
from scipy.stats import entropy
import json
from datetime import datetime

# Configuration constants for attack scoring
ENTROPY_CONFIG = {
    "bins": 51,
    "range": [0.00, 2.50],
    "max_display": 25
}

CONFIDENCE_CONFIG = {
    "bins": 51,
    "range": [-2.50, 10.00],
    "max_display": 25
}

def prepare_distribution_data(image_indices, logit_entropies, max_logit_gaps):
    values = []
    for idx, entropy, confidence in zip(image_indices, logit_entropies, max_logit_gaps):
        values.append({
            "img": idx,
            "entropy": round(float(entropy), 2),
            "confidence": round(float(confidence), 2)
        })

    return {
        "values": values
    }

def calculate_scores(
        values_unlearn, 
        values_retrain, 
        bins, 
        range_vals, 
        mode='entropy', 
        direction='unlearn'
    ):
    """
    Calculate attack scores by comparing the unlearn and retrain distributions.
    Returns a list of dictionaries each containing:
       - "threshold": the threshold value,
       - "fpr": false positive rate,
       - "fnr": false negative rate,
       - "attack_score": defined as (1 - forgetting_score)
    """
    if bins < 2 or range_vals[0] >= range_vals[1]:
        return []
    v_un = np.clip(values_unlearn, range_vals[0], range_vals[1])
    v_re = np.clip(values_retrain, range_vals[0], range_vals[1])
    thresholds = np.linspace(range_vals[0], range_vals[1], bins)

    if len(v_un) == 0 or len(v_re) == 0:
        return []

    scores = []
    DELTA = 1e-5
    EPS = 1e-10

    for thr_val in thresholds:
        # Depending on mode and the chosen direction, assign positives and negatives:
        if mode == 'entropy':
            if direction == 'unlearn':
                pos = v_un
                neg = v_re
            else:  # direction == 'retrain'
                pos = v_re
                neg = v_un
        else:  # mode == 'confidence'
            if direction == 'retrain':
                pos = v_re
                neg = v_un
            else:  # direction == 'unlearn'
                pos = v_un
                neg = v_re

        tpr = np.mean(pos >= thr_val)
        fpr = np.mean(neg >= thr_val)
        fnr = 1.0 - tpr

        if fpr == 0 and fnr == 0:
            # When no predictions cross the threshold, set forgetting score fq to 0
            fq = 0
        elif fpr >= (1 - DELTA) or fnr >= (1 - DELTA):
            fq = 1
        else:
            sfp = np.clip(fpr, EPS, 1 - DELTA - EPS)
            sfn = np.clip(fnr, EPS, 1 - DELTA - EPS)
            lg1 = np.log(1 - DELTA - sfp) - np.log(sfn)
            lg2 = np.log(1 - DELTA - sfn) - np.log(sfp)
            epsilon = max(0, min(lg1, lg2))
            fq = 2 ** (-epsilon)
        attack_score = 1 - fq
        scores.append({
            "threshold": round(float(thr_val), 3),
            "fpr": round(fpr, 3),
            "fnr": round(fnr, 3),
            "attack_score": round(attack_score, 3)
        })
    return scores

async def process_attack_metrics(
        model, 
        data_loader, 
        device, 
        forget_class=5, 
        t1=2.0,
        t2=1.0
    ):
    model.eval()
    logit_entropies = []
    max_logit_gaps = []
    image_indices = []
    
    with torch.no_grad():
        for batch_idx, data in enumerate(data_loader):
            images, labels = data[0].to(device), data[1].to(device)
            outputs = model(images)
            
            # Select only those outputs for the forget class
            forget_mask = (labels == forget_class)
            if not torch.any(forget_mask):
                continue
                
            local_indices = torch.where(forget_mask)[0]
            batch_start_idx = batch_idx * data_loader.batch_size
            original_indices = [data_loader.dataset.indices[batch_start_idx + idx.item()] 
                                for idx in local_indices]
            selected_outputs = outputs[forget_mask]

            # Compute entropy scores
            scaled_logits_entropy = selected_outputs / t1
            probs_entropy = F.softmax(scaled_logits_entropy, dim=1)
            entropies = entropy(probs_entropy.cpu().numpy().T)

            # Compute (logit) confidence scores 
            scaled_logits_conf = selected_outputs / t2
            probs_conf = F.softmax(scaled_logits_conf, dim=1).cpu().numpy()
            max_probs = np.max(probs_conf, axis=1)
            other_probs = 1 - max_probs
            confidence_scores = np.log(max_probs + 1e-45) - np.log(other_probs + 1e-45)
            
            image_indices.extend(original_indices)
            logit_entropies.extend(entropies)
            max_logit_gaps.extend(confidence_scores)
    
    distribution_data = prepare_distribution_data(image_indices, logit_entropies, max_logit_gaps)
    unlearn_data = {
        "attack": {
            "values": distribution_data["values"]
        }
    }
    with open(f"attack{forget_class}.json", "w") as f:
        json.dump(unlearn_data, f, indent=4)
    print("add")
    
    # Load the pre-saved retrain distribution from JSON.
    retrain_file = f"data/{forget_class}/a00{forget_class}.json"
    with open(retrain_file, "r") as f:
        retrain_raw = json.load(f)
        # Modified retrain JSON structure: 'attack' below 'values' is a list.
        retrain_vals = retrain_raw["attack"]["values"]
        retrain_data = {
            "values": {
                "img": [item["img"] for item in retrain_vals],
                "entropy": [item["entropy"] for item in retrain_vals],
                "confidence": [item["confidence"] for item in retrain_vals]
            }
        }
    
    # unlearn_data["attack"]["values"] is a list, so convert it to a dictionary for calculation.
    unlearn_vals_list = unlearn_data["attack"]["values"]
    unlearn_data_dict = {
        "img": [item["img"] for item in unlearn_vals_list],
        "entropy": [item["entropy"] for item in unlearn_vals_list],
        "confidence": [item["confidence"] for item in unlearn_vals_list]
    }
    
    # Use unlearn_data_dict for calculation.
    scores_ent_unlearn = calculate_scores(
        np.array(unlearn_data_dict["entropy"]),
        np.array(retrain_data["values"]["entropy"]),
        ENTROPY_CONFIG["bins"],
        ENTROPY_CONFIG["range"],
        mode="entropy",
        direction="unlearn"
    )
    scores_ent_retrain = calculate_scores(
        np.array(unlearn_data_dict["entropy"]),
        np.array(retrain_data["values"]["entropy"]),
        ENTROPY_CONFIG["bins"],
        ENTROPY_CONFIG["range"],
        mode="entropy",
        direction="retrain"
    )
    scores_conf_retrain = calculate_scores(
        np.array(unlearn_data_dict["confidence"]),
        np.array(retrain_data["values"]["confidence"]),
        CONFIDENCE_CONFIG["bins"],
        CONFIDENCE_CONFIG["range"],
        mode="confidence",
        direction="retrain"
    )
    scores_conf_unlearn = calculate_scores(
        np.array(unlearn_data_dict["confidence"]),
        np.array(retrain_data["values"]["confidence"]),
        CONFIDENCE_CONFIG["bins"],
        CONFIDENCE_CONFIG["range"],
        mode="confidence",
        direction="unlearn"
    )
    
    def get_best_attack(scores):
        if not scores:
            return 0
        best = max(scores, key=lambda s: s["attack_score"])
        return best["attack_score"]
    
    best_attack_ent_unlearn = get_best_attack(scores_ent_unlearn)
    best_attack_ent_retrain = get_best_attack(scores_ent_retrain)
    best_attack_conf_retrain = get_best_attack(scores_conf_retrain)
    best_attack_conf_unlearn = get_best_attack(scores_conf_unlearn)
    
    best_attack_entropy = max(best_attack_ent_unlearn, best_attack_ent_retrain)
    best_attack_confidence = max(best_attack_conf_retrain, best_attack_conf_unlearn)
    
    # Use the maximum value instead of the average
    best_overall_attack = max(best_attack_entropy, best_attack_confidence)
    final_fqs = 1 - best_overall_attack
    
    attack_results = {
        "entropy_above_unlearn": scores_ent_unlearn,
        "entropy_above_retrain": scores_ent_retrain,
        "confidence_above_retrain": scores_conf_retrain,
        "confidence_above_unlearn": scores_conf_unlearn
    }
    
    return distribution_data["values"], attack_results, round(final_fqs, 3)

# async def process_attack_metrics_face(
#         model, 
#         data_loader, 
#         device, 
#         forget_class=0, 
#         t1=2.0,
#         t2=1.0
#     ):
#     model.eval()
#     logit_entropies = []
#     max_logit_gaps = []
#     image_indices = []
    
#     with torch.no_grad():
#         for batch_idx, data in enumerate(data_loader):
#             images, labels = data[0].to(device), data[1].to(device)
#             outputs = model(images)
            
#             # Select only those outputs for the forget class
#             forget_mask = (labels == forget_class)
#             if not torch.any(forget_mask):
#                 continue
                
#             local_indices = torch.where(forget_mask)[0]
#             batch_start_idx = batch_idx * data_loader.batch_size
#             original_indices = [data_loader.dataset.indices[batch_start_idx + idx.item()] 
#                                 for idx in local_indices]
#             selected_outputs = outputs[forget_mask]

#             # Compute entropy scores
#             scaled_logits_entropy = selected_outputs / t1
#             probs_entropy = F.softmax(scaled_logits_entropy, dim=1)
#             entropies = entropy(probs_entropy.cpu().numpy().T)

#             # Compute (logit) confidence scores 
#             scaled_logits_conf = selected_outputs / t2
#             probs_conf = F.softmax(scaled_logits_conf, dim=1).cpu().numpy()
#             max_probs = np.max(probs_conf, axis=1)
#             other_probs = 1 - max_probs
#             confidence_scores = np.log(max_probs + 1e-45) - np.log(other_probs + 1e-45)
            
#             image_indices.extend(original_indices)
#             logit_entropies.extend(entropies)
#             max_logit_gaps.extend(confidence_scores)
    
#     distribution_data = prepare_distribution_data(image_indices, logit_entropies, max_logit_gaps)
#     unlearn_data = {
#         "attack": {
#             "values": distribution_data["values"]
#         }
#     }
#     with open(f"face_attack{forget_class}.json", "w") as f:
#         json.dump(unlearn_data, f, indent=4)
#     print("Face attack data saved")
    
#     # Load the pre-saved retrain distribution from JSON for face dataset
#     retrain_file = f"data/face/{forget_class}/a00{forget_class}.json"
#     with open(retrain_file, "r") as f:
#         retrain_raw = json.load(f)
#         # Modified retrain JSON structure: 'attack' below 'values' is a list.
#         retrain_vals = retrain_raw["attack"]["values"]
#         retrain_data = {
#             "values": {
#                 "img": [item["img"] for item in retrain_vals],
#                 "entropy": [item["entropy"] for item in retrain_vals],
#                 "confidence": [item["confidence"] for item in retrain_vals]
#             }
#         }
    
#     # unlearn_data["attack"]["values"] is a list, so convert it to a dictionary for calculation.
#     unlearn_vals_list = unlearn_data["attack"]["values"]
#     unlearn_data_dict = {
#         "img": [item["img"] for item in unlearn_vals_list],
#         "entropy": [item["entropy"] for item in unlearn_vals_list],
#         "confidence": [item["confidence"] for item in unlearn_vals_list]
#     }
    
#     # Use unlearn_data_dict for calculation.
#     scores_ent_unlearn = calculate_scores(
#         np.array(unlearn_data_dict["entropy"]),
#         np.array(retrain_data["values"]["entropy"]),
#         ENTROPY_CONFIG["bins"],
#         ENTROPY_CONFIG["range"],
#         mode="entropy",
#         direction="unlearn"
#     )
#     scores_ent_retrain = calculate_scores(
#         np.array(unlearn_data_dict["entropy"]),
#         np.array(retrain_data["values"]["entropy"]),
#         ENTROPY_CONFIG["bins"],
#         ENTROPY_CONFIG["range"],
#         mode="entropy",
#         direction="retrain"
#     )
#     scores_conf_retrain = calculate_scores(
#         np.array(unlearn_data_dict["confidence"]),
#         np.array(retrain_data["values"]["confidence"]),
#         CONFIDENCE_CONFIG["bins"],
#         CONFIDENCE_CONFIG["range"],
#         mode="confidence",
#         direction="retrain"
#     )
#     scores_conf_unlearn = calculate_scores(
#         np.array(unlearn_data_dict["confidence"]),
#         np.array(retrain_data["values"]["confidence"]),
#         CONFIDENCE_CONFIG["bins"],
#         CONFIDENCE_CONFIG["range"],
#         mode="confidence",
#         direction="unlearn"
#     )
    
#     def get_best_attack(scores):
#         if not scores:
#             return 0
#         best = max(scores, key=lambda s: s["attack_score"])
#         return best["attack_score"]
    
#     best_attack_ent_unlearn = get_best_attack(scores_ent_unlearn)
#     best_attack_ent_retrain = get_best_attack(scores_ent_retrain)
#     best_attack_conf_retrain = get_best_attack(scores_conf_retrain)
#     best_attack_conf_unlearn = get_best_attack(scores_conf_unlearn)
    
#     best_attack_entropy = max(best_attack_ent_unlearn, best_attack_ent_retrain)
#     best_attack_confidence = max(best_attack_conf_retrain, best_attack_conf_unlearn)
    
#     # Use the maximum value instead of the average
#     best_overall_attack = max(best_attack_entropy, best_attack_confidence)
#     final_fqs = 1 - best_overall_attack
    
#     attack_results = {
#         "entropy_above_unlearn": scores_ent_unlearn,
#         "entropy_above_retrain": scores_ent_retrain,
#         "confidence_above_retrain": scores_conf_retrain,
#         "confidence_above_unlearn": scores_conf_unlearn
#     }
    
#     return distribution_data["values"], attack_results, round(final_fqs, 3)