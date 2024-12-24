// Enable right-click functionality on all elements
(function enableRightClick() {
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

  console.log("Right-click functionality has been restored.");
})();

