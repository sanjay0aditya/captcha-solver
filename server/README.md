# Captcha Processing Flask Server

Simple Flask server that handles Captcha uploads, saves them locally, and returns results.

## Setup

### Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# Unix/MacOS
source venv/bin/activate

# Install dependencies
pip install flask
```

## Project Structure
```
server/
├── app.py
├── venv/
├── uploaded_images/
├── requirements.txt
└── README.md
```

## Features
- Accepts base64 encoded images via POST
- Saves images to local storage
- Returns captcha response
- Isolated development environment using venv

## API Endpoint
`POST /upload`

### Request Format
```json
{
  "image": "data:image/png;base64,..."
}
```

### Response Format
```json
{
  "message": "Image uploaded successfully",
  "path": "uploaded_images/uploaded_image.png",
  "captcha": "5xYaf"
}
```

## Development
```bash
# Start development server
python app.py

# Deactivate virtual environment when done
deactivate
```
Server runs on `http://localhost:5000`

## Error Handling
Returns 400 status if image data is missing:
```json
{
  "error": "No image data provided"
}
```

## Installation for Contributors
```bash
# Clone repository
git clone git@github.com:simmuuu/captcha-solver.git

# Create and activate virtual environment (see Setup section)

# Install dependencies
pip install Flask
```