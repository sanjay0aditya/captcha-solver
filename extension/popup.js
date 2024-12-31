chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.status === 'error') {
    // Update error message
    const errorMessageEl = document.getElementById('error-message');
    errorMessageEl.textContent = message.error;
    
    // Update error details
    const errorDetailsEl = document.getElementById('error-details');
    const details = `Time: ${new Date(message.details.timestamp).toLocaleString()}
Error Type: ${message.details.type || 'Unknown'}

Stack Trace:
${message.details.stack.split('\n')[0] || 'No stack trace available'}`; // Only show first line of stack trace
    
    errorDetailsEl.textContent = details;
  }
});