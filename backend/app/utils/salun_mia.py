import numpy as np
import torch
import torch.nn.functional as F
from sklearn.svm import SVC
from typing import Tuple, Dict


def entropy(p, dim=-1, keepdim=False):
    """Calculate entropy of probability distribution."""
    return -torch.where(p > 0, p * p.log(), p.new([0.0])).sum(dim=dim, keepdim=keepdim)




def collect_prob(data_loader, model, device, target_class=None):
    """Collect probability predictions from model."""
    from app.utils.evaluation import model_eval_mode
    
    if data_loader is None:
        return torch.zeros([0, 10]), torch.zeros([0])

    prob = []
    targets = []

    with model_eval_mode(model):
        with torch.no_grad():
            for batch_idx, (data, target) in enumerate(data_loader):
                data, target = data.to(device), target.to(device)
                
                # Filter by target class if specified
                if target_class is not None:
                    mask = (target == target_class)
                    if not torch.any(mask):
                        continue
                    data = data[mask]
                    target = target[mask]
                
                output = model(data)
                prob.append(F.softmax(output, dim=-1).data)
                targets.append(target)

    if len(prob) == 0:
        return torch.zeros([0, 10]), torch.zeros([0])
    
    return torch.cat(prob), torch.cat(targets)


def SVC_fit_predict(shadow_train, shadow_test, target_train, target_test):
    """Train SVM classifier and predict membership."""
    n_shadow_train = shadow_train.shape[0]
    n_shadow_test = shadow_test.shape[0]
    n_target_train = target_train.shape[0] if target_train is not None else 0
    n_target_test = target_test.shape[0] if target_test is not None else 0

    if n_shadow_train == 0 and n_shadow_test == 0:
        return 0.5  # Random guess if no shadow data
    
    # Prepare shadow training data
    X_shadow = torch.cat([shadow_train, shadow_test]).cpu().numpy()
    if len(X_shadow.shape) > 2:
        X_shadow = X_shadow.reshape(n_shadow_train + n_shadow_test, -1)
    
    Y_shadow = np.concatenate([np.ones(n_shadow_train), np.zeros(n_shadow_test)])

    # Train SVM classifier (linear kernel for speed)
    clf = SVC(C=3, kernel="linear")
    clf.fit(X_shadow, Y_shadow)

    accs = []

    # Predict on target training data (should predict as member = 1)
    if n_target_train > 0:
        X_target_train = target_train.cpu().numpy()
        if len(X_target_train.shape) > 2:
            X_target_train = X_target_train.reshape(n_target_train, -1)
        acc_train = clf.predict(X_target_train).mean()
        accs.append(acc_train)

    # Predict on target test data (should predict as non-member = 0)
    # This is the key for MIA-Efficacy: True Negatives / |target_test|
    if n_target_test > 0:
        X_target_test = target_test.cpu().numpy()
        if len(X_target_test.shape) > 2:
            X_target_test = X_target_test.reshape(n_target_test, -1)
        predictions = clf.predict(X_target_test)
        # MIA-Efficacy: proportion predicted as non-member (0)
        mia_efficacy = (predictions == 0).mean()
        accs.append(mia_efficacy)

    return np.mean(accs) if accs else 0.5


