chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sendImageToServer",
    title: "Process Captcha",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendImageToServer") {
    // Show initial notification
    chrome.notifications.create('captchaSolver', {
      type: 'basic',
      iconUrl: 'extension.png',
      title: 'Captcha Solver',
      message: 'Processing captcha...',
      priority: 2
    });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (srcUrl) => {
        const images = document.getElementsByTagName('img');
        const clickedImage = Array.from(images).find(img => img.src === srcUrl);
        
        if (!clickedImage) return null;

        const canvas = document.createElement("canvas");
        canvas.width = clickedImage.naturalWidth;
        canvas.height = clickedImage.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(clickedImage, 0, 0);

        return canvas.toDataURL("image/png");
      },
      args: [info.srcUrl]
    }, (results) => {
      if (results[0]?.result) {
        const base64Image = results[0].result;

        fetch("http://localhost:5000/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log("Image sent successfully:", data);
          
          // Copy captcha text to clipboard
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (captchaText) => {
              navigator.clipboard.writeText(captchaText)
                .then(() => console.log('Captcha copied to clipboard'))
                .catch(err => console.error('Failed to copy:', err));
            },
            args: [data.captcha]
          });

          // Find and fill the next input field
          chrome.tabs.sendMessage(tab.id, { 
            action: "fillCaptcha",
            captchaText: data.captcha 
          }, (response) => {
            // Update notification with processed captcha result
            chrome.notifications.create('captchaSolver', {
              type: 'basic',
              iconUrl: 'extension.png',
              title: 'Captcha Processed',
              message: `Processed captcha: ${data.captcha}\nCopied to clipboard!`,
              priority: 2
            });

            // Auto-close notification after 3 seconds
            setTimeout(() => {
              chrome.notifications.clear('captchaSolver');
            }, 3000);
          });
        })
        .catch(error => {
          console.error("Error:", error);
          // Clear the processing notification
          chrome.notifications.clear('captchaSolver');
          
          // Create error popup window
          chrome.windows.create({
            url: 'popup.html',
            type: 'popup',
            width: 420,
            height: 450
          }, (popupWindow) => {
            // Wait a bit for the popup to load before sending the error
            setTimeout(() => {
              chrome.runtime.sendMessage({ 
                status: 'error',
                error: error.message || "Unknown error occurred",
                details: {
                  timestamp: new Date().toISOString(),
                  url: info.srcUrl,
                  type: error.name,
                  stack: error.stack
                }
              });
            }, 500);
          });
        });
      }
    });
  }
});