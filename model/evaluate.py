import torch
import torchvision.transforms as transforms
from torch.utils.data import DataLoader
from PIL import Image
from pathlib import Path
import numpy as np
from sklearn.metrics import precision_recall_fscore_support, accuracy_score
import os

def decode_predictions(log_probs, idx_to_char):
    """Decode CTC output to text"""
    pred_indices = torch.argmax(log_probs, dim=2)
    batch_texts = []

    for pred in pred_indices:
        text = []
        for i in range(len(pred)):
            if i == 0 or pred[i] != pred[i-1]:
                if pred[i] != 0:  # 0 is CTC blank
                    text.append(idx_to_char[pred[i].item()])
        batch_texts.append(''.join(text))

    return batch_texts

def evaluate_model(model, val_loader, idx_to_char, device):
    model.eval()
    
    all_predictions = []
    all_targets = []
    char_correct = 0
    total_chars = 0
    
    with torch.no_grad():
        for batch in val_loader:
            images = batch['image'].to(device)
            targets = batch['text']  # Original text labels
            
            # Get model predictions
            log_probs = model(images)
            predictions = decode_predictions(log_probs, idx_to_char)
            
            # Store predictions and targets for overall metrics
            all_predictions.extend(predictions)
            all_targets.extend(targets)
            
            # Calculate per-character accuracy
            for pred, target in zip(predictions, targets):
                # Pad shorter string with spaces to match lengths
                max_len = max(len(pred), len(target))
                pred = pred.ljust(max_len)
                target = target.ljust(max_len)
                
                # Count correct characters
                char_correct += sum(p == t for p, t in zip(pred, target))
                total_chars += max_len

    # Calculate sequence-level metrics
    correct_sequences = sum(p == t for p, t in zip(all_predictions, all_targets))
    total_sequences = len(all_predictions)
    accuracy = correct_sequences / total_sequences

    # Calculate character-level accuracy
    char_accuracy = char_correct / total_chars

    # Convert predictions and targets to binary format for sklearn metrics
    binary_predictions = [list(pred) for pred in all_predictions]
    binary_targets = [list(target) for target in all_targets]
    
    # Calculate precision, recall, and F1 score
    precision, recall, f1, _ = precision_recall_fscore_support(
        binary_targets, 
        binary_predictions, 
        average='weighted',
        zero_division=0
    )

    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'char_accuracy': char_accuracy
    }

def load_validation_data(val_dir):
    # Get all image files
    image_paths = []
    labels = []
    
    for ext in ['*.png', '*.jpg']:
        for img_path in Path(val_dir).glob(ext):
            image_paths.append(str(img_path))
            # Extract label from filename (assuming filename format is "label.extension" or "label.hash.extension")
            label = img_path.stem.split('.')[0]
            labels.append(label)
    
    return image_paths, labels

# Main evaluation code
if __name__ == "__main__":
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Load the model
    model = OCRModel(num_chars=63)  # Adjust based on your character set
    model.load_state_dict(torch.load('best_model.pth', map_location=device))
    model = model.to(device)
    
    # Set up data transforms
    transform = transforms.Compose([
        transforms.Resize((50, 200)),
        transforms.ToTensor(),
    ])
    
    # Load validation data
    val_dir = "./datasets/validation/"
    image_paths, labels = load_validation_data(val_dir)
    
    # Create validation dataset and loader
    val_dataset = CaptchaDataset(
        image_paths,
        labels,
        transform=transform,
        char_to_idx=char_to_idx,
        idx_to_char=idx_to_char
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=32,
        shuffle=False,
        collate_fn=custom_collate_fn
    )
    
    # Evaluate the model
    metrics = evaluate_model(model, val_loader, idx_to_char, device)
    
    # Print results
    print("\nModel Evaluation Results:")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall: {metrics['recall']:.4f}")
    print(f"F1 Score: {metrics['f1']:.4f}")
    print(f"Character-level Accuracy: {metrics['char_accuracy']:.4f}")