import torch
import numpy as np
import torch.nn.functional as F
import matplotlib.pyplot as plt
from scipy.stats import entropy
import json
from datetime import datetime

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

def visualize_distributions(logit_entropies, max_logit_gaps, forget_class, timestamp):
    """
    Visualizes the distributions of logit entropies and max logit gaps.
    Uses the full set of provided data (assumed to be 200 samples).
    """
    def make_break_marks(ax, y_pos):
        kwargs = dict(transform=ax.transAxes, color='k', clip_on=False)
        dx, dy = 0.01, 0.01
        ax.plot((-dx, +dx), (y_pos-dy, y_pos+dy), **kwargs)
        ax.plot((-dx, +dx), (y_pos-2*dy, y_pos+2*dy), **kwargs)

    plt.figure(figsize=(13, 5))
    
    # Left plot (Entropy)
    plt.subplot(1, 2, 1)
    ax1 = plt.gca()
    counts, bin_edges = np.histogram(logit_entropies, bins=50, range=(0.0, 2.5))
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2

    for x, count in zip(bin_centers, counts):
        if count <= 40:
            for y in range(count):
                plt.plot(x, y, 'o', color='gray', alpha=0.7, markersize=5)
        else:
            for y in range(39):
                plt.plot(x, y, 'o', color='gray', alpha=0.7, markersize=5)
            plt.plot(x, 42, 'o', color='gray', alpha=0.7, markersize=5)
    
    make_break_marks(ax1, 0.9)
    plt.title(f'Class {forget_class} Logit Entropy Distribution (200 samples)')
    plt.xlabel('Entropy')
    plt.ylabel('Count')
    plt.gca().yaxis.set_major_locator(plt.MultipleLocator(5))
    plt.xlim(0.0, 2.5)
    plt.ylim(-0.5, 43)
    plt.grid(True, alpha=0.2)
    
    # Right plot (Confidence)
    plt.subplot(1, 2, 2)
    ax2 = plt.gca()
    counts, bin_edges = np.histogram(max_logit_gaps, bins=50, range=(-2.5, 10.0))
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2

    for x, count in zip(bin_centers, counts):
        if count <= 40:
            for y in range(count):
                plt.plot(x, y, 'o', color='gray', alpha=0.7, markersize=5)
        else:
            for y in range(39):
                plt.plot(x, y, 'o', color='gray', alpha=0.7, markersize=5)
            plt.plot(x, 42, 'o', color='gray', alpha=0.7, markersize=5)
    
    make_break_marks(ax2, 0.9)
    plt.title(f'Class {forget_class} Max Logit Confidence Distribution (200 samples)')
    plt.xlabel('Log Confidence Score')
    plt.ylabel('Count')
    plt.gca().yaxis.set_major_locator(plt.MultipleLocator(5))
    plt.xlim([-2.5, 10.0])
    plt.ylim(-0.5, 43)
    plt.grid(True, alpha=0.2)
    
    plt.tight_layout()
    plt.savefig(f'attack/{forget_class}/class_{forget_class}_entropy_{timestamp}.png', dpi=300, bbox_inches='tight')
    plt.close()

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
            
            # 배치에서 forget_class에 해당하는 인덱스들을 한 번에 찾기
            forget_mask = (labels == forget_class)
            if not torch.any(forget_mask):
                continue
                
            # 배치 내의 로컬 인덱스
            local_indices = torch.where(forget_mask)[0]
            
            # 원본 데이터셋 인덱스 계산
            batch_start_idx = batch_idx * data_loader.batch_size
            original_indices = [data_loader.dataset.indices[batch_start_idx + idx.item()] 
                              for idx in local_indices]
            
            # 해당하는 출력값들만 처리
            selected_outputs = outputs[forget_mask]
            
            # 엔트로피 계산 (배치 처리)
            scaled_logits_entropy = selected_outputs / t1
            probs_entropy = F.softmax(scaled_logits_entropy, dim=1)
            entropies = entropy(probs_entropy.cpu().numpy().T)
            
            # 신뢰도 계산 (배치 처리)
            scaled_logits_conf = selected_outputs / t2
            probs_conf = F.softmax(scaled_logits_conf, dim=1).cpu().numpy()
            max_probs = np.max(probs_conf, axis=1)
            other_probs = 1 - max_probs
            confidence_scores = np.log(max_probs + 1e-45) - np.log(other_probs + 1e-45)
            
            image_indices.extend(original_indices)
            logit_entropies.extend(entropies)
            max_logit_gaps.extend(confidence_scores)
    
    distribution_data = prepare_distribution_data(image_indices, logit_entropies, max_logit_gaps)
    timestamp = datetime.now().strftime("%m%d_%H%M%S")
    
    json_filename = f'attack/{forget_class}/class_{forget_class}_Retrain_{timestamp}.json'
    with open(json_filename, 'w') as f:
        json.dump(distribution_data, f, indent=4)
    
    visualize_distributions(logit_entropies, max_logit_gaps, forget_class, timestamp)
    
    values = distribution_data["values"]
    attack_results = 1 # TODO: 공격 결과 추가

    return values, attack_results