import { keccak256, toBytes } from 'viem';

export type UnlockType = 'gps' | 'video' | 'image' | 'markdown' | 'quiz' | 'password' | 'url';

export const UNLOCK_TYPES = {
  GPS: 0,
  VIDEO: 1,
  IMAGE: 2,
  MARKDOWN: 3,
  QUIZ: 4,
  PASSWORD: 5,
  URL: 6,
} as const;

export const UNLOCK_TYPE_LABELS = {
  gps: 'GPS Location',
  video: 'Watch Video',
  image: 'View Image',
  markdown: 'Read Message',
  quiz: 'Answer Question',
  password: 'Enter Password',
  url: 'Visit Website',
} as const;

// Helper to create clue hash for different types
export function createClueHash(unlockType: UnlockType, data: any): string {
  switch (unlockType) {
    case 'gps':
      // For GPS, we don't need a clue hash, just coordinates
      return keccak256(toBytes('GPS_LOCATION'));
    
    case 'password':
      // Hash the password for on-chain verification
      return keccak256(toBytes(data.password || ''));
    
    case 'quiz':
      // Hash the correct answer for on-chain verification
      return keccak256(toBytes(data.answer || ''));
    
    case 'markdown':
      // Store hash of content for integrity
      return keccak256(toBytes(data.content || ''));
    
    case 'video':
    case 'image':
    case 'url':
      // Store hash of URL for reference
      return keccak256(toBytes(data.url || ''));
    
    default:
      return keccak256(toBytes(''));
  }
}

// Helper to prepare unlock data for contract call
export function prepareUnlockData(
  unlockType: UnlockType, 
  stepData: any,
  userInput?: any
): {
  lat: number;
  lng: number;
  unlockBytes: `0x${string}`;
} {
  switch (unlockType) {
    case 'gps':
      // GPS uses actual coordinates
      return {
        lat: userInput?.lat || 0,
        lng: userInput?.lng || 0,
        unlockBytes: '0x',
      };
    
    case 'password':
    case 'quiz':
      // Password/Quiz send hashed answer for verification
      const answer = userInput?.password || userInput?.answer || '';
      const answerHash = keccak256(toBytes(answer));
      return {
        lat: 0,
        lng: 0,
        unlockBytes: answerHash as `0x${string}`,
      };
    
    default:
      // Other types just need to signal completion
      return {
        lat: 0,
        lng: 0,
        unlockBytes: '0x',
      };
  }
}

// Verify unlock on frontend before sending to contract
export function verifyUnlock(
  unlockType: UnlockType,
  stepData: any,
  userInput: any
): { valid: boolean; error?: string } {
  switch (unlockType) {
    case 'gps':
      if (!userInput?.lat || !userInput?.lng) {
        return { valid: false, error: 'Location required' };
      }
      // Contract will verify distance
      return { valid: true };
    
    case 'password':
      if (!userInput?.password) {
        return { valid: false, error: 'Password required' };
      }
      // Contract will verify hash
      return { valid: true };
    
    case 'quiz':
      if (!userInput?.answer) {
        return { valid: false, error: 'Answer required' };
      }
      // Contract will verify hash
      return { valid: true };
    
    case 'markdown':
    case 'video':
    case 'image':
    case 'url':
      // These are view-only, always valid after viewing
      return { valid: true };
    
    default:
      return { valid: false, error: 'Unknown unlock type' };
  }
}