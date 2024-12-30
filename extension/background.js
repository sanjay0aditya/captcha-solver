chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "sendImageToServer",
      title: "Send Image to Server",
      contexts: ["image"]
    });
  });
  
chrome.contextMenus.onClicked.addListener((info, tab) => {
if (info.menuItemId === "sendImageToServer") {
    // Open popup
    chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 415,
    height: 260
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

        // Show loading state
        chrome.runtime.sendMessage({ status: 'loading' });

        fetch("http://localhost:5000/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Image })
        })
          .then(response => response.json())
          .then(data => {
            console.log("Image sent successfully:", data);
            chrome.runtime.sendMessage({ 
              status: 'complete',
              data: data
            });
          })
          .catch(error => {
            console.error("Error sending image:", error);
            chrome.runtime.sendMessage({ 
              status: 'error',
              error: error.message
            });
          });
    }
    });
}
});