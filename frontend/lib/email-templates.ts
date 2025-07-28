// Email template utilities for gift notifications
export interface GiftEmailData {
  recipientEmail: string;
  recipientWallet: string;
  giftId: string;
  amount: string;
  message: string;
  clue: string;
  giftFiles?: string[]; // URLs to attached files
  additionalMessages?: string[];
  unlockSteps?: string[];
  senderName?: string;
}

export function createGiftEmailTemplate(data: GiftEmailData): string {
  const claimUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/claim?id=${data.giftId}`;
  
  // Build file attachments section
  const filesSection = data.giftFiles && data.giftFiles.length > 0 ? `

🗂️ ATTACHED FILES:
${data.giftFiles.map(file => `• ${file}`).join('\n')}
` : '';

  // Build additional messages section
  const additionalSection = data.additionalMessages && data.additionalMessages.length > 0 ? `

📝 ADDITIONAL MESSAGES:
${data.additionalMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}
` : '';

  // Build unlock steps section
  const unlockSection = data.unlockSteps && data.unlockSteps.length > 0 ? `

🔓 UNLOCK SEQUENCE:
${data.unlockSteps.map((step, i) => `Step ${i + 1}: ${step}`).join('\n')}
` : '';

  const emailBody = `🎁 CONGRATULATIONS! You've received a GeoGift!

💰 Prize Amount: ${data.amount}
🏆 Your Wallet: ${data.recipientWallet}

💌 Personal Message:
"${data.message}"
${additionalSection}

🔍 Treasure Hunt Clue:
"${data.clue}"
${unlockSection}${filesSection}

🚀 HOW TO CLAIM YOUR GIFT:

1. 🦊 GET A CRYPTO WALLET (if you don't have one):
   • Download MetaMask: https://metamask.io/download/
   • Create a new wallet (FREE - takes 2 minutes)
   • Switch to "Sepolia Test Network"

2. 📍 SOLVE THE LOCATION PUZZLE:
   • Use the clue above to find the treasure location
   • Go to that exact spot with your phone

3. 🎯 CLAIM YOUR CRYPTO:
   • Visit: ${claimUrl}
   • Connect your MetaMask wallet
   • Share your location when prompted
   • Claim your ${data.amount}!

⏰ IMPORTANT DETAILS:
• Gift ID: ${data.giftId}
• Your wallet address: ${data.recipientWallet}
• This is real cryptocurrency on the Sepolia test network
• You must be at the correct location to claim

❓ NEED HELP?
• Search "MetaMask tutorial" on YouTube
• The claim page will guide you step-by-step
• This is a secure smart contract - your funds are protected

Happy treasure hunting! 🗺️✨

---
This GeoGift was created with ❤️ using blockchain technology.
Your crypto is safely held in a smart contract until you claim it.`;

  return emailBody;
}

export function createMailtoUrl(data: GiftEmailData): string {
  const subject = encodeURIComponent(`🎁 You've received a GeoGift${data.senderName ? ` from ${data.senderName}` : ''}!`);
  const body = encodeURIComponent(createGiftEmailTemplate(data));
  
  return `mailto:${data.recipientEmail}?subject=${subject}&body=${body}`;
}

export function createWalletHelpEmailTemplate(giftId: string): string {
  const claimUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/claim?id=${giftId}`;
  
  return `🦊 How to Create Your MetaMask Wallet for GeoGift

Someone sent you a crypto gift, but you'll need a digital wallet to claim it. Don't worry - it's completely FREE and takes just 2 minutes!

🚀 QUICK SETUP GUIDE:

1. 📥 DOWNLOAD METAMASK:
   • Go to: https://metamask.io/download/
   • Install the browser extension or mobile app
   • MetaMask is trusted by 100+ million users worldwide

2. 🔐 CREATE YOUR WALLET:
   • Click "Create a Wallet"
   • Set a strong password
   • SAVE your secret recovery phrase (write it down!)
   • This phrase is your backup - keep it safe!

3. 🌐 SWITCH TO SEPOLIA NETWORK:
   • Click the network dropdown (shows "Ethereum Mainnet")
   • Select "Add Network"
   • Choose "Sepolia Test Network"
   • Your gifts are on this test network

4. 🎁 CLAIM YOUR GIFT:
   • Return to: ${claimUrl}
   • Click "Connect Wallet"
   • Follow the treasure hunt clues
   • Claim your crypto prize!

💡 WHY IS THIS SAFE?
• MetaMask never stores your crypto - you control everything
• Your secret phrase is only known by you
• The gift is locked in a smart contract until you claim it
• This is real blockchain technology, just like Bitcoin!

🆘 NEED MORE HELP?
• Watch "MetaMask tutorial for beginners" on YouTube
• Visit MetaMask's help center: https://support.metamask.io/
• The claim page has step-by-step instructions

Welcome to the world of cryptocurrency! 🌟

Your gift is waiting at: ${claimUrl}`;
}

export function createWalletHelpMailto(recipientEmail: string, giftId: string): string {
  const subject = encodeURIComponent('🦊 How to Create Your Crypto Wallet - GeoGift Help');
  const body = encodeURIComponent(createWalletHelpEmailTemplate(giftId));
  
  return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
}