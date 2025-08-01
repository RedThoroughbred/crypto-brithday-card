#!/bin/bash

# GeoGift Vercel Deployment Script
# Automates frontend deployment to Vercel with proper environment configuration

echo "🚀 GeoGift Vercel Deployment Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="frontend"
BACKEND_URL="http://192.168.86.245:8000"  # Update with your IP
PROJECT_NAME="geogift-frontend"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory not found. Please run this script from the project root."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        print_error "Failed to install Vercel CLI. Please install manually: npm install -g vercel"
        exit 1
    fi
    print_status "Vercel CLI installed successfully"
fi

# Navigate to frontend directory
cd $FRONTEND_DIR

print_info "Current directory: $(pwd)"

# Check if project is linked to Vercel
if [ ! -f ".vercel/project.json" ]; then
    print_warning "Project not linked to Vercel. Starting setup..."
    
    echo ""
    echo "Please follow these steps:"
    echo "1. Select or create your Vercel account"
    echo "2. Choose 'Link to existing project' or 'Create new project'"  
    echo "3. Set project name: $PROJECT_NAME"
    echo "4. Set framework: Next.js"
    echo ""
    
    vercel link
    
    if [ $? -ne 0 ]; then
        print_error "Failed to link project to Vercel"
        exit 1
    fi
    
    print_status "Project linked to Vercel successfully"
else
    print_status "Project already linked to Vercel"
fi

# Set environment variables
print_info "Setting up environment variables..."

# Function to set environment variable
set_env_var() {
    local var_name=$1
    local var_value=$2
    local description=$3
    
    print_info "Setting $var_name..."
    echo "$var_value" | vercel env add "$var_name" production --force
    
    if [ $? -eq 0 ]; then
        print_status "$description set successfully"
    else
        print_warning "Failed to set $var_name (might already exist)"
    fi
}

# Core environment variables
set_env_var "NEXT_PUBLIC_API_URL" "$BACKEND_URL" "Backend API URL"
set_env_var "NEXT_PUBLIC_SEPOLIA_RPC_URL" "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161" "Sepolia RPC URL"
set_env_var "NEXT_PUBLIC_ENABLE_TESTNET" "true" "Testnet flag"
set_env_var "NEXT_PUBLIC_CHAIN_ID" "11155111" "Chain ID"
set_env_var "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID" "a50545d685e260a2df11d709da5e3ef8" "WalletConnect Project ID"

# Smart contract addresses
set_env_var "NEXT_PUBLIC_GGT_TOKEN_ADDRESS" "0x1775997EE682CCab7c6443168d63D2605922C633" "GGT Token address"
set_env_var "NEXT_PUBLIC_GGT_CHAIN_ESCROW_ADDRESS" "0x41d62a76aF050097Bb9e8995c6B865588dFF6547" "Chain Escrow address"
set_env_var "NEXT_PUBLIC_NEW_USER_GIFT_ESCROW_ADDRESS" "0x9fAE6c354C7514d19Ad2029f7Adc534A31eac712" "New User Gift Escrow address"
set_env_var "NEXT_PUBLIC_SIMPLE_RELAY_ESCROW_ADDRESS" "0x0cbEf2Ceac48e08bc88D53f5Fe221E4448D95858" "Simple Relay Escrow address"

print_status "Environment variables configured"

# Build and deploy
print_info "Building and deploying to Vercel..."

vercel --prod

if [ $? -eq 0 ]; then
    print_status "Deployment successful! 🎉"
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel --prod --confirm 2>/dev/null | grep -E "https://.*\.vercel\.app" | tail -1)
    
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        print_status "Your app is live at: $DEPLOYMENT_URL"
        
        echo ""
        echo "📋 Next Steps:"
        echo "==============="
        echo "1. 🌐 Share this URL with your brother: $DEPLOYMENT_URL"
        echo "2. 🔧 Make sure your backend is running locally: ./start-dev.sh"
        echo "3. 🧪 Test the connection: curl $BACKEND_URL/api/v1/health"
        echo "4. 🎮 Test wallet connection and gift creation on the live site"
        echo ""
        echo "🔄 To redeploy after changes:"
        echo "   cd frontend && vercel --prod"
        echo ""
        echo "📊 View deployment details:"
        echo "   vercel list"
        echo "   vercel logs"
        echo ""
    fi
else
    print_error "Deployment failed. Check the logs above for details."
    echo ""
    echo "Common fixes:"
    echo "- Run 'npm run build' to check for build errors"
    echo "- Verify all environment variables are set correctly"
    echo "- Check vercel logs for detailed error information"
    exit 1
fi

cd ..
print_status "Deployment script completed!"