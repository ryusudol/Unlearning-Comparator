"""
This package contains utility functions and modules.
"""

from .data_loader import (
	load_cifar10_data,
	get_data_loaders,
	get_face_data_loaders
)
from .evaluation import (
	get_layer_activations_and_predictions,
	get_layer_activations_and_predictions_face,
	evaluate_model,
	evaluate_model_with_distributions,
	calculate_cka_similarity,
	calculate_cka_similarity_face
)
from .helpers import (
	set_seed, 
	save_model, 
	format_distribution,
	compress_prob_array
)
from .visualization import (
	compute_umap_embedding,
	compute_umap_embedding_face
)


__all__ = [
    'load_cifar10_data',
    'get_data_loaders',
    'get_face_data_loaders',
    'get_layer_activations_and_predictions',
    'get_layer_activations_and_predictions_face',
    'evaluate_model',
    'evaluate_model_with_distributions',
    'calculate_cka_similarity',
    'calculate_cka_similarity_face',
    'set_seed',
    'save_model',
    'compute_umap_embedding',
    'compute_umap_embedding_face',
    'format_distribution',
    'compress_prob_array'
]