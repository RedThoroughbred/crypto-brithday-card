const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const SEPOLIA_RPC_URL = 'https://sepolia.drpc.org';
const RELAY_ESCROW_ADDRESS = '0x0cbEf2Ceac48e08bc88D53f5Fe221E4448D95858';
const RELAY_WALLET_PRIVATE_KEY = '0f66a7a3eaaa4847d0addb2623b6380b49ba4e7adecb4cf4566961d0f9d32dc3';

// Contract ABI (SimpleRelayEscrow - the proper relay contract)
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
    "inputs": [{"name": "giftId", "type": "bytes32"}],
    "name": "getGift",
    "outputs": [
      {"name": "sender", "type": "address"},
      {"name": "ggtAmount", "type": "uint256"}, 
      {"name": "gasAllowance", "type": "uint256"},
      {"name": "expiry", "type": "uint256"},
      {"name": "claimed", "type": "bool"},
      {"name": "refunded", "type": "bool"},
      {"name": "message", "type": "string"},
      {"name": "unlockType", "type": "string"},
      {"name": "unlockData", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "giftId", "type": "bytes32"}],
    "name": "getDirectGift",
    "outputs": [
      {"name": "sender", "type": "address"},
      {"name": "recipient", "type": "address"},
      {"name": "ggtAmount", "type": "uint256"}, 
      {"name": "gasAllowance", "type": "uint256"},
      {"name": "expiry", "type": "uint256"},
      {"name": "claimed", "type": "bool"},
      {"name": "refunded", "type": "bool"},
      {"name": "message", "type": "string"},
      {"name": "unlockType", "type": "string"},
      {"name": "unlockData", "type": "string"}
    ],
    "stateMutability": "view",
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
    "inputs": [
      {"name": "giftId", "type": "bytes32"},
      {"name": "recipient", "type": "address"},
      {"name": "unlockAnswer", "type": "string"},
      {"name": "nonce", "type": "uint256"},
      {"name": "signature", "type": "bytes"}
    ],
    "name": "relayClaimDirectGift",
    "outputs": [],
    "stateMutability": "nonpayable",
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

// Initialize provider and relay wallet
console.log('🚀 Initializing Simple Relay Service...');
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const relayWallet = new ethers.Wallet(RELAY_WALLET_PRIVATE_KEY, provider);
const contract = new ethers.Contract(RELAY_ESCROW_ADDRESS, RELAY_ESCROW_ABI, relayWallet);

console.log('📍 Contract:', RELAY_ESCROW_ADDRESS);
console.log('👤 Relay Wallet:', relayWallet.address);
console.log('🔗 RPC:', SEPOLIA_RPC_URL);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    relayWallet: relayWallet.address,
    contract: RELAY_ESCROW_ADDRESS 
  });
});

