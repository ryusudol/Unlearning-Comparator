# from datetime import datetime
import os
import time

# import matplotlib.pyplot as plt
# import numpy as np
from umap import UMAP

from app.config import (
    UMAP_N_NEIGHBORS,
    UMAP_MIN_DIST,
    UMAP_INIT,
    UMAP_N_JOBS
)

async def compute_umap_embedding(
    activation,
    labels,
    forget_class=-1,
    forget_labels=None,
    save_dir='umap_visualizations'
):
    umap_embedding = []

    class_names = [
        'airplane', 
        'automobile', 
        'bird', 
        'cat', 
        'deer', 
        'dog', 
        'frog', 
        'horse', 
        'ship', 
        'truck'
    ]
    if(forget_class != -1):
        class_names[forget_class] += " (forget)"

    # colors = plt.cm.tab10(np.linspace(0, 1, 10))
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    umap = UMAP(n_components=2, 
                n_neighbors=UMAP_N_NEIGHBORS,
                min_dist=UMAP_MIN_DIST,
                init=UMAP_INIT,
                n_jobs=UMAP_N_JOBS)
    print(f"UMAP start!")
    start_time = time.time()
    embedding = umap.fit_transform(activation)
    print(f"UMAP done! Time taken: {time.time() - start_time:.2f}s")

    umap_embedding = embedding
    # plt.figure(figsize=(12, 11))
    
    # Plot non-forget points
    # if forget_labels is not None:
    #     non_forget_mask = ~forget_labels
    #     scatter = plt.scatter(
    #         embedding[non_forget_mask, 0], 
    #         embedding[non_forget_mask, 1], 
    #         c=labels[non_forget_mask], 
    #         cmap='tab10', 
    #         s=20, 
    #         alpha=0.7,
    #         vmin=0, 
    #         vmax=9
    #     )
        
    #     # Plot forget points with 'x' marker
    #     forget_mask = forget_labels
    #     plt.scatter(
    #         embedding[forget_mask, 0], 
    #         embedding[forget_mask, 1], 
    #         c=labels[forget_mask], 
    #         cmap='tab10', 
    #         s=50, 
    #         alpha=0.7, 
    #         marker='x', 
    #         linewidths=2.5,
    #         vmin=0, 
    #         vmax=9
    #     )
    # else:
    #     scatter = plt.scatter(
    #         embedding[:, 0], 
    #         embedding[:, 1], 
    #         c=labels, 
    #         cmap='tab10', 
    #         s=20, 
    #         alpha=0.7
    #     )
    
    # legend_elements = [
    #     plt.Line2D(
    #         [0], [0],
    #         marker='o',
    #         color='w',
    #         label=class_names[i],
    #         markerfacecolor=colors[i],
    #         markersize=10
    #     ) for i in range(10)
    # ]
    
    # if forget_labels is not None:
    #     legend_elements.append(
    #         plt.Line2D(
    #             [0], [0],
    #             marker='x',
    #             color='k',
    #             label='Forget Data',
    #             markerfacecolor='k',
    #             markersize=10,
    #             markeredgewidth=3,
    #             linestyle='None',
    #             markeredgecolor='k'
    #         )
    #     )
    
    # plt.legend(
    #     handles=legend_elements,
    #     title="Predicted Classes",
    #     loc='upper right',
    #     bbox_to_anchor=(0.99, 0.99),
    #     fontsize='x-large',
    #     title_fontsize='x-large'
    # )
    # plt.axis('off')
    # plt.text(
    #     0.5, -0.05, f'Last Layer', 
    #     fontsize=24, 
    #     ha='center', 
    #     va='bottom', 
    #     transform=plt.gca().transAxes
    # )
    # plt.tight_layout()

    # timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    # filename = f'{timestamp}_umap_layer_last.svg'
    # filepath = os.path.join(save_dir, filename)
    
    # plt.savefig(
    #     filepath, 
    #     format='svg', 
    #     dpi=300, 
    #     bbox_inches='tight', 
    #     pad_inches=0.1
    # )
        
    print("\nUMAP embeddings computation and saving completed!")
    return umap_embedding

async def compute_umap_embedding_face(
    activation,
    labels,
    forget_class=-1,
    forget_labels=None,
    save_dir='umap_visualizations'
):
    umap_embedding = []

    class_names = [
        'Go Ara',
        'Gong Yoo',
        'Kang Dong-won',
        'Kim Tae-hoi',
        'Kwon Yuri',
        'Lee Jung-jae',
        'Lee Young-ae',
        'Ma Dong-seok',
        'Park Bo-young',
        'Won Bin'
    ]
    if(forget_class != -1):
        class_names[forget_class] += " (forget)"

    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    umap = UMAP(n_components=2, 
                n_neighbors=UMAP_N_NEIGHBORS,
                min_dist=UMAP_MIN_DIST,
                init=UMAP_INIT,
                n_jobs=UMAP_N_JOBS)
    print(f"UMAP start!")
    start_time = time.time()
    embedding = umap.fit_transform(activation)
    print(f"UMAP done! Time taken: {time.time() - start_time:.2f}s")

    umap_embedding = embedding

    print("\nUMAP embeddings computation and saving completed!")
    return umap_embedding