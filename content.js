function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min = 3000, max = 7000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Global flag to cancel operation
let cancelRequested = false;

async function autoScroll() {
  try {
    // LinkedIn uses a "Load more" button instead of infinite scroll
    let loaded = 0;
    const maxAttempts = 50;
    
    // Check if we already have cards loaded, if so, skip initial load
    const existingCards = document.querySelectorAll("div[role='listitem']");
    if (existingCards.length > 0) {
      console.log(`Found ${existingCards.length} cards already loaded, starting to load more...`);
    }
    
    while (loaded < maxAttempts) {
      // Find the "Load more" button
      let loadMoreBtn = null;
      const buttons = document.querySelectorAll("button");
      
      for (let btn of buttons) {
        if (btn.innerText.includes("Load more")) {
          loadMoreBtn = btn;
          break;
        }
      }
      
      if (!loadMoreBtn) {
        console.log("No more 'Load more' button found - all invitations loaded");
        break;
      }
      
      console.log(`Clicking "Load more" button (attempt ${loaded + 1})`);
      loadMoreBtn.click();
      await sleep(1500); // Wait for new items to load
      loaded++;
    }
  } catch (error) {
    console.error("Error during auto scroll:", error);
    throw error;
  }
}

function getMonths(text) {
  // Handle both "X months" and "X weeks" formats
  let months = 0;
  
  const monthMatch = text.match(/(\d+)\s+month/);
  if (monthMatch) {
    months = parseInt(monthMatch[1]);
  } else {
    const weekMatch = text.match(/(\d+)\s+week/);
    if (weekMatch) {
      const weeks = parseInt(weekMatch[1]);
      // Only count as months if >= 4 weeks, otherwise return 0
      // This ensures "1 week ago" won't match "1 month" filter
      months = weeks >= 4 ? Math.floor(weeks / 4) : 0;
    }
  }
  
  return months;
}

