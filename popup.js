document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const monthsSelect = document.getElementById("months");
  const limitSelect = document.getElementById("limit");

  if (!startBtn || !monthsSelect || !limitSelect) {
    console.error("Required elements not found in popup.html");
    return;
  }

  startBtn.addEventListener("click", () => {
    const months = parseInt(monthsSelect.value);
    const limit = parseInt(limitSelect.value);

    console.log(`Sending message: months=${months}, limit=${limit}`);

    // Disable button to prevent double clicks
    startBtn.disabled = true;
    startBtn.innerText = "Processing...";

    chrome.runtime.sendMessage(
      {
        action: "start",
        months: months,
        limit: limit
      },
      (response) => {
        // Check for port closure error (this is normal when popup closes)
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message;
          
          // If it's just a port closure, the operation likely started successfully
          if (errorMsg.includes("message port closed")) {
            console.log("Operation started, popup closing");
            window.close();
          } else {
            console.error("Message error:", errorMsg);
            startBtn.disabled = false;
            startBtn.innerText = "Start";
            alert(`Error: ${errorMsg}\n\nPlease make sure you're on the LinkedIn Sent Invitations page.`);
          }
        } else {
          console.log("Message sent successfully", response);
          // Close popup after starting
          setTimeout(() => window.close(), 500);
        }
      }
    );
  });
});