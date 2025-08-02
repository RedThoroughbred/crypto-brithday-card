const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');
// Try different contract addresses (including non-gasless ones)
const contracts = [
  '0x0dA21305e6860bbBea457D44b02BDaf287eE856D', // SimpleRelayEscrow
  '0x41d62a76aF050097Bb9e8995c6B865588dFF6547', // GGTLocationChainEscrow  
  '0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171', // GGTLocationEscrow
  '0x7cAaf328D23C257A2c1e902Ddd5Cc017963f64b1', // Original LocationEscrow
];

// Try both function names for SimpleRelayEscrow
const RELAY_ESCROW_ABI = [
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
    "inputs": [{"name": "giftId", "type": "bytes32"}],
    "name": "directGifts",
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
  }
];

async function checkGift() {
  const giftId = '0x6cec4f342ab3a850c06a6893d6df55f33c973d02ad301e2b39b7354975a682ed';
  
  for (const address of contracts) {
    console.log(`\nChecking contract: ${address}`);
    const contract = new ethers.Contract(address, RELAY_ESCROW_ABI, provider);
    
    try {
      // Try getDirectGift function first
      const gift = await contract.getDirectGift(giftId);
      console.log('✅ Gift found via getDirectGift!', {
        sender: gift[0],
        recipient: gift[1],
        ggtAmount: gift[2].toString(),
        gasAllowance: gift[3].toString(),
        expiry: new Date(Number(gift[4]) * 1000),
        claimed: gift[5],
        refunded: gift[6],
        message: gift[7],
        unlockType: gift[8],
        unlockData: gift[9]
      });
      return address;
    } catch (error1) {
      try {
        // Try directGifts mapping
        const gift = await contract.directGifts(giftId);
        console.log('✅ Gift found via directGifts mapping!', {
          sender: gift[0],
          recipient: gift[1],
          ggtAmount: gift[2].toString(),
          gasAllowance: gift[3].toString(),
          expiry: new Date(Number(gift[4]) * 1000),
          claimed: gift[5],
          refunded: gift[6],
          message: gift[7],
          unlockType: gift[8],
          unlockData: gift[9]
        });
        return address;
      } catch (error2) {
        console.log('❌ Not found in this contract');
      }
    }
  }
  
  console.log('Gift not found in any contract');
}

checkGift();