// Smart Contract Configuration for GeoGift
import { Address } from 'viem';

export const LOCATION_ESCROW_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address;
export const LOCATION_CHAIN_ESCROW_ADDRESS = '0x923F721fD04611eA9075e3ebc240CeAd10Bd2859' as const;
export const GGT_ESCROW_ADDRESS = "0xd756E3A8bBF1d457805d3f1Cb9793038DFef5171" as Address;
export const GGT_CHAIN_ESCROW_ADDRESS = "0x41d62a76aF050097Bb9e8995c6B865588dFF6547" as Address;

// LocationEscrow Contract ABI - Only the functions we need for the frontend
export const LOCATION_ESCROW_ABI = [
  {
    "inputs": [
      { "internalType": "address payable", "name": "recipient", "type": "address" },
      { "internalType": "int256", "name": "latitude", "type": "int256" },
      { "internalType": "int256", "name": "longitude", "type": "int256" },
      { "internalType": "uint256", "name": "radius", "type": "uint256" },
      { "internalType": "bytes32", "name": "clueHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "expiryTime", "type": "uint256" },
      { "internalType": "bytes32", "name": "metadata", "type": "bytes32" }
    ],
    "name": "createGift",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "giftId", "type": "uint256" },
      { "internalType": "int256", "name": "userLatitude", "type": "int256" },
      { "internalType": "int256", "name": "userLongitude", "type": "int256" },
      { "internalType": "bytes", "name": "locationProof", "type": "bytes" }
    ],
    "name": "claimGift",
    "outputs": [],
    "stateMutability": "nonpayable", 
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "gifts",
    "outputs": [
      { "internalType": "address payable", "name": "giver", "type": "address" },
      { "internalType": "address payable", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "int256", "name": "latitude", "type": "int256" },
      { "internalType": "int256", "name": "longitude", "type": "int256" },
      { "internalType": "uint256", "name": "radius", "type": "uint256" },
      { "internalType": "bytes32", "name": "clueHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "expiryTime", "type": "uint256" },
      { "internalType": "bytes32", "name": "metadata", "type": "bytes32" },
      { "internalType": "bool", "name": "claimed", "type": "bool" },
      { "internalType": "bool", "name": "exists", "type": "bool" },
      { "internalType": "uint256", "name": "claimAttempts", "type": "uint256" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "giftId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "giver", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "expiryTime", "type": "uint256" }
    ],
    "name": "GiftCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "giftId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "claimer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "GiftClaimed",
    "type": "event"
  }
] as const;

// LocationChainEscrow Contract ABI - Only the functions we need for chains
export const LOCATION_CHAIN_ESCROW_ABI = [
  {
    "inputs": [
      { "internalType": "address payable", "name": "recipient", "type": "address" },
      { "internalType": "int256[2][]", "name": "stepLocations", "type": "int256[2][]" },
      { "internalType": "uint256[]", "name": "stepRadii", "type": "uint256[]" },
      { "internalType": "string[]", "name": "stepMessages", "type": "string[]" },
      { "internalType": "string[]", "name": "stepTitles", "type": "string[]" },
      { "internalType": "string", "name": "chainTitle", "type": "string" },
      { "internalType": "uint256", "name": "chainExpiryTime", "type": "uint256" },
      { "internalType": "bytes32", "name": "chainMetadata", "type": "bytes32" }
    ],
    "name": "createGiftChain",
    "outputs": [{ "internalType": "uint256", "name": "chainId", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "chains",
    "outputs": [
      { "internalType": "uint256", "name": "chainId", "type": "uint256" },
      { "internalType": "address payable", "name": "giver", "type": "address" },
      { "internalType": "address payable", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "totalValue", "type": "uint256" },
      { "internalType": "uint256", "name": "currentStep", "type": "uint256" },
      { "internalType": "uint256", "name": "totalSteps", "type": "uint256" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "uint256", "name": "chainExpiryTime", "type": "uint256" },
      { "internalType": "bool", "name": "chainCompleted", "type": "bool" },
      { "internalType": "bool", "name": "chainExpired", "type": "bool" },
      { "internalType": "bytes32", "name": "chainMetadata", "type": "bytes32" },
      { "internalType": "string", "name": "chainTitle", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "chainId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "giver", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "totalSteps", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "totalValue", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "chainTitle", "type": "string" }
    ],
    "name": "ChainCreated",
    "type": "event"
  }
] as const;

// GGT Escrow Contract ABI - For GGT token gifts
export const GGT_ESCROW_ABI = [
  {
    "inputs": [
      { "internalType": "address payable", "name": "recipient", "type": "address" },
      { "internalType": "int256", "name": "latitude", "type": "int256" },
      { "internalType": "int256", "name": "longitude", "type": "int256" },
      { "internalType": "uint256", "name": "radius", "type": "uint256" },
      { "internalType": "bytes32", "name": "clueHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "expiryTime", "type": "uint256" },
      { "internalType": "bytes32", "name": "metadata", "type": "bytes32" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "createGift",
    "outputs": [{ "internalType": "uint256", "name": "giftId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "giftId", "type": "uint256" },
      { "internalType": "int256", "name": "userLatitude", "type": "int256" },
      { "internalType": "int256", "name": "userLongitude", "type": "int256" },
      { "internalType": "bytes", "name": "locationProof", "type": "bytes" }
    ],
    "name": "claimGift",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "gifts",
    "outputs": [
      { "internalType": "address payable", "name": "giver", "type": "address" },
      { "internalType": "address payable", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "int256", "name": "latitude", "type": "int256" },
      { "internalType": "int256", "name": "longitude", "type": "int256" },
      { "internalType": "uint256", "name": "radius", "type": "uint256" },
      { "internalType": "bytes32", "name": "clueHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "expiryTime", "type": "uint256" },
      { "internalType": "bytes32", "name": "metadata", "type": "bytes32" },
      { "internalType": "bool", "name": "claimed", "type": "bool" },
      { "internalType": "bool", "name": "exists", "type": "bool" },
      { "internalType": "uint256", "name": "claimAttempts", "type": "uint256" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ggtToken",
    "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// GGT Chain Escrow Contract ABI - For GGT token multi-step chains
export const GGT_CHAIN_ESCROW_ABI = [
  {
    "inputs": [
      { "internalType": "address payable", "name": "recipient", "type": "address" },
      { "internalType": "uint256[]", "name": "stepValues", "type": "uint256[]" },
      { "internalType": "int256[2][]", "name": "stepLocations", "type": "int256[2][]" },
      { "internalType": "uint256[]", "name": "stepRadii", "type": "uint256[]" },
      { "internalType": "uint8[]", "name": "stepUnlockTypes", "type": "uint8[]" },
      { "internalType": "bytes32[]", "name": "stepUnlockData", "type": "bytes32[]" },
      { "internalType": "string[]", "name": "stepMessages", "type": "string[]" },
      { "internalType": "string[]", "name": "stepTitles", "type": "string[]" },
      { "internalType": "string", "name": "chainTitle", "type": "string" },
      { "internalType": "uint256", "name": "chainExpiryTime", "type": "uint256" },
      { "internalType": "bytes32", "name": "chainMetadata", "type": "bytes32" }
    ],
    "name": "createGiftChain",
    "outputs": [{ "internalType": "uint256", "name": "chainId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "chainId", "type": "uint256" },
      { "internalType": "uint256", "name": "stepIndex", "type": "uint256" },
      { "internalType": "int256", "name": "userLatitude", "type": "int256" },
      { "internalType": "int256", "name": "userLongitude", "type": "int256" },
      { "internalType": "bytes", "name": "unlockProof", "type": "bytes" }
    ],
    "name": "claimStep",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "chains",
    "outputs": [
      { "internalType": "uint256", "name": "chainId", "type": "uint256" },
      { "internalType": "address payable", "name": "giver", "type": "address" },
      { "internalType": "address payable", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "totalValue", "type": "uint256" },
      { "internalType": "uint256", "name": "currentStep", "type": "uint256" },
      { "internalType": "uint256", "name": "totalSteps", "type": "uint256" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "uint256", "name": "chainExpiryTime", "type": "uint256" },
      { "internalType": "bool", "name": "chainCompleted", "type": "bool" },
      { "internalType": "bool", "name": "chainExpired", "type": "bool" },
      { "internalType": "string", "name": "chainTitle", "type": "string" },
      { "internalType": "bytes32", "name": "chainMetadata", "type": "bytes32" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "chainId", "type": "uint256" }],
    "name": "getChain",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "chainId", "type": "uint256" },
          { "internalType": "address payable", "name": "giver", "type": "address" },
          { "internalType": "address payable", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "totalValue", "type": "uint256" },
          { "internalType": "uint256", "name": "currentStep", "type": "uint256" },
          { "internalType": "uint256", "name": "totalSteps", "type": "uint256" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
          { "internalType": "uint256", "name": "chainExpiryTime", "type": "uint256" },
          { "internalType": "bool", "name": "chainCompleted", "type": "bool" },
          { "internalType": "bool", "name": "chainExpired", "type": "bool" },
          { "internalType": "string", "name": "chainTitle", "type": "string" },
          { "internalType": "bytes32", "name": "chainMetadata", "type": "bytes32" }
        ],
        "internalType": "struct GGTLocationChainEscrow.GiftChain",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "chainId", "type": "uint256" }],
    "name": "getChainSteps",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "chainId", "type": "uint256" },
          { "internalType": "uint256", "name": "stepIndex", "type": "uint256" },
          { "internalType": "uint256", "name": "stepValue", "type": "uint256" },
          { "internalType": "int256", "name": "latitude", "type": "int256" },
          { "internalType": "int256", "name": "longitude", "type": "int256" },
          { "internalType": "uint256", "name": "radius", "type": "uint256" },
          { "internalType": "uint8", "name": "unlockType", "type": "uint8" },
          { "internalType": "bytes32", "name": "unlockData", "type": "bytes32" },
          { "internalType": "string", "name": "stepMessage", "type": "string" },
          { "internalType": "bytes32", "name": "stepMetadata", "type": "bytes32" },
          { "internalType": "uint256", "name": "unlockTime", "type": "uint256" },
          { "internalType": "bool", "name": "isUnlocked", "type": "bool" },
          { "internalType": "bool", "name": "isCompleted", "type": "bool" },
          { "internalType": "string", "name": "stepTitle", "type": "string" },
          { "internalType": "uint256", "name": "claimAttempts", "type": "uint256" }
        ],
        "internalType": "struct GGTLocationChainEscrow.ChainStep[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "chainId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "giver", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "totalSteps", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "totalValue", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "chainTitle", "type": "string" }
    ],
    "name": "ChainCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "chainId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "stepIndex", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "claimer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "stepValue", "type": "uint256" }
    ],
    "name": "StepCompleted",
    "type": "event"
  }
] as const;

// Helper function to create gift metadata hash
export function createMetadataHash(message: string): `0x${string}` {
  // Simple hash for now - in production would use proper encoding
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Create a simple hash (this is not cryptographically secure - just for demo)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex and pad to 32 bytes
  const hexHash = Math.abs(hash).toString(16).padStart(64, '0');
  return `0x${hexHash}` as `0x${string}`;
}

// Helper function to create clue hash  
export function createClueHash(clue: string): `0x${string}` {
  return createMetadataHash(clue);
}

// Helper to convert coordinates to contract format (multiply by 1e6 for precision)
export function coordinateToContract(coord: number): bigint {
  return BigInt(Math.floor(coord * 1_000_000));
}

// Helper to convert contract coordinates back to decimal
export function coordinateFromContract(coord: bigint): number {
  return Number(coord) / 1_000_000;
}

// Helper to calculate expiry timestamp
export function calculateExpiryTime(days: number): bigint {
  const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
  const expirySeconds = days * 24 * 60 * 60; // Convert days to seconds
  return BigInt(now + expirySeconds);
}