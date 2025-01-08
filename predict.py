# File: predict_captcha.py (save this in the project root)
import torch
import torchvision.transforms as transforms
from PIL import Image
from model.ocr_model import OCRModel

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

def predict_single_image(image_path, model_path, transform, idx_to_char):
    """Predict text from a single image"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Initialize model
    model = OCRModel()
    # Load the model weights
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()

    # Load and preprocess image
    image = Image.open(image_path).convert('L')  # Convert to grayscale
    image = transform(image).unsqueeze(0)  # Add batch dimension
    image = image.to(device)

    # Make prediction
    with torch.no_grad():
        log_probs = model(image)
        pred_text = decode_predictions(log_probs, idx_to_char)[0]



if __name__ == "__main__":
    # Test code here if needed
    pass