async def calculate_salun_mia_efficacy(
    unlearn_model,
    shadow_train_loader,
    shadow_test_loader, 
    forget_loader,  # This is our "target_test" - data that should be forgotten
    device,
    forget_class: int
) -> Dict[str, float]:
    """
    Calculate MIA-Efficacy using SALUN methodology.
    
    Args:
        unlearn_model: The unlearned model to evaluate
        shadow_train_loader: Training data for shadow model (remaining classes)
        shadow_test_loader: Test data for shadow model  
        forget_loader: Forget class data (should be predicted as non-member)
        device: Computing device
        forget_class: The class being forgotten
    
    Returns:
        Dict with MIA efficacy scores for different features
    """
    
    # Collect probabilities from all datasets
    shadow_train_prob, shadow_train_labels = collect_prob(shadow_train_loader, unlearn_model, device)
    shadow_test_prob, shadow_test_labels = collect_prob(shadow_test_loader, unlearn_model, device)
    
    # Forget data is our "target_test" - we want to predict these as non-members
    forget_prob, forget_labels = collect_prob(forget_loader, unlearn_model, device, forget_class)
    
    # No target_train for unlearning scenario - the forget data should not be in training
    target_train_prob, target_train_labels = None, None
    
    if shadow_train_prob.shape[0] == 0 or shadow_test_prob.shape[0] == 0:
        print("Warning: Insufficient shadow data for MIA evaluation")
        return {"mia_efficacy": 0.5}
    
    if forget_prob.shape[0] == 0:
        print("Warning: No forget class data found")
        return {"mia_efficacy": 0.5}

    # Extract features for MIA
    
    # 1. Confidence feature (ground truth class probability)
    shadow_train_conf = torch.gather(shadow_train_prob, 1, shadow_train_labels[:, None])
    shadow_test_conf = torch.gather(shadow_test_prob, 1, shadow_test_labels[:, None])
    forget_conf = torch.gather(forget_prob, 1, forget_labels[:, None])

    # 2. Entropy feature
    shadow_train_entr = entropy(shadow_train_prob).unsqueeze(1)
    shadow_test_entr = entropy(shadow_test_prob).unsqueeze(1)
    forget_entr = entropy(forget_prob).unsqueeze(1)

    # Calculate MIA efficacy for confidence and entropy features only
    results = {}
    
    try:
        # C-MIA: Confidence-based MIA
        c_mia = SVC_fit_predict(
            shadow_train_conf, shadow_test_conf, None, forget_conf
        )
        results["C-MIA"] = c_mia
        
        # E-MIA: Entropy-based MIA
        e_mia = SVC_fit_predict(
            shadow_train_entr, shadow_test_entr, None, forget_entr
        )
        results["E-MIA"] = e_mia
        
        print(f"MIA Debug - C-MIA: {c_mia:.3f}, E-MIA: {e_mia:.3f}")
        print(f"MIA Debug - Shadow train: {shadow_train_prob.shape[0]}, Shadow test: {shadow_test_prob.shape[0]}, Forget: {forget_prob.shape[0]}")
        
    except Exception as e:
        print(f"Error in MIA calculation: {e}")
        results = {"C-MIA": 0.5, "E-MIA": 0.5}
    
    return results


async def train_mia_classifier_once(
    baseline_model,
    shadow_train_loader,
    shadow_test_loader,
    device,
    forget_class: int
) -> Dict:
    """
    Train MIA classifier once with baseline model (epoch 0).
    Returns trained classifiers for different features.
    """
    print("Training MIA classifier with baseline model...")
    
    # Collect probabilities from baseline model
    shadow_train_prob, shadow_train_labels = collect_prob(shadow_train_loader, baseline_model, device)
    shadow_test_prob, shadow_test_labels = collect_prob(shadow_test_loader, baseline_model, device)
    
    # Debug: Check class distributions
    train_classes = torch.unique(shadow_train_labels)
    test_classes = torch.unique(shadow_test_labels)
    print(f"Shadow train classes: {train_classes.tolist()}")
    print(f"Shadow test classes: {test_classes.tolist()}")
    print(f"Shadow train samples: {shadow_train_prob.shape[0]}")
    print(f"Shadow test samples: {shadow_test_prob.shape[0]}")
    
    if shadow_train_prob.shape[0] == 0 or shadow_test_prob.shape[0] == 0:
        print("Warning: Insufficient shadow data for MIA training")
        return None
    
    # Extract features for MIA training (confidence and entropy only)
    shadow_train_conf = torch.gather(shadow_train_prob, 1, shadow_train_labels[:, None])
    shadow_test_conf = torch.gather(shadow_test_prob, 1, shadow_test_labels[:, None])
    
    shadow_train_entr = entropy(shadow_train_prob).unsqueeze(1)
    shadow_test_entr = entropy(shadow_test_prob).unsqueeze(1)
    
    # Train classifiers for each feature (excluding prob for stability)
    classifiers = {}
    
    try:
        # Train separate classifier for each feature
        features = {
            'confidence': (shadow_train_conf, shadow_test_conf), 
            'entropy': (shadow_train_entr, shadow_test_entr)
        }
        
        for feat_name, (train_feat, test_feat) in features.items():
            # Prepare training data
            n_train = train_feat.shape[0]
            n_test = test_feat.shape[0]
            
            X = torch.cat([train_feat, test_feat]).cpu().numpy()
            if len(X.shape) > 2:
                X = X.reshape(n_train + n_test, -1)
            
            y = np.concatenate([np.ones(n_train), np.zeros(n_test)])
            
            # Train classifier
            clf = SVC(C=3, kernel="linear")
            clf.fit(X, y)
            classifiers[feat_name] = clf
            
        print(f"MIA classifiers trained successfully for {len(classifiers)} features")
        return classifiers
        
    except Exception as e:
        print(f"Error training MIA classifiers: {e}")
        return None


