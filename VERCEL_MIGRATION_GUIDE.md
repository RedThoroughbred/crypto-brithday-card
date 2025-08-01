# Vercel Frontend Migration Guide

**Complete guide for migrating GeoGift frontend from local development to Vercel deployment for global performance and easy sharing.**

## 🎯 Migration Goals

1. **Eliminate Local Lag** - Global CDN performance instead of local Next.js server
2. **Enable Remote Testing** - Brother in different state can test live version
3. **Professional Deployment** - Production-ready frontend with instant deployments
4. **Flexible Development** - Easy switching between local dev and production testing

## 📊 Current Setup Analysis

✅ **Vercel Compatible Features:**
- Next.js 14 with App Router (Vercel's native framework)
- Static assets and API routes ready
- Environment variable structure compatible
- TypeScript and Tailwind CSS supported
- Build scripts already configured

✅ **Key Configuration:**
- API calls to local backend: `NEXT_PUBLIC_API_URL=http://192.168.86.245:8000`
- Blockchain integration with Sepolia testnet
- MapBox integration for location features
- WalletConnect for mobile wallet support

## 🚀 Deployment Strategies

### Strategy A: Hybrid Development (Recommended)
**Local Backend + Vercel Frontend**

Perfect for your current needs - keeps your familiar backend development while giving global frontend performance.

```bash
# Development Flow:
# 1. Backend runs locally (with Neon database)
# 2. Frontend deployed to Vercel
# 3. Brother tests live Vercel URL
# 4. You develop backend locally as normal
```

**Pros:**
- ✅ Instant sharing with brother
- ✅ Keep familiar backend development
- ✅ Global frontend performance 
- ✅ Easy environment switching

### Strategy B: Full Cloud Deployment
**DigitalOcean Backend + Vercel Frontend**

Complete cloud deployment for maximum performance and scalability.

```bash
# Production Flow:
# 1. Backend deployed to DigitalOcean droplet
# 2. Frontend deployed to Vercel
# 3. Both use Neon PostgreSQL
# 4. Professional production setup
```

## 📋 Pre-Migration Checklist

### Environment Variables Audit
Your current `.env.local` needs these updates for Vercel:

```bash
# ❌ Current (Local API)
NEXT_PUBLIC_API_URL=http://192.168.86.245:8000

# ✅ For Vercel (Options)
# Option 1: Keep local backend for development
NEXT_PUBLIC_API_URL=http://192.168.86.245:8000

# Option 2: Use DigitalOcean backend (when deployed)
NEXT_PUBLIC_API_URL=https://your-droplet-domain.com

# Option 3: Use ngrok tunnel for temporary sharing
NEXT_PUBLIC_API_URL=https://abc123.ngrok.io
```

### Required Vercel Environment Variables
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-url.com

# Blockchain (Same as current)
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
NEXT_PUBLIC_ENABLE_TESTNET=true
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a50545d685e260a2df11d709da5e3ef8

# Smart Contracts (Update with latest addresses)
NEXT_PUBLIC_GGT_TOKEN_ADDRESS=0x1775997EE682CCab7c6443168d63D2605922C633
NEXT_PUBLIC_SIMPLE_RELAY_ESCROW_ADDRESS=0x0cbEf2Ceac48e08bc88D53f5Fe221E4448D95858
NEXT_PUBLIC_NEW_USER_GIFT_ESCROW_ADDRESS=0x9fAE6c354C7514d19Ad2029f7Adc534A31eac712

# Maps (Optional - keep if you have keys)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## 🛠️ Step-by-Step Migration

### Step 1: Prepare Vercel Configuration

Create `vercel.json` in your frontend directory:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1", "sfo1"],
  "functions": {
    "app/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### Step 2: Install Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login

# Link your project (run from frontend directory)
cd frontend
vercel link
```

### Step 3: Configure Environment Variables

```bash
# Set environment variables for production
vercel env add NEXT_PUBLIC_API_URL
# Enter: http://192.168.86.245:8000 (or your backend URL)

vercel env add NEXT_PUBLIC_SEPOLIA_RPC_URL
# Enter: https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161

vercel env add NEXT_PUBLIC_ENABLE_TESTNET
# Enter: true

vercel env add NEXT_PUBLIC_CHAIN_ID
# Enter: 11155111

vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
# Enter: a50545d685e260a2df11d709da5e3ef8

# Add contract addresses
vercel env add NEXT_PUBLIC_GGT_TOKEN_ADDRESS
# Enter: 0x1775997EE682CCab7c6443168d63D2605922C633

vercel env add NEXT_PUBLIC_SIMPLE_RELAY_ESCROW_ADDRESS
# Enter: 0x0cbEf2Ceac48e08bc88D53f5Fe221E4448D95858
```

### Step 4: Deploy to Vercel

```bash
# Deploy from frontend directory
cd frontend
vercel --prod

# Your app will be deployed to: https://your-project-name.vercel.app
```

## 🔄 Development Workflow Management

### Local Development Mode
**For your daily development work:**

```bash
# 1. Keep backend running locally
cd backend
source ../venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. Keep relay service running locally  
cd ..
node simple-relay.js

# 3. Run frontend locally for development
cd frontend
npm run dev

# Access: http://localhost:3000 (development)
```

### Testing Mode with Brother
**For sharing with your brother:**

```bash
# 1. Keep backend running locally (same as above)
# 2. Brother accesses: https://your-project-name.vercel.app
# 3. Vercel frontend talks to your local backend via your IP
```

### Production Mode
**When backend is deployed to DigitalOcean:**

```bash
# 1. Update Vercel environment variable
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://your-droplet-domain.com

# 2. Redeploy frontend
vercel --prod

# 3. Both you and brother use: https://your-project-name.vercel.app
```

## 🎛️ Environment Management

### Three Environment Configurations

#### 1. **Development** (`.env.local`)
```bash
# For local development
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 2. **Staging** (Vercel Environment Variables)
```bash
# For testing with brother - local backend, Vercel frontend
NEXT_PUBLIC_API_URL=http://192.168.86.245:8000
```

#### 3. **Production** (Vercel Environment Variables)
```bash
# For full cloud deployment
NEXT_PUBLIC_API_URL=https://your-droplet-domain.com
```

### Easy Environment Switching

```bash
# Switch to different backend
vercel env rm NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_API_URL
# Enter new backend URL

# Redeploy with new environment
vercel --prod
```

## 🚨 CORS Configuration

Your backend needs CORS headers for Vercel domain. Update your FastAPI backend:

```python
# In backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://your-project-name.vercel.app",  # Vercel deployment
        "https://*.vercel.app",  # All Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📊 Performance Benefits

### Before (Local Next.js)
- 🐌 Local server performance limitations
- 🌐 No global CDN
- 📍 Single geographic location
- 🔧 Manual server management

### After (Vercel)
- ⚡ Global CDN with edge locations
- 🚀 Automatic optimization and compression
- 🌍 Served from nearest location to users
- 🔄 Instant deployments and rollbacks

## 🔧 Troubleshooting Common Issues

### Issue 1: API Connection Errors
```bash
# Check CORS configuration in backend
# Verify NEXT_PUBLIC_API_URL is accessible from internet
# Test: curl https://your-vercel-app.vercel.app/api/health
```

### Issue 2: Environment Variables Not Working
```bash
# List current environment variables
vercel env ls

# Remove and re-add if needed
vercel env rm VARIABLE_NAME
vercel env add VARIABLE_NAME
```

### Issue 3: Build Failures
```bash
# Check build logs
vercel logs

# Run build locally to debug
npm run build
```

## 📋 Quick Commands Reference

```bash
# Deploy to Vercel
vercel --prod

# Check deployment status
vercel list

# View logs
vercel logs

# Open deployed app
vercel --prod --open

# Rollback to previous deployment
vercel rollback

# Add environment variable
vercel env add VARIABLE_NAME

# List environment variables
vercel env ls

# Remove environment variable
vercel env rm VARIABLE_NAME
```

## 🎯 Brother Testing Workflow

Once deployed, your brother can:

1. **Access the app**: https://your-project-name.vercel.app
2. **Connect his wallet**: MetaMask, WalletConnect work globally
3. **Test all features**: Gift creation, claiming, GPS verification
4. **Real-time updates**: Any code changes deploy automatically

## 📈 Next Steps After Migration

1. **Custom Domain** (Optional): `your-app.com` instead of `.vercel.app`
2. **Analytics**: Built-in Vercel analytics for user metrics
3. **Preview Deployments**: Every git push creates a preview URL
4. **Automatic Deployments**: Connect to GitHub for instant deployments

## 🔐 Security Considerations

- ✅ Environment variables encrypted in Vercel
- ✅ HTTPS enforced automatically
- ✅ API calls secured with CORS
- ✅ Wallet connections remain client-side secure

## 💰 Cost Analysis

- **Vercel Hobby Plan**: Free for personal projects
- **Perfect for testing**: No costs during development phase
- **Production ready**: Can upgrade to Pro plan when needed ($20/month)

---

**Status**: Ready for migration! This will solve your lag issues and enable seamless testing with your brother. 🚀