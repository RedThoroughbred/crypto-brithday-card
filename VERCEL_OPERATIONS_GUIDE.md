# Vercel Operations Guide

**Complete operational guide for managing your GeoGift frontend deployment on Vercel.**

## 🎯 Quick Start

### One-Command Deployment
```bash
# From project root
./deploy-to-vercel.sh
```

This script handles everything:
- ✅ Vercel CLI installation
- ✅ Project linking
- ✅ Environment variable setup
- ✅ Build and deployment
- ✅ URL sharing ready

## 🔄 Daily Workflows

### Development Mode (You)
**Working on new features locally:**

```bash
# 1. Keep backend running locally
cd backend
source ../venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. Keep relay service running  
cd ..
node simple-relay.js

# 3. Develop frontend locally
cd frontend
npm run dev
# Access: http://localhost:3000
```

### Testing Mode (Brother)
**When brother needs to test:**

```bash
# 1. Ensure backend is running (you)
# 2. Deploy latest changes to Vercel (you)
cd frontend && vercel --prod

# 3. Brother accesses live URL
# https://your-project-name.vercel.app
```

### Production Mode (Future)
**When backend is deployed to DigitalOcean:**

```bash
# 1. Update backend URL
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://your-droplet-domain.com

# 2. Redeploy
vercel --prod

# 3. Both access production URL
```

## 🎛️ Environment Management

### Current Configuration (Hybrid Mode)

| Environment | Frontend | Backend | Database | Use Case |
|-------------|----------|---------|----------|----------|
| **Local Dev** | localhost:3000 | localhost:8000 | Neon | Your development |
| **Testing** | your-app.vercel.app | 192.168.86.245:8000 | Neon | Brother testing |
| **Production** | your-app.vercel.app | droplet-domain.com | Neon | Public launch |

### Switching Configurations

#### Switch to Local Backend (Current)
```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter: http://192.168.86.245:8000
vercel --prod
```

#### Switch to DigitalOcean Backend (Future)
```bash
vercel env add NEXT_PUBLIC_API_URL  
# Enter: https://your-droplet-domain.com
vercel --prod
```

#### Switch to ngrok (Temporary Sharing)
```bash
# Start ngrok tunnel (from another terminal)
ngrok http 8000

# Copy the https URL and update Vercel
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://abc123.ngrok.io
vercel --prod
```

## 🔧 Common Operations

### Deploy Latest Changes
```bash
cd frontend
vercel --prod
```

### Check Deployment Status
```bash
vercel list                    # List all deployments
vercel logs                    # View recent logs
vercel --prod --open          # Open deployed app
```

### Environment Variable Management
```bash
vercel env ls                  # List all environment variables
vercel env add VARIABLE_NAME   # Add new variable
vercel env rm VARIABLE_NAME    # Remove variable
```

### Rollback to Previous Version
```bash
vercel rollback                # Interactive rollback
vercel rollback [URL]          # Rollback to specific deployment
```

### View Build Logs
```bash
vercel logs --follow          # Follow logs in real-time
vercel logs [deployment-url]  # Logs for specific deployment
```

## 🚨 Troubleshooting

### Issue 1: "API Connection Failed"
**Symptoms:** Frontend can't reach backend API

**Solutions:**
```bash
# Check if backend is running
curl http://192.168.86.245:8000/api/v1/health

# Check CORS configuration
vercel env ls | grep API_URL

# Update API URL if needed
vercel env rm NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_API_URL
# Enter correct backend URL
vercel --prod
```

### Issue 2: "Build Failures"
**Symptoms:** Deployment fails during build

**Solutions:**
```bash
# Test build locally first
cd frontend
npm run build

# Check for TypeScript errors
npm run typecheck

# Check for linting errors
npm run lint

# View detailed build logs
vercel logs
```

### Issue 3: "Environment Variables Not Working"
**Symptoms:** Features not working, missing config

**Solutions:**
```bash
# List current variables
vercel env ls

# Remove and re-add problematic variables
vercel env rm VARIABLE_NAME
vercel env add VARIABLE_NAME

# Verify in browser dev tools
# Check: window.location.origin, process.env values
```

### Issue 4: "Brother Can't Connect Wallet"
**Symptoms:** MetaMask/WalletConnect issues

