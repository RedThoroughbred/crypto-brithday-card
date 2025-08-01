#!/usr/bin/env node

/**
 * Simple Relay Service for GeoGift Gasless Claims
 * 
 * This service monitors for gasless claim requests and submits them
 * using Wallet 2 (relay wallet) while getting gas costs refunded.
 * 
 * Usage: node relay-service.js
 * 
 * Make sure to:
 * 1. Set PRIVATE_KEY_WALLET_2 environment variable
 * 2. Have SepoliaETH in Wallet 2 for gas
 * 3. Run this script while testing gasless claims
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY';
const RELAY_ESCROW_ADDRESS = '0x8284ab51a3221c7b295f949512B43DA1EB0Cd44f';
const RELAY_WALLET_PRIVATE_KEY = process.env.PRIVATE_KEY_WALLET_2; // You need to set this

// Wallet addresses
const WALLET_2_RELAY = '0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F';

// Contract ABI (minimal for our needs)
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
    "inputs": [{"name": "giftId", "type": "bytes32"}],
    "name": "getGiftNonce",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "giftId", "type": "bytes32"}],
    "name": "isClaimable",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

class RelayService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    this.running = false;
    this.pendingClaims = new Map();
    
    if (!RELAY_WALLET_PRIVATE_KEY) {
      console.error('❌ Please set PRIVATE_KEY_WALLET_2 environment variable');
      process.exit(1);
    }
    
    this.relayWallet = new ethers.Wallet(RELAY_WALLET_PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(RELAY_ESCROW_ADDRESS, RELAY_ESCROW_ABI, this.relayWallet);
    
    console.log('🚀 Relay Service initialized');
    console.log('📍 Contract:', RELAY_ESCROW_ADDRESS);
    console.log('👤 Relay Wallet:', this.relayWallet.address);
  }
  
  async start() {
    console.log('\n⚡ Starting Relay Service...');
    this.running = true;
    
    // Check wallet balance
    const balance = await this.provider.getBalance(this.relayWallet.address);
    console.log(`💰 Relay wallet balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther('0.001')) {
      console.warn('⚠️  Warning: Low ETH balance. Add more ETH to wallet for gas fees.');
    }
    
    // Start monitoring
    console.log('👀 Monitoring for gasless claim requests...');
    console.log('📱 Use the frontend to create and claim gifts!');
    console.log('🛑 Press Ctrl+C to stop\n');
    
    // Simple polling approach (in production, you'd use websockets or events)
    this.monitorLoop();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down relay service...');
      this.running = false;
      process.exit(0);
    });
  }
  
  async monitorLoop() {
    while (this.running) {
      try {
        // Check for any pending claims in our queue
        await this.processPendingClaims();
        
        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('❌ Error in monitor loop:', error.message);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait longer on error
      }
    }
  }
  
  async processPendingClaims() {
    for (const [claimId, claimData] of this.pendingClaims) {
      try {
        console.log(`⚡ Processing gasless claim: ${claimId}`);
        await this.processClaim(claimData);
        this.pendingClaims.delete(claimId);
      } catch (error) {
        console.error(`❌ Failed to process claim ${claimId}:`, error.message);
        
        // Remove failed claims after 5 minutes
        if (Date.now() - claimData.timestamp > 300000) {
          console.log(`🗑️  Removing expired claim: ${claimId}`);
          this.pendingClaims.delete(claimId);
        }
      }
    }
  }
  
  async processClaim(claimData) {
    const { giftId, recipient, claimCode, unlockAnswer, signature } = claimData;
    
    // Get current nonce for the gift
    const nonce = await this.contract.getGiftNonce(giftId);
    
    // Check if gift is still claimable
    const isClaimable = await this.contract.isClaimable(giftId);
    if (!isClaimable) {
      throw new Error('Gift is no longer claimable');
    }
    
    console.log(`📝 Submitting claim transaction for recipient: ${recipient}`);
    
    // Submit the relay claim transaction
    const tx = await this.contract.relayClaimGift(
      giftId,
      recipient,
      claimCode,
      unlockAnswer,
      nonce,
      signature,
      {
        gasLimit: 300000 // Set reasonable gas limit
      }
    );
    
    console.log(`📤 Transaction submitted: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Gasless claim successful! Block: ${receipt.blockNumber}`);
    console.log(`💰 Gas cost will be refunded from gift's allowance\n`);
  }
  
  // API endpoint for receiving claim requests (called by frontend)
  addClaimRequest(giftId, recipient, claimCode, unlockAnswer, signature) {
    const claimId = `${giftId}-${recipient}`;
    
    console.log(`📥 New gasless claim request received:`);
    console.log(`   Gift ID: ${giftId}`);
    console.log(`   Recipient: ${recipient}`);
    console.log(`   Claim ID: ${claimId}\n`);
    
    this.pendingClaims.set(claimId, {
      giftId,
      recipient,
      claimCode,
      unlockAnswer,
      signature,
      timestamp: Date.now()
    });
  }
}

// Start the relay service
if (require.main === module) {
  const relayService = new RelayService();
  relayService.start().catch(console.error);
}

module.exports = { RelayService };