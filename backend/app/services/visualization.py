import numpy as np
import matplotlib.pyplot as plt
from umap import UMAP
import os
from datetime import datetime
from app.config.settings import UMAP_N_NEIGHBORS, UMAP_MIN_DIST, UMAP_INIT, UMAP_RANDOM_STATE, UMAP_N_JOBS

def compute_umap_embeddings(activations, labels, save_dir='umap_visualizations'):
    umap_embeddings = {}
    svg_files = {}
    
    class_names = ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck']
    colors = plt.cm.tab10(np.linspace(0, 1, 10))
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
        
    for i, act in enumerate(activations):
        umap = UMAP(n_components=2, 
                    n_neighbors=UMAP_N_NEIGHBORS,
                    min_dist=UMAP_MIN_DIST,
                    init=UMAP_INIT,
                    random_state=UMAP_RANDOM_STATE,
                    n_jobs=UMAP_N_JOBS)
        embedding = umap.fit_transform(act.reshape(act.shape[0], -1))
        umap_embeddings[i+1] = embedding
        
        plt.figure(figsize=(12, 11))  # 높이를 약간 증가시켜 제목을 위한 공간 확보
        scatter = plt.scatter(embedding[:, 0], embedding[:, 1], c=labels, cmap='tab10', s=20, alpha=0.7)
        
        legend_elements = [plt.Line2D([0], [0], marker='o', color='w', label=class_names[i], 
                           markerfacecolor=colors[i], markersize=10) for i in range(10)]
        
        # 범례 위치를 그림 내부 오른쪽 상단으로 변경
        plt.legend(handles=legend_elements, title="Classes", loc='upper right', 
                   bbox_to_anchor=(0.98, 0.98), fontsize='large', title_fontsize='large')

        # 축과 tick 제거
        plt.axis('off')
        
        # 제목을 그래프 하단에 추가
        plt.text(0.5, -0.05, f'Layer {i+1}', 
                 fontsize=24, ha='center', va='bottom', transform=plt.gca().transAxes)

        plt.tight_layout()
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f'{timestamp}_umap_layer_{i+1}.svg'
        filepath = os.path.join(save_dir, filename)
        
        plt.savefig(filepath, format='svg', dpi=300, bbox_inches='tight', pad_inches=0.1)
        plt.close()
        
        with open(filepath, 'rb') as f:
            svg_files[i+1] = f.read()
    
    print("\nUMAP embeddings computation and saving completed!")
    return umap_embeddings, svg_files