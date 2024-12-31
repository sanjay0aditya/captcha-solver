// Enable right-click functionality and handle input field detection
(function() {
  let lastClickedElement = null;

  // Remove any `oncontextmenu` attributes in the DOM
  document.querySelectorAll("*").forEach((el) => {
    el.oncontextmenu = null;
  });

  // Remove event listeners that block right-click
  ["contextmenu", "mousedown", "mouseup", "click"].forEach((event) => {
    document.addEventListener(
      event,
      (e) => {
        e.stopPropagation();
      },
      true
    );
  });

  // Store the last clicked element
  document.addEventListener('contextmenu', (e) => {
    lastClickedElement = e.target;
  }, true);

  // Function to find the next input field after an element
  function findNextInputField(element) {
    // Get all input elements that can receive text
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'));
    
    // If no element is provided, return the first input
    if (!element) return inputs[0];

    // Function to get the DOM position of an element
    function getPosition(el) {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX
      };
    }

    const elementPos = getPosition(element);
    
    // Find input fields that come after the clicked element
    const validInputs = inputs.filter(input => {
      const inputPos = getPosition(input);
      return (
        // Input is below the clicked element
        (inputPos.top > elementPos.top) ||
        // Input is on the same line but to the right
        (inputPos.top === elementPos.top && inputPos.left > elementPos.left)
      );
    });

    // Sort by position (top to bottom, left to right)
    validInputs.sort((a, b) => {
      const posA = getPosition(a);
      const posB = getPosition(b);
      if (posA.top === posB.top) {
        return posA.left - posB.left;
      }
      return posA.top - posB.top;
    });

    return validInputs[0] || null;
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getCaptchaLocation") {
      const nextInput = findNextInputField(lastClickedElement);
      if (nextInput) {
        sendResponse({
          found: true,
          inputId: nextInput.id,
          inputName: nextInput.name,
          inputClass: nextInput.className
        });
      } else {
        sendResponse({ found: false });
      }
    } else if (message.action === "fillCaptcha" && message.captchaText) {
      const nextInput = findNextInputField(lastClickedElement);
      if (nextInput) {
        nextInput.value = message.captchaText;
        // Trigger input event to notify any listeners
        nextInput.dispatchEvent(new Event('input', { bubbles: true }));
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
    }
    return true; // Keep the message channel open for async response
  });

  console.log("Right-click and input field detection functionality initialized.");
})();