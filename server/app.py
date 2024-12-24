import os
import base64
from flask import Flask, request, jsonify
import time # to introduce delay

app = Flask(__name__)

UPLOAD_FOLDER = "uploaded_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_image():
    data = request.json
    if "image" not in data:
        return jsonify({"error": "No image data provided"}), 400

    base64_image = data["image"].split(",")[1]  # Ex: {'image': 'data:image/png;base64,iVBORw0 <-- image base64 data }
    image_data = base64.b64decode(base64_image)
    file_path = os.path.join(UPLOAD_FOLDER, "uploaded_image.png")

    with open(file_path, "wb") as f:
        f.write(image_data)

    time.sleep(2)

    return jsonify({"message": "Image uploaded successfully my skibidi", "path": file_path, "captcha": "33iAge (demo)"}), 200

if __name__ == '__main__':
    app.run(debug=True)
