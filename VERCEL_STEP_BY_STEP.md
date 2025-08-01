# Vercel Setup: Step by Step

## 🎯 Current Status
✅ You have Vercel account  
✅ You're creating new project  
🔄 **Next: Import GitHub repository**

## Step 1: Repository Import
1. **Select your repository**: `crypto-brithday-card`
2. **Set Root Directory**: `frontend` (CRITICAL!)
3. **Framework**: Next.js (should auto-detect)

## Step 2: Environment Variables
**Immediately after import, add these environment variables:**

| Variable Name | Value |
|---------------|-------|
| `NEXT_PUBLIC_API_URL` | `http://192.168.86.245:8000` |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | `https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161` |
| `NEXT_PUBLIC_ENABLE_TESTNET` | `true` |
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | `a50545d685e260a2df11d709da5e3ef8` |
| `NEXT_PUBLIC_GGT_TOKEN_ADDRESS` | `0x1775997EE682CCab7c6443168d63D2605922C633` |
| `NEXT_PUBLIC_SIMPLE_RELAY_ESCROW_ADDRESS` | `0x0cbEf2Ceac48e08bc88D53f5Fe221E4448D95858` |
| `NEXT_PUBLIC_NEW_USER_GIFT_ESCROW_ADDRESS` | `0x9fAE6c354C7514d19Ad2029f7Adc534A31eac712` |

## Step 3: Deploy
Click **Deploy** and wait for build to complete.

## Step 4: Test
1. **Get your URL**: `https://your-project-name.vercel.app`
2. **Ensure backend is running locally**
3. **Test wallet connection**

## 🚨 If Build Fails
Common issue: Root directory not set to `frontend`
**Fix:** Go to Project Settings → General → Root Directory → Set to `frontend`

## ✅ Success Indicators
- Build completes without errors
- You get a live URL
- Frontend loads (even if backend connection fails initially)
- No TypeScript/build errors

## 🔄 After Deployment
Your workflow becomes:
1. **Develop locally**: `npm run dev` in frontend directory
2. **Deploy changes**: Git push automatically deploys to Vercel
3. **Share with brother**: Send him the Vercel URL

## 🎯 The Big Picture
- **Frontend**: Vercel (global, fast)
- **Backend**: Your computer (temporarily)
- **Database**: Neon (cloud)
- **Future**: Move backend to DigitalOcean droplet

This eliminates your lag issues and enables remote testing immediately!