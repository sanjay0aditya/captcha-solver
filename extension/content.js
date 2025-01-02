// // Enable right-click functionality and handle input field detection
// (function() {
//   let lastClickedElement = null;

//   // Remove any `oncontextmenu` attributes in the DOM
//   document.querySelectorAll("*").forEach((el) => {
//     el.oncontextmenu = null;
//   });

//   // Remove event listeners that block right-click
//   ["contextmenu", "mousedown", "mouseup", "click"].forEach((event) => {
//     document.addEventListener(
//       event,
//       (e) => {
//         e.stopPropagation();
//       },
//       true
//     );
//   });

//   // Store the last clicked element
//   document.addEventListener('contextmenu', (e) => {
//     lastClickedElement = e.target;
//   }, true);

//   // Function to find the next input field after an element
//   function findNextInputField(element) {
//     // Get all input elements that can receive text
//     const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'));
    
//     // If no element is provided, return the first input
//     if (!element) return inputs[0];

//     // Function to get the DOM position of an element
//     function getPosition(el) {
//       const rect = el.getBoundingClientRect();
//       return {
//         top: rect.top + window.scrollY,
//         left: rect.left + window.scrollX
//       };
//     }

//     const elementPos = getPosition(element);
    
//     // Find input fields that come after the clicked element
//     const validInputs = inputs.filter(input => {
//       const inputPos = getPosition(input);
//       return (
//         // Input is below the clicked element
//         (inputPos.top > elementPos.top) ||
//         // Input is on the same line but to the right
//         (inputPos.top === elementPos.top && inputPos.left > elementPos.left)
//       );
//     });

//     // Sort by position (top to bottom, left to right)
//     validInputs.sort((a, b) => {
//       const posA = getPosition(a);
//       const posB = getPosition(b);
//       if (posA.top === posB.top) {
//         return posA.left - posB.left;
//       }
//       return posA.top - posB.top;
//     });

//     return validInputs[0] || null;
//   }

//   // Listen for messages from background script
//   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.action === "getCaptchaLocation") {
//       const nextInput = findNextInputField(lastClickedElement);
//       if (nextInput) {
//         sendResponse({
//           found: true,
//           inputId: nextInput.id,
//           inputName: nextInput.name,
//           inputClass: nextInput.className
//         });
//       } else {
//         sendResponse({ found: false });
//       }
//     } else if (message.action === "fillCaptcha" && message.captchaText) {
//       const nextInput = findNextInputField(lastClickedElement);
//       if (nextInput) {
//         nextInput.value = message.captchaText;
//         // Trigger input event to notify any listeners
//         nextInput.dispatchEvent(new Event('input', { bubbles: true }));
//         sendResponse({ success: true });
//       } else {
//         sendResponse({ success: false });
//       }
//     }
//     return true; // Keep the message channel open for async response
//   });

//   console.log("Right-click and input field detection functionality initialized.");
// })();


// -------------




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

  // Function to get valid input fields
  function getValidInputs() {
    return Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'));
  }

  // Function to find input field relative to the captcha image
  function findInputField(element) {
    if (!element) return null;

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
      if (inputField) {
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

  console.log("Input field detection initialized with bidirectional search.");
})();