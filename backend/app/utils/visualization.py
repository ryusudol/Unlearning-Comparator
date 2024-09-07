import numpy as np
import matplotlib.pyplot as plt
from umap import UMAP
import os
from datetime import datetime
from app.config.settings import UMAP_N_NEIGHBORS, UMAP_MIN_DIST, UMAP_INIT, UMAP_RANDOM_STATE, UMAP_N_JOBS

async def compute_umap_embeddings(activations, 
                                  labels, 
                                  forget_class=-1,
                                  forget_labels=None, 
                                  save_dir='umap_visualizations'):
    umap_embeddings = {}
    svg_files = {}

    class_names = ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck']
    if(forget_class != -1):
        class_names[forget_class] += " (forget)"

    colors = plt.cm.tab10(np.linspace(0, 1, 10))
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    for i, act in enumerate(activations):
        umap = UMAP(n_components=2, 
                    n_neighbors=UMAP_N_NEIGHBORS,
                    min_dist=UMAP_MIN_DIST,
                    init=UMAP_INIT,
                    # random_state=UMAP_RANDOM_STATE,
                    n_jobs=UMAP_N_JOBS)
        embedding = umap.fit_transform(act.reshape(act.shape[0], -1))
        umap_embeddings[i+1] = embedding

        plt.figure(figsize=(12, 11))
        
        # Plot non-forget points
        if forget_labels is not None:
            non_forget_mask = ~forget_labels
            scatter = plt.scatter(embedding[non_forget_mask, 0], embedding[non_forget_mask, 1], 
                                  c=labels[non_forget_mask], cmap='tab10', s=20, alpha=0.7,
                                  vmin=0, vmax=9)
            
            # Plot forget points with 'x' marker
            forget_mask = forget_labels
            plt.scatter(embedding[forget_mask, 0], embedding[forget_mask, 1], 
                        c=labels[forget_mask], cmap='tab10', s=50, alpha=0.7, marker='x', linewidths=2.5,
                        vmin=0, vmax=9)
        else:
            scatter = plt.scatter(embedding[:, 0], embedding[:, 1], c=labels, cmap='tab10', s=20, alpha=0.7)
        
        legend_elements = [plt.Line2D([0], [0], marker='o', color='w', label=class_names[i], 
                           markerfacecolor=colors[i], markersize=10) for i in range(10)]
        
        if forget_labels is not None:
            legend_elements.append(plt.Line2D([0], [0], marker='x', color='k', label='Forget Data', 
                       markerfacecolor='k', markersize=10, markeredgewidth=3,
                       linestyle='None', markeredgecolor='k'))
        
        plt.legend(handles=legend_elements, title="Predicted Classes", loc='upper right', 
                   bbox_to_anchor=(0.99, 0.99), fontsize='x-large', title_fontsize='x-large')
        plt.axis('off')
        plt.text(0.5, -0.05, f'Layer {i+1}', 
                 fontsize=24, ha='center', va='bottom', transform=plt.gca().transAxes)

        plt.tight_layout()
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f'{timestamp}_umap_layer_{i+1}.svg'
        filepath = os.path.join(save_dir, filename)
        
        plt.savefig(filepath, format='svg', dpi=300, bbox_inches='tight', pad_inches=0.1)
        

        with open(filepath, 'rb') as f:
            svg_files[i+1] = f.read()
        
    print("\nUMAP embeddings computation and saving completed!")
    return umap_embeddings, svg_files