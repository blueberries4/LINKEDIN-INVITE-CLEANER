# LinkedIn Invite Cleaner

A Chrome extension that helps you bulk withdraw old LinkedIn connection invitations in seconds.

## Features

✨ **Bulk Withdrawal** - Withdraw multiple invitations at once based on age  
🔧 **Flexible Filtering** - Filter by age (1, 3, 6, or 12 months)  
📊 **CSV Export** - Download a record of all withdrawn invitations  
⏸️ **Cancel Anytime** - Stop the process mid-operation with a single click  
🚀 **Fast Processing** - Intelligent loading with 3-7 second delays between withdrawals  
🔒 **Privacy First** - No data collection, all processing happens locally

## Installation

### From Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once approved.

### Manual Installation (For Testing)

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select this folder
6. The extension appears in your Chrome toolbar

## How to Use

1. Go to [LinkedIn Received Invitations](https://www.linkedin.com/mynetwork/invitation-manager/received/)
2. Click the **LinkedIn Invite Cleaner** extension icon
3. Select your filters:
   - **Months**: How old should invitations be? (1, 3, 6, or 12+ months)
   - **Limit**: Maximum number to withdraw in one session (10, 20, or 30)
4. Click **Start Withdrawal**
5. Watch the counter update as invitations are withdrawn
6. A CSV file automatically downloads with the withdrawn invitation details
7. Use the **Cancel** button anytime to stop the process

## Permissions Explained

| Permission                        | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `activeTab`                       | Identifies the LinkedIn tab you're viewing   |
| `host_permissions` (linkedin.com) | Accesses LinkedIn's invitation manager pages |

**No data is collected, stored, or transmitted** - all processing happens locally on your device. Only the minimum necessary permissions are requested.

## Project Structure

```
linkedin-invite-cleaner/
├── manifest.json          # Extension configuration
├── popup.html            # User interface
├── popup.js              # UI logic
├── background.js         # Message relay
├── content.js            # Core withdrawal logic
├── assets/icons/         # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Technical Details

- **Framework**: Chrome Extension Manifest V3
- **Language**: JavaScript (Vanilla, no dependencies)
- **Target**: LinkedIn.com
- **Features**:
  - Automated "Load more" button clicking
  - DOM-based invitation card detection
  - Age-based filtering (weeks/months parsing)
  - Modal confirmation automation
  - Real-time withdrawal counter
  - CSV export with profile details

## Development

### Testing Locally

1. Load the extension in Developer mode
2. Go to LinkedIn's invitation manager
3. Open DevTools (F12) to see console logs
4. Click the extension icon and test withdrawal

### Debugging

All operations log to the browser console. Check **DevTools → Console** for detailed information about:

- Cards found and processed
- Age calculations
- Button clicks and confirmations
- Withdrawal successes and failures

## Privacy & Security

✅ **No remote servers** - All code runs locally  
✅ **No data transmission** - LinkedIn API not used  
✅ **No storage** - Data exists only during operation  
✅ **Open source** - You can inspect all code

The extension reads only what's visible on LinkedIn's page and doesn't collect analytics or usage data.

## Limitations

- Only works on the [LinkedIn Invitation Manager](https://www.linkedin.com/mynetwork/invitation-manager/received/) page
- Requires active LinkedIn login
- Respects LinkedIn's rate limiting (delays between withdrawals)
- Cannot withdraw pending sent invitations (only received)

## Troubleshooting

### "No invitation cards found"

- Make sure you're on the correct LinkedIn page (Received Invitations)
- LinkedIn's page structure may have changed - check browser console for errors

### Extension not working

1. Verify you're logged into LinkedIn
2. Check that the extension has permission for linkedin.com
3. Open DevTools (F12) and check for errors in the Console tab
4. Try reloading the page and the extension

### CSV not downloading

- Check your browser's download settings
- Look in your Downloads folder
- Ensure pop-ups aren't blocked for linkedin.com

## Contributing

Found a bug? Have a suggestion? Feel free to open an issue or submit a pull request.

## License

MIT License - Feel free to use, modify, and distribute this extension.

## Support

For issues or questions, check the console logs (F12) for detailed error messages.

---

**Made with ❤️ for LinkedIn users tired of managing old invitations**

# LINKEDIN-INVITE-CLEANER
