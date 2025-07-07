# 🧹 Machine Unlearning Comparator
*Under review*  

Machine Unlearning Comparator is a **web-based visual-analytics toolkit** for **seeing, testing, and comparing** how unlearning methods balance the three MU principles—**accuracy, efficiency, and privacy**—from class- to layer-level detail.
![Unlearning Comparator Workflow](image/fig_workflow.png)
---

## 🔗 Demo & Video

- **Live demo** → [Machine Unlearning Comparator](https://gnueaj.github.io/Machine-Unlearning-Comparator/)  
- **5-min overview** → [YouTube](https://youtu.be/yAyAYp2msDk?si=Q-8IgVlrk8uSBceu)
  
---

## 🚀 Why use the Comparator?

| Pain Point | How the Comparator helps |
|------------|--------------------------|
| Fragmented evaluations | **One workflow — Build → Screen → Contrast → Attack** — keeps every run tidy and repeatable. |
| Raw numbers hide behavior | Combine metrics & visuals: **Class-wise Accuracy chart, Prediction Matrix, Embedding Space, Layer-wise Similarity chart**. |
| “Did it really forget?” | Built-in **membership-inference attacks** and an aggregated **privacy score** reveal lingering signals. |
| Baselines vary by paper | Compare against **standard baselines** or plug in your own method via two Python hooks. |

---

## ✨ Key Features

### Multi-Level Comparison
* **Metrics View** – follow Unlearning/Retaining Accuracy, Run Time (RT), and the worst-case privacy score in one glance.  
* **Embedding Space** – twin UMAPs show how feature clusters shift after unlearning.  
* **Layer-wise Similarity** – CKA curves pinpoint layers that still encode the forget class.  
* **Attack Simulation** – sweep thresholds, flag high-risk samples, and inspect logits interactively.

### Built-in Baselines
| Method | Idea (aligned with the paper) |
|--------|------------------------------|
| **Fine-Tuning (FT)** | Continue training on the **retain set** only, leveraging catastrophic forgetting of the forget set. |
| **Gradient Ascent (GA)** | Update weights to **maximize loss** on the forget set, actively “unteaching” it. |
| **Random Labeling (RL)** | Assign **random labels** to the forget set then fine-tune, so the model treats those samples as noise. |

### Custom Method API
Add your algorithm, register it, and the UI will automatically expose metrics, embeddings, and privacy attacks.

---

## ⚡ Quick Start

### Backend
```bash
# 1 Install deps & enter env
hatch shell
# 2 Run the API
hatch run start
```

### Frontend
```bash
# 1 Install deps
pnpm install
# 2 Launch the UI
pnpm start
```

---

## Related Resources
- **ResNet-18 CIFAR-10 MU checkpoints** → <https://huggingface.co/jaeunglee/resnet18-cifar10-unlearning>
- **ResNet-18 FashionMNIST MU checkpoints** → <https://huggingface.co/Yurim0507/resnet18-fashionmnist-unlearning>
- **ViT-Base CIFAR-10 MU checkpoints** → <https://huggingface.co/Yurim0507/vit-base-16-cifar10-unlearning>



