#!/bin/bash

# Script to set up the relay service on DigitalOcean droplet

echo "🚀 Setting up GeoGift Relay Service on DigitalOcean..."

# Create relay directory
echo "📁 Creating relay service directory..."
mkdir -p /var/www/geogift/relay
cd /var/www/geogift/relay

# Create package.json for relay service
echo "📦 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "geogift-relay-service",
  "version": "1.0.0",
  "description": "Gasless claiming relay service for GeoGift platform",
  "main": "simple-relay.js",
  "scripts": {
    "start": "node simple-relay.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "ethers": "^6.4.0"
  }
}
EOF

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Create the relay service file
echo "📝 Creating relay service file..."
cat > simple-relay.js << 'EOF'
const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const SEPOLIA_RPC_URL = 'https://sepolia.drpc.org';
const RELAY_ESCROW_ADDRESS = '0x0dA21305e6860bbBea457D44b02BDaf287eE856D';
const RELAY_WALLET_PRIVATE_KEY = process.env.RELAY_WALLET_PRIVATE_KEY || '0f66a7a3eaaa4847d0addb2623b6380b49ba4e7adecb4cf4566961d0f9d32dc3';

// Contract ABI (SimpleRelayEscrow)
const RELAY_ESCROW_ABI = [
  {
    "inputs": [
      {"name": "giftId", "type": "bytes32"},
      {"name": "recipient", "type": "address"},
      {"name": "claimCode", "type": "string"},
      {"name": "unlockAnswer", "type": "string"},
      {"name": "nonce", "type": "uint256"},
      {"name": "signature", "type": "bytes"}
    ],
    "name": "relayClaimGift",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "giftId", "type": "bytes32"},
      {"name": "recipient", "type": "address"},
      {"name": "claimCode", "type": "string"},
      {"name": "unlockAnswer", "type": "string"},
      {"name": "nonce", "type": "uint256"}
    ],
    "name": "createClaimSignature",
    "outputs": [{"name": "", "type": "bytes32"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [{"name": "giftId", "type": "bytes32"}],
    "name": "getGiftNonce",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "giftId", "type": "bytes32"},
      {"name": "recipient", "type": "address"},
      {"name": "unlockAnswer", "type": "string"},
      {"name": "nonce", "type": "uint256"},
      {"name": "signature", "type": "bytes"}
    ],
    "name": "relayDirectClaimGift",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "giftId", "type": "bytes32"},
      {"name": "recipient", "type": "address"},
      {"name": "unlockAnswer", "type": "string"},
      {"name": "nonce", "type": "uint256"}
    ],
    "name": "createDirectClaimSignature",
    "outputs": [{"name": "", "type": "bytes32"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [{"name": "giftId", "type": "bytes32"}],
    "name": "getDirectGiftNonce",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initialize ethers
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const relayWallet = new ethers.Wallet(RELAY_WALLET_PRIVATE_KEY, provider);
const relayContract = new ethers.Contract(RELAY_ESCROW_ADDRESS, RELAY_ESCROW_ABI, relayWallet);

// Track pending transactions
const pendingTxs = new Set();

// New User Gift endpoints (with claim codes)
app.post('/create-claim-hash', async (req, res) => {
  try {
    const { giftId, recipient, claimCode, unlockAnswer, nonce } = req.body;
    
    const messageHash = await relayContract.createClaimSignature(
      giftId,
      recipient,
      claimCode,
      unlockAnswer,
      nonce
    );
    
    res.json({ messageHash });
  } catch (error) {
    console.error('Create claim hash error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/nonce/:giftId', async (req, res) => {
  try {
    const { giftId } = req.params;
    const nonce = await relayContract.getGiftNonce(giftId);
    res.json({ nonce: nonce.toString() });
  } catch (error) {
    console.error('Get nonce error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/relay-claim', async (req, res) => {
  try {
    const { giftId, recipient, claimCode, unlockAnswer, nonce, signature } = req.body;
    
    // Prevent duplicate transactions
    const txKey = `${giftId}-${recipient}`;
    if (pendingTxs.has(txKey)) {
      return res.status(400).json({ error: 'Transaction already pending' });
    }
    
    pendingTxs.add(txKey);
    
    try {
      const tx = await relayContract.relayClaimGift(
        giftId,
        recipient,
        claimCode,
        unlockAnswer,
        nonce,
        signature
      );
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.transactionHash);
      
      res.json({ 
        success: true, 
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      });
    } finally {
      pendingTxs.delete(txKey);
    }
  } catch (error) {
    console.error('Relay claim error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Direct Gift endpoints (for known wallets)
app.post('/create-direct-claim-hash', async (req, res) => {
  try {
    const { giftId, recipient, unlockAnswer, nonce } = req.body;
    
    const messageHash = await relayContract.createDirectClaimSignature(
      giftId,
      recipient,
      unlockAnswer,
      nonce
    );
    
    res.json({ messageHash });
  } catch (error) {
    console.error('Create direct claim hash error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/direct-nonce/:giftId', async (req, res) => {
  try {
    const { giftId } = req.params;
    const nonce = await relayContract.getDirectGiftNonce(giftId);
    res.json({ nonce: nonce.toString() });
  } catch (error) {
    console.error('Get direct nonce error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/relay-direct-claim', async (req, res) => {
  try {
    const { giftId, recipient, unlockAnswer, nonce, signature } = req.body;
    
    // Prevent duplicate transactions
    const txKey = `direct-${giftId}-${recipient}`;
    if (pendingTxs.has(txKey)) {
      return res.status(400).json({ error: 'Transaction already pending' });
    }
    
    pendingTxs.add(txKey);
    
    try {
      const tx = await relayContract.relayDirectClaimGift(
        giftId,
        recipient,
        unlockAnswer,
        nonce,
        signature
      );
      
      console.log('Direct claim transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Direct claim transaction confirmed:', receipt.transactionHash);
      
      res.json({ 
        success: true, 
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      });
    } finally {
      pendingTxs.delete(txKey);
    }
  } catch (error) {
    console.error('Relay direct claim error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const balance = await provider.getBalance(relayWallet.address);
    const blockNumber = await provider.getBlockNumber();
    
    res.json({
      status: 'healthy',
      relayAddress: relayWallet.address,
      balance: ethers.formatEther(balance) + ' ETH',
      blockNumber,
      contractAddress: RELAY_ESCROW_ADDRESS,
      network: 'sepolia'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Relay service running on port ${PORT}`);
  console.log(`Relay wallet address: ${relayWallet.address}`);
});
EOF

# Create PM2 ecosystem config for relay
echo "⚙️ Creating PM2 ecosystem config..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'geogift-relay',
    script: './simple-relay.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      RELAY_WALLET_PRIVATE_KEY: '0f66a7a3eaaa4847d0addb2623b6380b49ba4e7adecb4cf4566961d0f9d32dc3'
    }
  }]
};
EOF

# Start the relay service with PM2
echo "🚀 Starting relay service with PM2..."
pm2 delete geogift-relay 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Update Nginx to proxy relay requests
echo "🔧 Updating Nginx configuration..."
cat > /etc/nginx/sites-available/geogift-relay << 'EOF'
server {
    listen 443 ssl;
    server_name relay.geogift.io 147.182.130.29;

    ssl_certificate /etc/nginx/ssl/geogift.crt;
    ssl_certificate_key /etc/nginx/ssl/geogift.key;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the relay site
ln -sf /etc/nginx/sites-available/geogift-relay /etc/nginx/sites-enabled/

# Test and reload Nginx
nginx -t && systemctl reload nginx

echo "✅ Relay service setup complete!"
echo "📍 Relay service is running on:"
echo "   - Internal: http://localhost:3001"
echo "   - External: https://147.182.130.29:3001"
echo ""
echo "🔍 Check status with: pm2 status geogift-relay"
echo "📋 View logs with: pm2 logs geogift-relay"