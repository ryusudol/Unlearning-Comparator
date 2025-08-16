"""
Utility functions for layer freezing and reinitialization in neural networks.
Supports ResNet18 architecture used in machine unlearning experiments.
"""
import torch
import torch.nn as nn


# ResNet18 layer structure definition for CIFAR-10
RESNET18_LAYER_GROUPS = [
    # Group 0: Initial layers (1,856 parameters)
    [('conv1', 'conv1'), ('bn1', 'bn1')],
    
    # Group 1: Layer1 Block 0 (73,984 parameters)
    [('layer1.0.conv1', 'layer1.0.conv1'), ('layer1.0.bn1', 'layer1.0.bn1'),
     ('layer1.0.conv2', 'layer1.0.conv2'), ('layer1.0.bn2', 'layer1.0.bn2')],
    
    # Group 2: Layer1 Block 1 (73,984 parameters)
    [('layer1.1.conv1', 'layer1.1.conv1'), ('layer1.1.bn1', 'layer1.1.bn1'),
     ('layer1.1.conv2', 'layer1.1.conv2'), ('layer1.1.bn2', 'layer1.1.bn2')],
    
    # Group 3: Layer2 Block 0 with downsample (230,144 parameters)
    [('layer2.0.conv1', 'layer2.0.conv1'), ('layer2.0.bn1', 'layer2.0.bn1'),
     ('layer2.0.conv2', 'layer2.0.conv2'), ('layer2.0.bn2', 'layer2.0.bn2'),
     ('layer2.0.downsample.0', 'layer2.0.downsample.0'), ('layer2.0.downsample.1', 'layer2.0.downsample.1')],
    
    # Group 4: Layer2 Block 1 (295,424 parameters)
    [('layer2.1.conv1', 'layer2.1.conv1'), ('layer2.1.bn1', 'layer2.1.bn1'),
     ('layer2.1.conv2', 'layer2.1.conv2'), ('layer2.1.bn2', 'layer2.1.bn2')],
    
    # Group 5: Layer3 Block 0 with downsample (919,040 parameters)
    [('layer3.0.conv1', 'layer3.0.conv1'), ('layer3.0.bn1', 'layer3.0.bn1'),
     ('layer3.0.conv2', 'layer3.0.conv2'), ('layer3.0.bn2', 'layer3.0.bn2'),
     ('layer3.0.downsample.0', 'layer3.0.downsample.0'), ('layer3.0.downsample.1', 'layer3.0.downsample.1')],
    
    # Group 6: Layer3 Block 1 (1,180,672 parameters)
    [('layer3.1.conv1', 'layer3.1.conv1'), ('layer3.1.bn1', 'layer3.1.bn1'),
     ('layer3.1.conv2', 'layer3.1.conv2'), ('layer3.1.bn2', 'layer3.1.bn2')],
    
    # Group 7: Layer4 Block 0 with downsample (3,673,088 parameters)
    [('layer4.0.conv1', 'layer4.0.conv1'), ('layer4.0.bn1', 'layer4.0.bn1'),
     ('layer4.0.conv2', 'layer4.0.conv2'), ('layer4.0.bn2', 'layer4.0.bn2'),
     ('layer4.0.downsample.0', 'layer4.0.downsample.0'), ('layer4.0.downsample.1', 'layer4.0.downsample.1')],
    
    # Group 8: Layer4 Block 1 (4,720,640 parameters)
    [('layer4.1.conv1', 'layer4.1.conv1'), ('layer4.1.bn1', 'layer4.1.bn1'),
     ('layer4.1.conv2', 'layer4.1.conv2'), ('layer4.1.bn2', 'layer4.1.bn2')],
    
    # Group 9: Final classification layer (5,130 parameters)
    [('fc', 'fc')]
]


def get_layer_module_by_name(model, layer_name):
    """
    Get a module from the model by its name (dot notation).
    
    Args:
        model: PyTorch model
        layer_name: String name like 'layer1.0.conv1' or 'fc'
    
    Returns:
        The module at that path
    """
    module = model
    for part in layer_name.split('.'):
        if part.isdigit():
            module = module[int(part)]
        else:
            module = getattr(module, part)
    return module


def get_resnet18_layer_groups(model):
    """
    Get ResNet18 layer groups with actual module references.
    
    Args:
        model: ResNet18 model instance
    
    Returns:
        List of layer groups, each containing (name, module) tuples
    """
    layer_groups = []
    
    for group in RESNET18_LAYER_GROUPS:
        group_modules = []
        for layer_name, layer_path in group:
            try:
                module = get_layer_module_by_name(model, layer_path)
                group_modules.append((layer_name, module))
            except (AttributeError, IndexError) as e:
                print(f"Warning: Could not access layer {layer_name} ({layer_path}): {e}")
                continue
        
        if group_modules:  # Only add non-empty groups
            layer_groups.append(group_modules)
    
    return layer_groups


def freeze_last_k_layer_groups(model, k):
    """
    Freeze the last k layer groups in a ResNet18 model.
    
    Args:
        model: ResNet18 model
        k: Number of layer groups to freeze from the end (0-9)
    
    Returns:
        int: Total number of parameters frozen
    """
    if k <= 0:
        return 0
    
    layer_groups = get_resnet18_layer_groups(model)
    total_frozen_params = 0
    
    # Freeze last k layer groups
    start_idx = max(0, len(layer_groups) - k)
    for i in range(start_idx, len(layer_groups)):
        for layer_name, layer_module in layer_groups[i]:
            for param in layer_module.parameters():
                param.requires_grad = False
                total_frozen_params += param.numel()
    
    print(f"Frozen last {k} layer groups ({total_frozen_params:,} parameters)")
    return total_frozen_params


