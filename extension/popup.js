chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const status = document.getElementById('status');
    const loader = document.getElementById('loader');
    const response = document.getElementById('response');
  
    switch (message.status) {
      case 'loading':
        status.textContent = 'Processing image...';
        status.className = '';
        loader.style.display = 'flex';
        response.textContent = '';
        break;
  
      case 'complete':
        const captchaText = message.data.captcha;
        
        // Copy to clipboard
        navigator.clipboard.writeText(captchaText)
          .then(() => {
            status.textContent = 'Captcha copied to clipboard!';
          })
          .catch(err => {
            status.textContent = 'Captcha processed but copy failed';
            console.error('Failed to copy: ', err);
          });
        
        status.className = 'success';
        loader.style.display = 'none';
        response.textContent = JSON.stringify(message.data, null, 2);
  
        response.style.position = 'relative';
        const notification = document.createElement('div');
        notification.textContent = 'Copied!';
        notification.style.cssText = `
          position: absolute;
          top: 10px;
          right: 10px;
          background: #059669;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;
        response.appendChild(notification);
        
        setTimeout(() => {
          notification.style.opacity = '1';
          setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
          }, 1500);
        }, 100);
        break;
  
      case 'error':
        status.textContent = 'Error processing image';
        status.className = 'error';
        loader.style.display = 'none';
        response.textContent = message.error || 'Unknown error occurred';
        break;
    }
  });