function downloadCSV(data) {
  try {
    if (!data || data.length === 0) {
      console.warn("No data to download");
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," +
      ["Name,Profile URL,Months"].concat(data.map(r => `${r.name},${r.url},${r.months}`)).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "withdrawn_invites.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`CSV downloaded with ${data.length} records`);
  } catch (error) {
    console.error("Error downloading CSV:", error);
  }
}

async function withdrawInvites(targetMonths, maxLimit) {
  let withdrawn = 0;
  const withdrawnData = [];
  const counterDiv = document.createElement("div");
  const cancelBtn = document.createElement("button");
  const loadingOverlay = document.createElement("div");
  
  try {
    // Reset cancel flag
    cancelRequested = false;

    // Validate inputs
    if (!targetMonths || !maxLimit || targetMonths < 0 || maxLimit < 1) {
      throw new Error("Invalid parameters: targetMonths and maxLimit must be valid numbers");
    }

    console.log(`Starting withdrawal process: targetMonths=${targetMonths}, maxLimit=${maxLimit}`);

    // Create loading overlay
    loadingOverlay.style.position = "fixed";
    loadingOverlay.style.top = "50%";
    loadingOverlay.style.left = "50%";
    loadingOverlay.style.transform = "translate(-50%, -50%)";
    loadingOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    loadingOverlay.style.color = "#fff";
    loadingOverlay.style.padding = "20px 40px";
    loadingOverlay.style.borderRadius = "12px";
    loadingOverlay.style.zIndex = "10000";
    loadingOverlay.style.fontWeight = "bold";
    loadingOverlay.style.fontSize = "16px";
    loadingOverlay.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
    loadingOverlay.innerHTML = "Loading invitations...<br><small style='font-size: 12px; opacity: 0.8;'>Please wait</small>";
    document.body.appendChild(loadingOverlay);

    // Check if there are already cards visible
    let initialCards = document.querySelectorAll("div[role='listitem']");
    console.log(`Found ${initialCards.length} invitation cards initially visible`);

    // Only load more if we don't have enough cards already
    if (initialCards.length < maxLimit) {
      console.log("Loading more invitations...");
      await autoScroll();
    } else {
      console.log("Sufficient cards already loaded, skipping auto-load");
    }

    // Remove loading overlay
    loadingOverlay.remove();

    // Updated selector: divs with role="listitem" instead of li.invitation-card
    const cards = document.querySelectorAll("div[role='listitem']");
    console.log(`Total ${cards.length} invitation cards available for processing`);

    if (cards.length === 0) {
      throw new Error("No invitation cards found. Please make sure you're on the correct page.");
    }

    // Create container for buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.position = "fixed";
    buttonContainer.style.top = "20px";
    buttonContainer.style.right = "20px";
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.alignItems = "center";
    buttonContainer.style.zIndex = "9999";
    buttonContainer.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
    buttonContainer.style.borderRadius = "8px";
    buttonContainer.style.padding = "8px";
    buttonContainer.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
    document.body.appendChild(buttonContainer);

    // Create counter display
    counterDiv.style.backgroundColor = "#0a66c2";
    counterDiv.style.color = "#fff";
    counterDiv.style.padding = "8px 16px";
    counterDiv.style.borderRadius = "8px";
    counterDiv.style.fontWeight = "bold";
    counterDiv.style.fontSize = "14px";
    counterDiv.innerText = `Withdrawn: ${withdrawn}`;
    buttonContainer.appendChild(counterDiv);

    // Create cancel button
    cancelBtn.style.backgroundColor = "#d93025";
    cancelBtn.style.color = "#fff";
    cancelBtn.style.padding = "8px 16px";
    cancelBtn.style.borderRadius = "8px";
    cancelBtn.style.fontWeight = "bold";
    cancelBtn.style.fontSize = "14px";
    cancelBtn.style.border = "none";
    cancelBtn.style.cursor = "pointer";
    cancelBtn.innerText = "Cancel";
    cancelBtn.onclick = () => {
      cancelRequested = true;
      cancelBtn.innerText = "Cancelling...";
      cancelBtn.disabled = true;
      cancelBtn.style.opacity = "0.6";
      cancelBtn.style.cursor = "not-allowed";
      console.log("Cancel requested by user");
    };
    buttonContainer.appendChild(cancelBtn);

    for (let i = 0; i < cards.length; i++) {
      try {
        // Check if user requested cancellation
        if (cancelRequested) {
          console.log("Operation cancelled by user");
          break;
        }

        const card = cards[i];
        if (withdrawn >= maxLimit) {
          console.log(`Reached max limit of ${maxLimit} withdrawals`);
          break;
        }

        // Debug: Log all text content of the card
        console.log(`Card ${i}:`, card.innerText);

        // Find time text element - look for "Sent X weeks/months ago"
        let timeTextEl = null;
        const paragraphs = card.querySelectorAll("p");
        for (let p of paragraphs) {
          if (p.innerText.includes("Sent")) {
            timeTextEl = p;
            break;
          }
        }

        if (!timeTextEl) {
          console.log(`Card ${i}: No time element found, skipping`);
          continue;
        }

        const months = getMonths(timeTextEl.innerText);
        console.log(`Card ${i}: Time text="${timeTextEl.innerText}", Months extracted=${months}, Target=${targetMonths}`);

        if (months >= targetMonths) {
          // Find withdraw button - look for button with data-view-name containing "withdraw"
          const withdrawBtn = card.querySelector("button[data-view-name*='withdraw']");
          if (!withdrawBtn) {
            console.log(`Card ${i}: No withdraw button found, skipping`);
            continue;
          }

          // Get name from the link
          const nameLink = card.querySelector("a[href*='/in/']");
          const name = nameLink?.innerText.trim() || "Unknown";
          const url = nameLink?.href || "Unknown";

          console.log(`Withdrawing: ${name}`);
          withdrawBtn.click();
          await sleep(1500);

          // Look for confirmation button in modal
          let confirmClicked = false;
          const confirmBtn = document.querySelector("button[data-test-dialog-primary-btn]");
          if (confirmBtn) {
            confirmBtn.click();
            confirmClicked = true;
          } else {
            // Fallback: look for button with "Withdraw" text in any modal
            const buttons = document.querySelectorAll("button");
            for (let btn of buttons) {
              if (btn.innerText.includes("Withdraw")) {
                btn.click();
                confirmClicked = true;
                break;
              }
            }
          }

          if (confirmClicked) {
            withdrawn++;
            withdrawnData.push({ name, url, months });
            counterDiv.innerText = `Withdrawn: ${withdrawn}`;
            console.log(`Successfully withdrawn ${name}`);
          } else {
            console.warn(`Card ${i}: Could not find confirmation button`);
          }

          await sleep(randomDelay());
        }
      } catch (cardError) {
        console.error(`Error processing card ${i}:`, cardError);
        // Continue to next card on error
        continue;
      }
    }

    // Remove button container
    buttonContainer.remove();

    if (withdrawnData.length > 0) {
      downloadCSV(withdrawnData);
    }

    const message = cancelRequested 
      ? `Cancelled. Withdrawn ${withdrawn} invites before stopping.`
      : `Completed. Withdrawn ${withdrawn} invites.`;
    
    alert(message);
    console.log(`Withdrawal process ${cancelRequested ? 'cancelled' : 'completed'}. Total withdrawn: ${withdrawn}`);

  } catch (error) {
    console.error("Error during withdrawal process:", error);
    if (loadingOverlay.parentNode) loadingOverlay.remove();
    if (buttonContainer && buttonContainer.parentNode) buttonContainer.remove();
    alert(`Error: ${error.message}\n\nCheck the console (F12) for more details.`);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === "startWithdraw") {
      console.log("Received startWithdraw message:", message);
      
      // Send immediate acknowledgment
      sendResponse({ success: true, message: "Starting withdrawal process" });
      
      // Start the withdrawal process (don't await here as response is already sent)
      withdrawInvites(message.months, message.limit);
    }
  } catch (error) {
    console.error("Error in message listener:", error);
    alert(`Error: ${error.message}`);
    sendResponse({ success: false, error: error.message });
  }
  
  // Return true to indicate we'll send response asynchronously
  return true;
});
