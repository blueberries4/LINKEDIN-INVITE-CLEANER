chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start") {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tabs || tabs.length === 0) {
          console.error("No active tab found");
          sendResponse({ success: false, error: "No active tab found. Please make sure you're on LinkedIn." });
          return;
        }
        
        const tab = tabs[0];
        
        // Check if we're on a LinkedIn page
        if (!tab.url || !tab.url.includes("linkedin.com")) {
          sendResponse({ success: false, error: "Please navigate to LinkedIn Sent Invitations page first." });
          return;
        }
        
        // Inject content script first to ensure it's loaded
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });
        
        // Small delay to ensure script is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Now send the message
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "startWithdraw",
          months: message.months,
          limit: message.limit
        });
        
        sendResponse({ success: true, response });
      } catch (error) {
        console.error("Error:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    // Return true to indicate we'll send response asynchronously
    return true;
  }
});
