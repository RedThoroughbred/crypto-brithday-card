import { ethers } from 'ethers';

/**
 * Generate a human-readable claim code
 */
export function generateClaimCode(): string {
  const adjectives = ['HAPPY', 'LUCKY', 'MAGIC', 'SUPER', 'BRIGHT', 'SWEET', 'COOL', 'AMAZING'];
  const nouns = ['GIFT', 'PRESENT', 'TREASURE', 'SURPRISE', 'REWARD', 'TOKEN', 'COIN'];
  const years = ['2025'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const year = years[0];
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${adjective}-${noun}-${year}-${random}`;
}

/**
 * Generate claim hash from claim code
 */
export function generateClaimHash(claimCode: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(claimCode));
}

/**
 * Generate unlock hash for password/quiz verification
 */
export function generateUnlockHash(answer: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(answer.toLowerCase().trim()));
}

/**
 * Verify claim code format
 */
export function isValidClaimCode(claimCode: string): boolean {
  // Pattern: WORD-WORD-YEAR-ABC (e.g., HAPPY-GIFT-2025-XYZ)
  const pattern = /^[A-Z]+-[A-Z]+-\d{4}-[A-Z0-9]{3}$/;
  return pattern.test(claimCode);
}

/**
 * Format claim code for display (add spaces for readability)
 */
export function formatClaimCodeForDisplay(claimCode: string): string {
  return claimCode.replace(/-/g, ' - ');
}

/**
 * Clean claim code input (remove spaces, uppercase)
 */
export function cleanClaimCodeInput(input: string): string {
  return input.replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '').toUpperCase();
}

/**
 * New User Gift creation parameters
 */
export interface NewUserGiftParams {
  claimCode: string;
  amount: string; // In GGT tokens
  expiryDays: number;
  message: string;
  unlockType: 'simple' | 'gps' | 'password' | 'quiz';
  unlockAnswer?: string; // For password/quiz
  unlockData?: string; // For GPS coordinates, quiz question, etc.
}

/**
 * Prepare new user gift parameters for contract call
 */
export function prepareNewUserGiftParams(params: NewUserGiftParams) {
  const claimHash = generateClaimHash(params.claimCode);
  const unlockHash = params.unlockAnswer 
    ? generateUnlockHash(params.unlockAnswer)
    : ethers.ZeroHash;
  
  return {
    claimHash,
    amount: ethers.parseEther(params.amount), // GGT tokens have 18 decimals like ETH
    expiryDays: params.expiryDays,
    message: params.message,
    unlockType: params.unlockType,
    unlockHash,
    unlockData: params.unlockData || ''
  };
}

/**
 * New User Gift claim parameters
 */
export interface ClaimGiftParams {
  giftId: string;
  claimCode: string;
  unlockAnswer?: string;
}

/**
 * Prepare claim parameters for contract call
 */
export function prepareClaimParams(params: ClaimGiftParams) {
  return {
    giftId: params.giftId,
    claimCode: params.claimCode,
    unlockAnswer: params.unlockAnswer || ''
  };
}

/**
 * Calculate expiry date from days
 */
export function calculateExpiryDate(days: number): Date {
  const now = new Date();
  return new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
}

/**
 * Check if gift is expired
 */
export function isGiftExpired(expiryTimestamp: number): boolean {
  return Date.now() / 1000 > expiryTimestamp;
}

/**
 * Format time remaining until expiry
 */
export function formatTimeRemaining(expiryTimestamp: number): string {
  const now = Date.now() / 1000;
  const remaining = expiryTimestamp - now;
  
  if (remaining <= 0) return 'Expired';
  
  const days = Math.floor(remaining / (24 * 60 * 60));
  const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  } else {
    const minutes = Math.floor((remaining % (60 * 60)) / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  }
}