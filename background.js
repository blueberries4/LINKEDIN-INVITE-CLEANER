chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        alert("No active tab found. Please make sure you're on LinkedIn.");
        return;
      }
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "startWithdraw",
          months: message.months,
          limit: message.limit
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError);
          }
        }
      );
    });
  }
});