async def predict_mia_efficacy(
    current_model,
    mia_classifier,
    forget_loader,
    device,
    forget_class: int
) -> Dict[str, float]:
    """
    Predict MIA-Efficacy using trained classifier with current model.
    MIA-Efficacy = proportion of forget data predicted as non-member (0)
    Higher value = better unlearning (forget data looks like non-member)
    """
    if mia_classifier is None:
        return {'C-MIA': 0.5, 'E-MIA': 0.5}
    
    # Extract features from current model
    forget_prob, forget_labels = collect_prob(forget_loader, current_model, device, target_class=None)
    
    if forget_prob.shape[0] == 0:
        return {'C-MIA': 0.5, 'E-MIA': 0.5}
    
    # Debug: Check forget data
    forget_classes = torch.unique(forget_labels)
    print(f"Forget classes: {forget_classes.tolist()}")
    print(f"Forget samples: {forget_prob.shape[0]}")
    
    # Debug: Sample probability distributions
    # Skip logging sample probabilities for cleaner output
    
    # Extract same features as training (confidence and entropy only)
    forget_conf = torch.gather(forget_prob, 1, forget_labels[:, None])
    forget_entr = entropy(forget_prob).unsqueeze(1)
    
    features = {
        'confidence': forget_conf,
        'entropy': forget_entr
    }
    
    # Predict with each classifier
    efficacies = {}
    for feat_name, feat_data in features.items():
        if feat_name in mia_classifier:
            clf = mia_classifier[feat_name]
            X = feat_data.cpu().numpy()
            if len(X.shape) > 2:
                X = X.reshape(X.shape[0], -1)
            
            predictions = clf.predict(X)
            # MIA-Efficacy = proportion predicted as non-member (0)
            # Higher value = better unlearning
            efficacy = (predictions == 0).mean()
            efficacies[feat_name] = efficacy
    
    # Return efficacies for both C-MIA and E-MIA
    if efficacies:
        c_mia = efficacies.get('confidence', 0.5)
        e_mia = efficacies.get('entropy', 0.5)
        print(f"MIA Efficacy - C-MIA: {c_mia:.3f}, E-MIA: {e_mia:.3f}")
        return {'C-MIA': c_mia, 'E-MIA': e_mia}
    else:
        return {'C-MIA': 0.5, 'E-MIA': 0.5}


def create_shadow_loaders(train_loader, test_loader, forget_class: int, device):
    """
    Create shadow train/test loaders by excluding forget class from training data.
    This simulates the shadow model setup for MIA evaluation.
    """
    # This is a placeholder - you'll need to implement based on your data loading setup
    # The idea is to create balanced datasets that exclude the forget class
    pass