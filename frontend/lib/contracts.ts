// Smart Contract Configuration for GeoGift
import { Address } from 'viem';

export const LOCATION_ESCROW_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address;

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