// =============================================
// Settings.js
// =============================================

// The data loading and saving is handled natively by Flask and the HTML form.
// We only need Javascript here for minor UI enhancements, like auto-hiding the flash message.

document.addEventListener("DOMContentLoaded", () => {
  const saveMessage = document.getElementById("saveMessage");
  
  // If Flask sends back a success message, hide it after 3 seconds
  if (saveMessage) {
    setTimeout(() => {
      saveMessage.style.display = "none";
    }, 3000);
  }
});