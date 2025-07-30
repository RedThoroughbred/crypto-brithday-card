# 📧 GeoGift Email Setup Guide

Your GeoGift platform now supports **multiple email providers**! No SendGrid API key required.

## 🚀 Quick Setup Options

### Option 1: Gmail (Recommended for Testing)
1. **Create a Gmail App Password:**
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate an "App password" for "Mail"

2. **Add to your `.env` file:**
   ```bash
   GMAIL_EMAIL=youremail@gmail.com
   GMAIL_APP_PASSWORD=your-16-digit-app-password
   FROM_EMAIL=youremail@gmail.com
   ```

### Option 2: Outlook/Hotmail
Add to your `.env` file:
```bash
OUTLOOK_EMAIL=youremail@outlook.com
OUTLOOK_PASSWORD=your-password
FROM_EMAIL=youremail@outlook.com
```

### Option 3: Any SMTP Provider
Add to your `.env` file:
```bash
SMTP_SERVER=mail.yourprovider.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
SMTP_USE_TLS=true
FROM_EMAIL=noreply@yourprovider.com
```

### Option 4: Development Mode (No Setup Required!)
If you don't configure any email provider, the system automatically uses **Log Mode**:
- ✅ Emails are displayed in the terminal
- ✅ HTML is saved to `/tmp/last_email.html` for preview
- ✅ Perfect for testing and development!

## 🎨 Beautiful Email Templates

Your emails now include:
- 📧 **Gradient headers** with gift icons
- 🎁 **Token amounts** (ETH or GGT)
- 🗺️ **Chain adventure info** with step counts
- 📱 **Mobile-responsive** design
- 🔒 **Security explanations** for recipients

## 🧪 Testing Your Email System

1. **Start your backend:**
   ```bash
   ./start-dev.sh
   ```

2. **Test the email endpoint:**
   ```bash
   curl -X GET "http://localhost:8000/api/v1/email/test-email/test@example.com?gift_type=chain"
   ```

3. **Check the output:**
   - **With email provider:** Email sends to the address
   - **Without provider:** Beautiful HTML preview in terminal + `/tmp/last_email.html`

## 🎯 GGT Token Integration

### Finding Your GGT Token Address
Since you created the GGT token with Remix, check:

1. **Etherscan for your wallet:**
   - Visit: https://sepolia.etherscan.io/address/0x2Fa710B2A99Cdd9e314080B78B0F7bF78c126234
   - Look for "Contract Creation" transactions
   - Find the one that created your GGT token

2. **Update the token config:**
   ```typescript
   // In /frontend/lib/tokens.ts
   export const GGT_TOKEN: TokenConfig = {
     address: 'YOUR_GGT_CONTRACT_ADDRESS_HERE',
     symbol: 'GGT',
     name: 'GeoGift Token',
     decimals: 18,
     icon: '🎁'
   };
   ```

## 📨 Email Template Customization

Your email templates support:
- **Multiple gift types:** single, chain
- **Token types:** ETH, GGT
- **Adventure themes:** birthday, proposal, custom
- **Dynamic content:** step counts, progress, clues

## 🔧 Troubleshooting

### "Email sending failed"
- Check your email credentials in `.env`
- Verify SMTP settings for your provider
- Try using Log Mode first (no configuration needed)

### "Template not found"
- The system automatically uses inline HTML if templates are missing
- Templates are stored in `/backend/app/templates/`

### "Connection refused"
- Make sure your backend is running: `./start-dev.sh`
- Check the correct port (usually 8000)

## 🎊 Ready to Test!

Your multi-step gift system now supports:
- ✅ **Flexible email providers** (no API keys required)
- ✅ **Beautiful HTML templates** with adventure themes
- ✅ **GGT token integration** (just add your contract address)
- ✅ **Development-friendly** log mode
- ✅ **Multiple unlock types** (GPS, video, image, quiz, etc.)

**Start with Log Mode** (no setup) → **Add Gmail** (easy) → **Use any provider** (flexible)!