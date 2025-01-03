(function() {
  let lastClickedElement = null;

  // Remove any `oncontextmenu` attributes in the DOM
  document.querySelectorAll("*").forEach((el) => {
    if (el.tagName.toLowerCase() === 'img') {
      el.oncontextmenu = null;
    }
  });

  // Remove event listeners that block right-click on images
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName.toLowerCase() === 'img') {
      lastClickedElement = e.target;
      e.stopPropagation();
      return true;
    } else {
      // Prevent right-click on non-image elements
      e.preventDefault();
      return false;
    }
  }, true);

  // Function to get valid text input fields only
  function getValidInputs() {
    return Array.from(document.querySelectorAll('input[type="text"]'));
  }

  // Function to find text input field relative to the captcha image
  function findInputField(element) {
    if (!element || element.tagName.toLowerCase() !== 'img') return null;

    const inputs = getValidInputs();
    if (inputs.length === 0) return null;

    const elementRect = element.getBoundingClientRect();
    const elementPos = {
      top: elementRect.top + window.scrollY,
      bottom: elementRect.bottom + window.scrollY,
      left: elementRect.left + window.scrollX
    };

    let inputsAfter = [];
    let inputsBefore = [];

    // Categorize inputs as before or after the captcha
    inputs.forEach(input => {
      const inputRect = input.getBoundingClientRect();
      const inputPos = {
        top: inputRect.top + window.scrollY,
        bottom: inputRect.bottom + window.scrollY,
        left: inputRect.left + window.scrollX
      };

      // Check if input is after the captcha
      if (inputPos.top > elementPos.bottom || 
          (inputPos.top === elementPos.top && inputPos.left > elementPos.left)) {
        inputsAfter.push({
          element: input,
          distance: Math.abs(inputPos.top - elementPos.bottom)
        });
      } 
      // Check if input is before the captcha
      else if (inputPos.bottom < elementPos.top || 
               (inputPos.top === elementPos.top && inputPos.left < elementPos.left)) {
        inputsBefore.push({
          element: input,
          distance: Math.abs(elementPos.top - inputPos.bottom)
        });
      }
    });

    // Sort both arrays by distance
    inputsAfter.sort((a, b) => a.distance - b.distance);
    inputsBefore.sort((a, b) => a.distance - b.distance);

    // First try to get the closest input after the captcha
    if (inputsAfter.length > 0) {
      return inputsAfter[0].element;
    }
    
    // If no input after, get the closest input before the captcha
    if (inputsBefore.length > 0) {
      return inputsBefore[0].element;
    }

    return null;
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getCaptchaLocation") {
      const inputField = findInputField(lastClickedElement);
      if (inputField) {
        sendResponse({
          found: true,
          inputId: inputField.id,
          inputName: inputField.name,
          inputClass: inputField.className
        });
      } else {
        sendResponse({ found: false });
      }
    } else if (message.action === "fillCaptcha" && message.captchaText) {
      const inputField = findInputField(lastClickedElement);
      if (inputField && inputField.type === 'text') {
        // Fill the input field
        inputField.value = message.captchaText;
        
        // Trigger necessary events
        const events = ['input', 'change', 'blur'];
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          inputField.dispatchEvent(event);
        });
        
        // Add visual feedback
        const originalBackground = inputField.style.backgroundColor;
        inputField.style.backgroundColor = '#e8f0fe';
        setTimeout(() => {
          inputField.style.backgroundColor = originalBackground;
        }, 500);

        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
    }
    return true;
  });

  // Add event listener to override default right-click block on images
  window.addEventListener('load', function() {
    document.querySelectorAll('img').forEach((img) => {
      img.addEventListener('contextmenu', function(e) {
        e.stopPropagation();
        lastClickedElement = e.target;
        return true;
      }, true);
    });
  });

  console.log("Image-only right-click and text input detection initialized.");
})();