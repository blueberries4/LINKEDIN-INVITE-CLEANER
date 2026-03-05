// Prevent duplicate initialization
if (window.__linkedinCleanerInitialized) {
  console.log("LinkedIn Cleaner already initialized, skipping...");
} else {
  window.__linkedinCleanerInitialized = true;
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function randomDelay(min = 1000, max = 5000) {
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
  let buttonContainer = null;
  
  try {
    // Reset cancel flag
    cancelRequested = false;

    // Validate inputs - allow 0 for targetMonths ("All pending" option)
    if (typeof targetMonths !== 'number' || typeof maxLimit !== 'number' || targetMonths < 0 || maxLimit < 1) {
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

    // Try multiple selectors for LinkedIn's cards
    let cards = document.querySelectorAll("div[role='listitem']");
    console.log(`Selector 'div[role=listitem]' found: ${cards.length} cards`);
    
    // Fallback selectors
    if (cards.length === 0) {
      cards = document.querySelectorAll("li.invitation-card");
      console.log(`Selector 'li.invitation-card' found: ${cards.length} cards`);
    }
    if (cards.length === 0) {
      cards = document.querySelectorAll("[data-view-name='invitation-card']");
      console.log(`Selector '[data-view-name=invitation-card]' found: ${cards.length} cards`);
    }
    if (cards.length === 0) {
      // Try to find any element that looks like an invite card
      const allDivs = document.querySelectorAll("div");
      const potentialCards = [];
      for (let div of allDivs) {
        if (div.innerText && div.innerText.includes("Withdraw") && div.innerText.includes("Sent")) {
          potentialCards.push(div);
        }
      }
      if (potentialCards.length > 0) {
        console.log(`Found ${potentialCards.length} potential cards by text content`);
        // Find the smallest containing elements
        cards = potentialCards.filter(d => d.querySelector("button"));
      }
    }
    
    console.log(`Total ${cards.length} invitation cards available for processing`);
    
    // Debug: Log first card structure
    if (cards.length > 0) {
      console.log("First card HTML structure:", cards[0].innerHTML.substring(0, 500));
      console.log("First card text:", cards[0].innerText);
    } else {
      // Debug: Show page structure
      console.log("Page title:", document.title);
      console.log("Looking for any buttons with Withdraw:", 
        Array.from(document.querySelectorAll("button")).filter(b => b.innerText.includes("Withdraw")).length);
    }

    if (cards.length === 0) {
      throw new Error("No invitation cards found. Please make sure you're on the correct page.");
    }

    // Create container for buttons
    buttonContainer = document.createElement("div");
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

        // Check if this is the last card
        const isLastCard = (i === cards.length - 1);

        // Debug: Log all text content of the card
        console.log(`Card ${i}:`, card.innerText.substring(0, 200));

        // Find time text element - look for "Sent X weeks/months ago" in various elements
        let timeTextEl = null;
        let timeText = "";
        
        // First try paragraphs
        const paragraphs = card.querySelectorAll("p");
        for (let p of paragraphs) {
          if (p.innerText.includes("Sent")) {
            timeTextEl = p;
            timeText = p.innerText;
            break;
          }
        }
        
        // Try spans if not found
        if (!timeTextEl) {
          const spans = card.querySelectorAll("span");
          for (let span of spans) {
            if (span.innerText.includes("Sent") || span.innerText.includes("month") || span.innerText.includes("week")) {
              timeTextEl = span;
              timeText = span.innerText;
              break;
            }
          }
        }
        
        // Try any element with time-related text
        if (!timeTextEl) {
          const allElements = card.querySelectorAll("*");
          for (let el of allElements) {
            const text = el.innerText || "";
            if ((text.includes("month") || text.includes("week") || text.includes("day")) && text.length < 50) {
              timeTextEl = el;
              timeText = text;
              break;
            }
          }
        }
        
        // Last resort: search the entire card text
        if (!timeText) {
          const cardText = card.innerText;
          const timeMatch = cardText.match(/Sent\s+\d+\s+(month|week|day)s?\s+ago/i) || 
                           cardText.match(/\d+\s+(month|week|day)s?\s+ago/i);
          if (timeMatch) {
            timeText = timeMatch[0];
          }
        }

        if (!timeText) {
          console.log(`Card ${i}: No time text found in card content, skipping`);
          continue;
        }

        const months = getMonths(timeText);
        console.log(`Card ${i}: Time text="${timeText}", Months extracted=${months}, Target=${targetMonths}`);

        if (months >= targetMonths) {
          // Find withdraw button - try multiple selectors for LinkedIn UI compatibility
          let withdrawBtn = card.querySelector("button[data-view-name*='withdraw']");
          
          // Fallback selectors if the primary one doesn't work
          if (!withdrawBtn) {
            // Try finding button with "Withdraw" text using textContent (more reliable)
            const allBtns = card.querySelectorAll("button");
            console.log(`Card ${i}: Checking ${allBtns.length} buttons...`);
            
            for (let btn of allBtns) {
              const btnText = (btn.textContent || btn.innerText || "").trim().toLowerCase();
              const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
              console.log(`Card ${i}: Button text="${btnText}", aria-label="${ariaLabel}"`);
              
              if (btnText.includes("withdraw") || ariaLabel.includes("withdraw")) {
                withdrawBtn = btn;
                console.log(`Card ${i}: Found withdraw button via text/aria match`);
                break;
              }
            }
          }
          
          // Another fallback - aria-label
          if (!withdrawBtn) {
            withdrawBtn = card.querySelector("button[aria-label*='Withdraw']") || 
                          card.querySelector("button[aria-label*='withdraw']");
          }
          
          // Try looking for any clickable element with Withdraw text
          if (!withdrawBtn) {
            const allClickables = card.querySelectorAll("button, [role='button'], a");
            for (let el of allClickables) {
              const elText = (el.textContent || "").trim().toLowerCase();
              if (elText === "withdraw") {
                withdrawBtn = el;
                console.log(`Card ${i}: Found withdraw element via exact text match`);
                break;
              }
            }
          }
          
          if (!withdrawBtn) {
            console.log(`Card ${i}: No withdraw button found, skipping.`);
            console.log(`Card ${i}: Card innerHTML sample:`, card.innerHTML.substring(0, 1000));
            continue;
          }

          // Get name from the link
          const nameLink = card.querySelector("a[href*='/in/']");
          const name = nameLink?.innerText.trim() || "Unknown";
          const url = nameLink?.href || "Unknown";

          console.log(`>>> ATTEMPTING TO WITHDRAW: ${name}`);
          console.log(`>>> Clicking withdraw button...`);
          withdrawBtn.click();
          await sleep(2000);

          // Look for confirmation button in modal
          let confirmClicked = false;
          
          // Try multiple selectors for the confirmation dialog
          const confirmSelectors = [
            "button[data-test-dialog-primary-btn]",
            "button.artdeco-modal__confirm-dialog-btn",
            "button.artdeco-button--primary",
            "[data-live-test-modal-primary-btn]"
          ];
          
          for (const selector of confirmSelectors) {
            const confirmBtn = document.querySelector(selector);
            if (confirmBtn && confirmBtn.innerText.toLowerCase().includes("withdraw")) {
              console.log(`>>> Found confirm button with selector: ${selector}`);
              confirmBtn.click();
              confirmClicked = true;
              break;
            }
          }
          
          // Fallback: look for any button with "Withdraw" text in modals/dialogs
          if (!confirmClicked) {
            const allButtons = document.querySelectorAll("button");
            for (let btn of allButtons) {
              const btnText = btn.innerText.toLowerCase();
              // Look for Withdraw button that's not the original one we clicked
              if (btnText.includes("withdraw") && btn !== withdrawBtn) {
                console.log(`>>> Found confirm button via text match: "${btn.innerText}"`);
                btn.click();
                confirmClicked = true;
                break;
              }
            }
          }
          
          // Debug: Log all visible modals
          if (!confirmClicked) {
            const modals = document.querySelectorAll("[role='dialog'], .artdeco-modal, [data-test-modal]");
            console.log(`>>> Found ${modals.length} modals on page`);
            modals.forEach((m, idx) => {
              console.log(`>>> Modal ${idx}:`, m.innerText.substring(0, 200));
            });
          }

          if (confirmClicked) {
            await sleep(1000); // Wait for withdrawal to process
            withdrawn++;
            withdrawnData.push({ name, url, months });
            counterDiv.innerText = `Withdrawn: ${withdrawn}`;
            console.log(`>>> SUCCESS: Withdrawn ${name}`);
          } else {
            console.warn(`Card ${i}: Could not find confirmation button. Pressing Escape to close modal.`);
            // Try to close any open modal
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
            await sleep(500);
          }

          // Only delay if not the last operation and haven't reached limit
          const isLastWithdrawal = (withdrawn >= maxLimit) || isLastCard;
          if (!isLastWithdrawal) {
            await sleep(randomDelay());
          }
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
  console.log("Content script received message:", message);
  
  try {
    if (message.action === "startWithdraw") {
      console.log("Starting withdrawal with params:", { months: message.months, limit: message.limit });
      
      // Verify we're on the correct page
      const currentUrl = window.location.href;
      console.log("Current URL:", currentUrl);
      
      if (!currentUrl.includes("invitation-manager/sent")) {
        const errMsg = "Please navigate to LinkedIn Sent Invitations page:\nhttps://www.linkedin.com/mynetwork/invitation-manager/sent/";
        console.error(errMsg);
        alert(errMsg);
        sendResponse({ success: false, error: errMsg });
        return true;
      }
      
      // Send immediate acknowledgment
      sendResponse({ success: true, message: "Starting withdrawal process" });
      
      // Start the withdrawal process
      withdrawInvites(message.months, message.limit).catch(err => {
        console.error("Withdrawal error:", err);
      });
    }
  } catch (error) {
    console.error("Error in message listener:", error);
    alert(`Error: ${error.message}`);
    sendResponse({ success: false, error: error.message });
  }
  
  // Return true to indicate we'll send response asynchronously
  return true;
});

  console.log("LinkedIn Cleaner content script initialized");
}