// Get nonce for a gift (needed for signature)
app.get('/nonce/:giftId', async (req, res) => {
  try {
    const { giftId } = req.params;
    console.log('🔍 Getting nonce for gift:', giftId);
    
    const nonce = await contract.getGiftNonce(giftId);
    console.log('✅ Got nonce:', nonce.toString());
    
    res.json({ 
      giftId, 
      nonce: nonce.toString() 
    });
    
  } catch (error) {
    console.error('❌ Error getting nonce:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create claim message hash (for frontend to sign)
app.post('/create-claim-hash', async (req, res) => {
  try {
    const { giftId, recipient, claimCode, unlockAnswer, nonce } = req.body;
    console.log('🔨 Creating claim hash for:', { giftId, recipient, claimCode, nonce });
    
    // Get the message hash from the contract
    const messageHash = await contract.createClaimSignature(
      giftId,
      recipient,
      claimCode,
      unlockAnswer || '',
      nonce
    );
    
    console.log('✅ Created message hash:', messageHash);
    
    res.json({ 
      messageHash,
      giftId,
      recipient,
      claimCode,
      nonce: nonce.toString()
    });
    
  } catch (error) {
    console.error('❌ Error creating claim hash:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Process relay claim (relay pays gas, recipient gets tokens)
app.post('/relay-claim', async (req, res) => {
  try {
    const { giftId, recipient, claimCode, unlockAnswer, nonce, signature } = req.body;
    
    console.log('⚡ Processing relay claim:', { 
      giftId, 
      recipient, 
      claimCode, 
      nonce,
      relayWallet: relayWallet.address
    });
    
    // Submit the relay claim transaction
    const tx = await contract.relayClaimGift(
      giftId,
      recipient,
      claimCode,
      unlockAnswer || '',
      nonce,
      signature,
      {
        gasLimit: 300000 // Set reasonable gas limit
      }
    );
    
    console.log('📡 Relay claim transaction submitted:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log('✅ Relay claim confirmed:', receipt.hash);
    
    res.json({
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      relayWallet: relayWallet.address,
      recipient
    });
    
  } catch (error) {
    console.error('❌ Error processing relay claim:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.reason || 'Unknown error'
    });
  }
});

// ============================================================================
// DIRECT GIFT ENDPOINTS (for gasless claiming of known wallet gifts)
// ============================================================================

// Get nonce for a direct gift (needed for signature)
app.get('/direct-nonce/:giftId', async (req, res) => {
  try {
    const { giftId } = req.params;
    console.log('🔍 Getting direct gift nonce for:', giftId);
    
    const nonce = await contract.getDirectGiftNonce(giftId);
    console.log('✅ Got direct gift nonce:', nonce.toString());
    
    res.json({ 
      giftId, 
      nonce: nonce.toString() 
    });
    
  } catch (error) {
    console.error('❌ Error getting direct gift nonce:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create direct claim message hash (for frontend to sign)
app.post('/create-direct-claim-hash', async (req, res) => {
  try {
    const { giftId, recipient, unlockAnswer, nonce } = req.body;
    console.log('🔨 Creating direct claim hash for:', { 
      giftId, 
      recipient, 
      unlockAnswer: `"${unlockAnswer}"`, 
      unlockAnswerLength: unlockAnswer ? unlockAnswer.length : 0,
      nonce 
    });
    
    // Get the message hash from the contract
    const messageHash = await contract.createDirectClaimSignature(
      giftId,
      recipient,
      unlockAnswer || '',
      nonce
    );
    
    console.log('✅ Created direct claim message hash:', messageHash);
    
    res.json({ 
      messageHash,
      giftId,
      recipient,
      nonce: nonce.toString()
    });
    
  } catch (error) {
    console.error('❌ Error creating direct claim hash:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Process relay direct claim (relay pays gas, recipient gets tokens)
app.post('/relay-direct-claim', async (req, res) => {
  try {
    const { giftId, recipient, unlockAnswer, nonce, signature } = req.body;
    
    console.log('⚡ Processing relay direct claim:', { 
      giftId, 
      recipient, 
      unlockAnswer: `"${unlockAnswer}"`,
      unlockAnswerLength: unlockAnswer ? unlockAnswer.length : 0,
      nonce,
      relayWallet: relayWallet.address,
      signatureLength: signature ? signature.length : 0
    });
    
    // Submit the relay direct claim transaction
    const tx = await contract.relayClaimDirectGift(
      giftId,
      recipient,
      unlockAnswer || '',
      nonce,
      signature,
      {
        gasLimit: 300000 // Set reasonable gas limit
      }
    );
    
    console.log('📡 Relay direct claim transaction submitted:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log('✅ Relay direct claim confirmed:', receipt.hash);
    
    res.json({
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      relayWallet: relayWallet.address,
      recipient
    });
    
  } catch (error) {
    console.error('❌ Error processing relay direct claim:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.reason || 'Unknown error'
    });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Simple Relay service running on port ${PORT}`);
  console.log(`✅ Ready to process gasless claims!`);
  console.log(`📋 Test at: http://localhost:${PORT}/health\n`);
});

module.exports = app;