# File: server/app.py
import os
import sys
import base64
import torch
import torchvision.transforms as transforms
from flask import Flask, request, jsonify
import time

# Get the absolute path to the project root directory
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)

# Import directly from predict.py in the model directory
from predict import predict_single_image  # Changed import statement

app = Flask(__name__)

UPLOAD_FOLDER = "uploaded_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Define character set and transforms globally
characters = (
    [str(i) for i in range(10)] +  # 0-9
    [chr(i) for i in range(65, 91)] +  # A-Z
    [chr(i) for i in range(97, 123)]   # a-z
)
characters = sorted(characters)

# Create character mappings
char_to_idx = {char: idx + 1 for idx, char in enumerate(characters)}
idx_to_char = {idx + 1: char for idx, char in enumerate(characters)}
idx_to_char[0] = ''  # Add blank token

# Define transform
transform = transforms.Compose([
    transforms.Resize((50, 200)),
    transforms.ToTensor(),
])

@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        data = request.json
        if "image" not in data:
            return jsonify({"error": "No image data provided"}), 400

        # Process base64 image
        base64_image = data["image"].split(",")[1]
        image_data = base64.b64decode(base64_image)
        file_path = os.path.join(UPLOAD_FOLDER, "uploaded_image.png")
        model_path = os.path.join(project_root, "model", "best_model.pth")

        # Save the image
        with open(file_path, "wb") as f:
            f.write(image_data)

        # Predict the captcha
        try:
            predicted_text = predict_single_image(file_path, model_path, transform, idx_to_char)
        except Exception as e:
            return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

        return jsonify({
            "message": "Image processed successfully",
            "path": file_path,
            "captcha": predicted_text
        }), 200

    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)