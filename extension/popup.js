chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.status === 'loading') {
        document.getElementById('status').textContent = 'Processing image...';
        document.getElementById('loader').style.display = 'block';
        document.getElementById('response').textContent = '';
    } else if (message.status === 'complete') {
        document.getElementById('status').textContent = `Captcha: ${JSON.stringify(message.data.captcha, null, 2)}`;
        document.getElementById('loader').style.display = 'none';
        document.getElementById('response').textContent = JSON.stringify(message.data, null, 2);
    } else if (message.status === 'error') {
        document.getElementById('status').textContent = 'Error processing image';
        document.getElementById('loader').style.display = 'none';
        document.getElementById('response').textContent = message.error || 'Unknown error occurred';
    }
  });