**Solutions:**
1. **Check Network**: Ensure brother is on Sepolia testnet
2. **Check RPC**: Verify RPC URLs are working
3. **Check Contracts**: Ensure contract addresses are correct
4. **Check CORS**: Backend must allow Vercel domain

```bash
# Update WalletConnect project ID if needed
vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
# Enter: a50545d685e260a2df11d709da5e3ef8
```

## 📊 Monitoring & Analytics

### Deployment Analytics
```bash
# View deployment metrics
vercel stats

# Check function execution logs
vercel logs --function

# Monitor performance
# Access: https://vercel.com/dashboard
```

### Custom Monitoring Setup
Add to your Next.js app for better monitoring:

```typescript
// In frontend/app/layout.tsx or _app.tsx
useEffect(() => {
  // Track deployment info
  console.log('Deployment:', {
    url: window.location.origin,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
}, []);
```

## 🔐 Security & Best Practices

### Environment Variable Security
```bash
# ✅ Good: Use Vercel's encrypted storage
vercel env add SECRET_KEY

# ❌ Bad: Never commit secrets to git
# Don't put secrets in .env files committed to repo
```

### CORS Security
Your backend is configured for:
- ✅ localhost:3000 (local development)
- ✅ *.vercel.app (Vercel deployments)
- ✅ Your specific IP (brother testing)

### SSL/HTTPS
- ✅ Vercel automatically provides SSL certificates
- ✅ All connections are HTTPS by default
- ✅ Custom domains get SSL automatically

## 📈 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
cd frontend
npm run build
# Check .next/static/ for asset sizes

# Enable compression (already configured in vercel.json)
# Enable image optimization (already configured in next.config.js)
```

### Edge Function Optimization
```json
// In vercel.json - already configured
{
  "functions": {
    "app/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1", "sfo1", "cle1"]
}
```

## 🎯 Brother Testing Checklist

**Before sharing with brother:**

1. **Deploy Latest** ✅
   ```bash
   cd frontend && vercel --prod
   ```

2. **Test Backend Connection** ✅
   ```bash
   curl http://192.168.86.245:8000/api/v1/health
   ```

3. **Verify Environment** ✅
   ```bash
   vercel env ls | grep -E "(API_URL|CHAIN_ID|WALLETCONNECT)"
   ```

4. **Test Key Features** ✅
   - Wallet connection
   - Gift creation  
   - Gift claiming
   - GPS verification

5. **Share URL** ✅
   ```
   "Hey, test the app at: https://your-project-name.vercel.app"
   ```

## 🔄 Development Lifecycle

### Feature Development
```bash
# 1. Develop locally
cd frontend && npm run dev

# 2. Test with local backend
# Access: http://localhost:3000

# 3. Deploy for brother testing
vercel --prod

# 4. Brother tests live version
# Access: https://your-app.vercel.app
```

### Bug Fixes
```bash
# 1. Fix bug locally
# 2. Test locally
# 3. Quick deploy
cd frontend && vercel --prod

# 4. Verify fix on live site
# 5. Notify brother if needed
```

### Feature Releases
```bash
# 1. Complete feature locally
# 2. Run full test suite
npm run test
npm run test:e2e

# 3. Build and deploy
vercel --prod

# 4. Test production version
# 5. Document new features
```

## 💰 Cost Management

### Current Costs
- **Vercel Hobby**: Free (perfect for testing)
- **Bandwidth**: Unlimited on hobby plan
- **Function Executions**: Generous free tier
- **Edge Requests**: Unlimited

### Monitoring Usage
```bash
# Check usage via CLI
vercel teams ls
vercel usage

# Or check dashboard: https://vercel.com/dashboard/usage
```

### When to Upgrade
Consider Vercel Pro ($20/month) when:
- Need custom domains
- Need team collaboration
- Need advanced analytics
- Hit hobby plan limits

## 🎉 Success Metrics

### Testing Success with Brother
- ✅ Brother can access live URL
- ✅ Wallet connection works remotely
- ✅ Gift creation/claiming functional
- ✅ Real-time updates work
- ✅ Mobile compatibility confirmed

### Development Productivity
- ✅ Instant deployments (30-60 seconds)
- ✅ No server management needed
- ✅ Easy environment switching
- ✅ Reliable uptime for testing

---

**Status**: Ready for immediate deployment! Run `./deploy-to-vercel.sh` to get started. 🚀