def reinitialize_last_k_layer_groups(model, k):
    """
    Reinitialize the last k layer groups in a ResNet18 model.
    
    Args:
        model: ResNet18 model
        k: Number of layer groups to reinitialize from the end (0-9)
    
    Returns:
        int: Total number of parameters reinitialized
    """
    if k <= 0:
        return 0
    
    layer_groups = get_resnet18_layer_groups(model)
    total_reinit_params = 0
    
    # Reinitialize last k layer groups
    start_idx = max(0, len(layer_groups) - k)
    for i in range(start_idx, len(layer_groups)):
        for layer_name, layer_module in layer_groups[i]:
            if hasattr(layer_module, 'reset_parameters'):
                layer_module.reset_parameters()
            else:
                # Manual initialization for modules without reset_parameters
                for param in layer_module.parameters():
                    if param.dim() > 1:
                        nn.init.kaiming_normal_(param)
                    else:
                        nn.init.zeros_(param)
            
            total_reinit_params += sum(p.numel() for p in layer_module.parameters())
    
    print(f"Reinitialized last {k} layer groups ({total_reinit_params:,} parameters)")
    return total_reinit_params


def freeze_first_k_layer_groups(model, k):
    """
    Freeze the first k layer groups in a ResNet18 model.
    
    Args:
        model: ResNet18 model
        k: Number of layer groups to freeze from the beginning (0-9)
    
    Returns:
        int: Total number of parameters frozen
    """
    if k <= 0:
        return 0
    
    layer_groups = get_resnet18_layer_groups(model)
    total_frozen_params = 0
    
    # Freeze first k layer groups
    frozen_layers = []
    for i in range(min(k, len(layer_groups))):
        for layer_name, layer_module in layer_groups[i]:
            frozen_layers.append(layer_name)
            for param in layer_module.parameters():
                param.requires_grad = False
                total_frozen_params += param.numel()
    
    print(f"Frozen first {k} layer groups ({total_frozen_params:,} parameters)")
    print(f"Frozen layers: {frozen_layers}")
    
    # Verify freeze worked
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Verification: {trainable_params:,}/{total_params:,} parameters trainable")
    
    return total_frozen_params


def apply_layer_modifications(model, freeze_first_k=0, freeze_last_k=0, reinit_last_k=0):
    """
    Apply layer freezing and reinitialization to a model.
    
    Args:
        model: ResNet18 model
        freeze_first_k: Number of first layer groups to freeze (0-10)
        freeze_last_k: Number of last layer groups to freeze (0-10)
        reinit_last_k: Number of last layer groups to reinitialize (0-10)
    
    Returns:
        dict: Statistics about modifications applied
    """
    stats = {
        'frozen_params': 0,
        'reinitialized_params': 0,
        'frozen_first_groups': freeze_first_k,
        'frozen_last_groups': freeze_last_k,
        'reinitialized_groups': reinit_last_k,
        'frozen_layers': [],
        'reinitialized_layers': []
    }
    
    # Apply reinitialization first, then freezing
    if reinit_last_k > 0:
        layer_groups = get_resnet18_layer_groups(model)
        start_idx = max(0, len(layer_groups) - reinit_last_k)
        for i in range(start_idx, len(layer_groups)):
            group_name = f"Group {i}: {get_layer_group_info()[i]['name']}"
            stats['reinitialized_layers'].append(group_name)
        stats['reinitialized_params'] = reinitialize_last_k_layer_groups(model, reinit_last_k)
    
    # Apply freezing - first k groups
    if freeze_first_k > 0:
        layer_groups = get_resnet18_layer_groups(model)
        for i in range(min(freeze_first_k, len(layer_groups))):
            group_name = f"Group {i}: {get_layer_group_info()[i]['name']}"
            stats['frozen_layers'].append(group_name)
        stats['frozen_params'] += freeze_first_k_layer_groups(model, freeze_first_k)
    
    # Apply freezing - last k groups  
    if freeze_last_k > 0:
        layer_groups = get_resnet18_layer_groups(model)
        start_idx = max(0, len(layer_groups) - freeze_last_k)
        for i in range(start_idx, len(layer_groups)):
            group_name = f"Group {i}: {get_layer_group_info()[i]['name']}"
            # Avoid duplicates if already in frozen_layers
            if group_name not in stats['frozen_layers']:
                stats['frozen_layers'].append(group_name)
        stats['frozen_params'] += freeze_last_k_layer_groups(model, freeze_last_k)
    
    return stats


def get_layer_group_info():
    """
    Get information about ResNet18 layer groups.
    
    Returns:
        dict: Information about each layer group
    """
    group_info = {
        0: {'name': 'Initial layers (conv1, bn1)', 'approx_params': 1856},
        1: {'name': 'Layer1 Block 0', 'approx_params': 73984},
        2: {'name': 'Layer1 Block 1', 'approx_params': 73984},
        3: {'name': 'Layer2 Block 0 (with downsample)', 'approx_params': 230144},
        4: {'name': 'Layer2 Block 1', 'approx_params': 295424},
        5: {'name': 'Layer3 Block 0 (with downsample)', 'approx_params': 919040},
        6: {'name': 'Layer3 Block 1', 'approx_params': 1180672},
        7: {'name': 'Layer4 Block 0 (with downsample)', 'approx_params': 3673088},
        8: {'name': 'Layer4 Block 1', 'approx_params': 4720640},
        9: {'name': 'Final layer (fc)', 'approx_params': 5130}
    }
    
    return group_info