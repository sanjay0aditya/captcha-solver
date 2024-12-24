# Chrome Extension

A Chrome extension that enables right-click functionality on web pages and sends captchas to a server for processing. The extension displays processing status and server response in a popup window.

## Features

- Restores right-click functionality on websites that disable it
- Adds "Send Image to Server" context menu option for images
- Displays processing status in a popup window
- Shows server response data
- Converts images to base64 format before sending

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Project Structure

```
extension/
├── manifest.json
├── background.js
├── content.js
├── popup.js
├── popup.html
├── README.md
└── extension.png
```

### Key Components

#### background.js
- Creates context menu item for images
- Handles image processing and server communication
- Opens popup window and manages state
- Converts images to base64 format
- Sends status updates to popup

#### content.js
- Restores right-click functionality on web pages
- Removes event listeners that block context menu
- Runs automatically when extension is active

#### popup.js
- Manages popup window UI updates
- Handles status messages from background script
- Displays processing status and server response
- Updates loading indicators

## Development

### Prerequisites
- Chrome browser
- Local server running on port 5000 (modify URL in background.js if needed)

### Adding Features
1. Update manifest.json with any new permissions
2. Modify background.js for new functionality
3. Update popup.html/js for new UI elements
4. Test thoroughly with various image types

### Common Issues
- Server connection errors will display in popup
- Images must be accessible via URL
- Page needs refresh after extension installation

## API Reference

### Message Types
```javascript
// Loading status
{ status: 'loading' }

// Success response
{ 
  status: 'complete',
  data: {/*server response*/} 
}

// Error response
{ 
  status: 'error',
  error: 'error message'
}
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Submit pull request
5. Ensure tests pass
