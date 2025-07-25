import os
import time

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