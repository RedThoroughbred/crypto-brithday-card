// Core application types for GeoGift platform

export interface User {
  address: string;
  ensName?: string;
  avatar?: string;
  createdAt: string;
  lastActive: string;
}

export interface Gift {
  id: string;
  giver: string;
  recipient: string;
  amount: string;
  currency: 'ETH' | 'MATIC' | 'USDC';
  message: string;
  clue: string;
  targetLat: number;
  targetLng: number;
  radius: number;
  status: 'active' | 'claimed' | 'expired' | 'cancelled';
  createdAt: string;
  claimedAt?: string;
  expiryDate: string;
  transactionHash?: string;
  claimTransactionHash?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface CreateGiftParams {
  recipientAddress: string;
  amount: string;
  currency: 'ETH' | 'MATIC' | 'USDC';
  message: string;
  clue: string;
  targetLat: number;
  targetLng: number;
  radius: number;
  expiryDays: number;
}

export interface ClaimGiftParams {
  giftId: string;
  userLat: number;
  userLng: number;
  userAddress: string;
}

export interface UserStats {
  totalGifts: number;
  totalValue: string;
  activeGifts: number;
  claimedGifts: number;
  giftsSent: number;
  giftsReceived: number;
  favoriteLocation?: string;
  memberSince: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  category: 'creation' | 'claiming' | 'exploration' | 'value';
}

export interface NotificationSettings {
  email?: string;
  giftCreated: boolean;
  giftClaimed: boolean;
  giftExpiring: boolean;
  newsletter: boolean;
}

export interface PrivacySettings {
  profilePublic: boolean;
  showActivity: boolean;
  allowAnalytics: boolean;
}

export interface DefaultSettings {
  defaultRadius: number;
  defaultExpiry: number;
  defaultCurrency: 'ETH' | 'MATIC' | 'USDC';
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  defaults: DefaultSettings;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LocationVerificationResult {
  isValid: boolean;
  distance: number;
  accuracy: number;
  timestamp: number;
  canClaim: boolean;
}

export interface ContractEvent {
  type: 'GiftCreated' | 'GiftClaimed' | 'GiftExpired';
  giftId: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  data: any;
}

export interface MapConfig {
  defaultLat: number;
  defaultLng: number;
  defaultZoom: number;
  style: string;
  accessToken: string;
}

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
}

// Utility types
export type GiftStatus = Gift['status'];
export type Currency = Gift['currency'];
export type AchievementCategory = Achievement['category'];

// Form types
export type CreateGiftFormData = Omit<CreateGiftParams, 'targetLat' | 'targetLng'> & {
  location?: Location;
};

export type ClaimGiftFormData = Omit<ClaimGiftParams, 'userLat' | 'userLng'> & {
  location?: Location;
};

// API endpoint types
export interface ApiEndpoints {
  auth: {
    nonce: string;
    verify: string;
    logout: string;
  };
  gifts: {
    create: string;
    list: string;
    get: string;
    claim: string;
    cancel: string;
  };
  user: {
    profile: string;
    settings: string;
    stats: string;
    achievements: string;
  };
  location: {
    verify: string;
    geocode: string;
  };
}

// Blockchain types
export interface ContractConfig {
  address: string;
  abi: any[];
  chainId: number;
}

export interface TransactionResult {
  hash: string;
  blockNumber: number;
  gasUsed: string;
  success: boolean;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export interface LocationError extends AppError {
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
}

export interface ContractError extends AppError {
  type: 'INSUFFICIENT_FUNDS' | 'USER_REJECTED' | 'NETWORK_ERROR' | 'CONTRACT_ERROR';
  transactionHash?: string;
}

// Step unlock types for multi-step chains
export type StepUnlockType = 'gps' | 'video' | 'image' | 'markdown' | 'quiz' | 'password' | 'url';

export interface StepUnlockData {
  // GPS unlock
  latitude?: number;
  longitude?: number;
  radius?: number;
  
  // Media unlock
  mediaUrl?: string; // YouTube, image URL, etc
  mediaType?: 'youtube' | 'image' | 'video' | 'vimeo';
  
  // Content unlock
  markdownContent?: string;
  
  // Quiz unlock
  question?: string;
  answer?: string;
  hints?: string[];
  
  // Password unlock
  password?: string;
  passwordHint?: string;
  
  // URL unlock (visit a website)
  targetUrl?: string;
  urlInstruction?: string;
}

export interface ChainStep {
  id: string;
  title: string;
  message: string;
  unlockType: StepUnlockType;
  unlockData: StepUnlockData;
  order: number;
  // Visual customization
  emoji?: string;
  color?: string;
  // Reward info
  rewardAmount?: string;
  rewardToken?: 'ETH' | 'GGT'; // Support your custom token!
}

// Email template data
export interface GiftEmailData {
  recipientName?: string;
  recipientEmail: string;
  senderName?: string;
  giftType: 'single' | 'chain';
  giftTitle: string;
  giftMessage: string;
  totalAmount: string;
  currency: 'ETH' | 'GGT';
  claimUrl: string;
  expiryDate: string;
  // Chain specific
  totalSteps?: number;
  firstStepTitle?: string;
  firstStepType?: StepUnlockType;
  estimatedDuration?: string;
  theme?: 'birthday' | 'anniversary' | 'proposal' | 'holiday' | 'custom';
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface PageProps {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
}