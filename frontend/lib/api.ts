/**
 * API Client for GeoGift Backend
 * 
 * Provides type-safe client functions for interacting with the FastAPI backend.
 * Handles authentication, error handling, and data transformation.
 */

import { UnlockType } from './unlock-types';

// Dashboard types
import type {
  DashboardStats,
  DashboardGift,
  DashboardChain,
  DashboardGiftListResponse,
  DashboardChainListResponse
} from '@/types/dashboard';

// Profile types
export interface UserProfile {
  wallet_address: string;
  display_name: string | null;
  bio: string | null;
  favorite_location: string | null;
  is_public_profile: boolean;
  member_since: string;
  last_activity: string | null;
}

export interface UserProfileUpdate {
  display_name?: string | null;
  bio?: string | null;
  favorite_location?: string | null;
  is_public_profile?: boolean;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  gift_notifications: boolean;
  marketing_emails: boolean;
}

export interface NotificationPreferencesUpdate {
  email_notifications?: boolean;
  gift_notifications?: boolean;
  marketing_emails?: boolean;
}

export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  category: string;
  earned: boolean;
  earned_date: string | null;
  progress?: number;
}

export interface UserAchievements {
  achievements: UserAchievement[];
  total_earned: number;
  total_available: number;
  completion_percentage: number;
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

// Type Definitions
export interface ChainStep {
  step_index: number;
  step_title: string;
  step_message: string;
  unlock_type: UnlockType;
  unlock_data?: Record<string, any>;
  latitude?: number;
  longitude?: number;
  radius: number;
  step_value: string;
  reward_content?: string;
  reward_content_type?: string;
}

export interface ChainStepResponse extends ChainStep {
  id: number;
  chain_id: number;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface ChainCreate {
  chain_title: string;
  chain_description?: string;
  recipient_address: string;
  recipient_email?: string;
  total_value: string;
  expiry_days: number;
  steps: ChainStep[];
  blockchain_chain_id?: number;
  transaction_hash?: string;
}

export interface ChainResponse {
  id: number;
  chain_title: string;
  chain_description?: string;
  giver_address: string;
  recipient_address: string;
  recipient_email?: string;
  total_value: string;
  total_steps: number;
  current_step: number;
  is_completed: boolean;
  is_expired: boolean;
  expiry_date: string;
  blockchain_chain_id?: number;
  transaction_hash?: string;
  created_at: string;
  completed_at?: string;
  steps?: ChainStepResponse[];
}

export interface ChainListResponse {
  chains: ChainResponse[];
  total: number;
  page: number;
  per_page: number;
}

export interface ChainStatsResponse {
  total_chains: number;
  completed_chains: number;
  active_chains: number;
  total_value_locked: string;
  total_claims_attempted: number;
  total_successful_claims: number;
  average_completion_rate: number;
}

export interface ChainClaimCreate {
  chain_id: number;
  step_index: number;
  claimer_address: string;
  user_latitude?: number;
  user_longitude?: number;
  unlock_data?: Record<string, any>;
  transaction_hash?: string;
  was_successful: boolean;
  error_message?: string;
}

export interface ChainClaimResponse extends ChainClaimCreate {
  id: number;
  claimed_at: string;
}

// Gift API Types
export interface GiftCreate {
  recipient_address: string;
  escrow_id: string;
  lat: number;
  lon: number;
  message?: string;
  unlock_type?: 'GPS' | 'VIDEO' | 'IMAGE' | 'MARKDOWN' | 'QUIZ' | 'PASSWORD' | 'URL';
  unlock_challenge_data?: string;
  reward_content?: string;
  reward_content_type?: string;
}

export interface GiftResponse {
  id: string;
  sender: {
    id: string;
    wallet_address: string;
    created_at: string;
  };
  recipient_address: string;
  escrow_id: string;
  lat: number;
  lon: number;
  message?: string;
  status: 'PENDING' | 'CLAIMED' | 'EXPIRED';
  created_at: string;
  updated_at?: string;
}

// API Error Types
export class APIError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public response?: Response
  ) {
    super(`API Error ${status}: ${detail}`);
    this.name = 'APIError';
  }
}

// HTTP Client Utilities
class APIClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseURL = baseUrl;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorDetail = 'Unknown error';
      try {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        errorDetail = errorData.detail || errorData.message || 'Request failed';
        
        // Handle validation errors (422)
        if (response.status === 422 && Array.isArray(errorData.detail)) {
          errorDetail = errorData.detail.map((err: any) => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
        }
      } catch {
        errorDetail = response.statusText || `HTTP ${response.status}`;
      }
      throw new APIError(response.status, errorDetail, response);
    }

    try {
      return await response.json();
    } catch {
      return {} as T;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseURL + '/');
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = new URL(endpoint, this.baseURL + '/');
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const url = new URL(endpoint, this.baseURL + '/');
    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = new URL(endpoint, this.baseURL + '/');
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }
}

// Create global API client instance
const apiClient = new APIClient();

// Chain API Functions
export const chainAPI = {
  // Authentication
  setAuthToken: (token: string | null) => {
    apiClient.setAuthToken(token);
  },

  // Test endpoint
  test: (): Promise<{ status: string; message: string }> => {
    return apiClient.get('chains/health/test');
  },

  // Create a new chain
  createChain: (chainData: ChainCreate): Promise<ChainResponse> => {
    return apiClient.post('chains/', chainData);
  },

  // Get chain by database ID
  getChain: (chainId: number): Promise<ChainResponse> => {
    return apiClient.get(`chains/${chainId}`);
  },

  // Get chain by blockchain chain ID
  getChainByBlockchainId: (blockchainChainId: number): Promise<ChainResponse> => {
    return apiClient.get(`chains/blockchain/${blockchainChainId}`);
  },

  // Update chain with blockchain data
  updateChainBlockchainData: (
    chainId: number,
    blockchainChainId: number,
    transactionHash: string
  ): Promise<ChainResponse> => {
    const params = new URLSearchParams({
      blockchain_chain_id: blockchainChainId.toString(),
      transaction_hash: transactionHash,
    });
    return apiClient.put(`chains/${chainId}/blockchain?${params}`);
  },

  // List chains with filtering
  listChains: (options?: {
    giver_address?: string;
    recipient_address?: string;
    skip?: number;
    limit?: number;
  }): Promise<ChainListResponse> => {
    const params: Record<string, string> = {};
    if (options?.giver_address) params.giver_address = options.giver_address;
    if (options?.recipient_address) params.recipient_address = options.recipient_address;
    if (options?.skip !== undefined) params.skip = options.skip.toString();
    if (options?.limit !== undefined) params.limit = options.limit.toString();

    return apiClient.get('chains/', params);
  },

  // Get chain statistics
  getStatistics: (): Promise<ChainStatsResponse> => {
    return apiClient.get('chains/stats/overview');
  },

  // Record a claim attempt
  recordClaimAttempt: (
    chainId: number,
    claimData: Omit<ChainClaimCreate, 'chain_id'>
  ): Promise<ChainClaimResponse> => {
    return apiClient.post(`chains/${chainId}/claims`, {
      ...claimData,
      chain_id: chainId,
    });
  },

  // Get claim attempts for a chain
  getChainClaims: (
    chainId: number,
    options?: { skip?: number; limit?: number }
  ): Promise<ChainClaimResponse[]> => {
    const params: Record<string, string> = {};
    if (options?.skip !== undefined) params.skip = options.skip.toString();
    if (options?.limit !== undefined) params.limit = options.limit.toString();

    return apiClient.get(`chains/${chainId}/claims`, params);
  },
};

// Gift API Functions
export const giftAPI = {
  // Authentication (shared with chainAPI)
  setAuthToken: (token: string | null) => {
    apiClient.setAuthToken(token);
  },

  // Create a new single gift
  createGift: (giftData: GiftCreate): Promise<GiftResponse> => {
    return apiClient.post('gifts/', giftData);
  },

  // Get gift by database ID
  getGift: (giftId: string): Promise<GiftResponse> => {
    return apiClient.get(`gifts/${giftId}`);
  },

  // Get gift by escrow ID (used for claiming)
  getGiftByEscrowId: (escrowId: string): Promise<GiftResponse> => {
    return apiClient.get(`gifts/escrow/${escrowId}`);
  },

  // Get gifts for a specific user
  getUserGifts: (userAddress: string, options?: {
    skip?: number;
    limit?: number;
  }): Promise<GiftResponse[]> => {
    const params: Record<string, string> = {};
    if (options?.skip !== undefined) params.skip = options.skip.toString();
    if (options?.limit !== undefined) params.limit = options.limit.toString();

    return apiClient.get(`gifts/user/${userAddress}`, params);
  },

  // Update gift status (for claiming)
  updateGiftStatus: (giftId: string, status: 'PENDING' | 'CLAIMED' | 'EXPIRED'): Promise<GiftResponse> => {
    return apiClient.put(`gifts/${giftId}`, { status });
  },
};

// Map frontend unlock types to backend integer values
const mapUnlockTypeToInt = (unlockType: string): number => {
  const mapping: Record<string, number> = {
    'gps': 0,
    'video': 1, 
    'image': 2,
    'markdown': 3,
    'quiz': 4,
    'password': 5,
    'url': 6,
  };
  return mapping[unlockType?.toLowerCase()] ?? 0; // Default to GPS
};

// Utility functions for data transformation
export const chainUtils = {
  // Convert frontend step data to API format
  prepareStepForAPI: (step: any, stepIndex?: number, totalValue?: string): ChainStep => ({
    step_index: stepIndex !== undefined ? stepIndex : (step.order || step.index || step.step_index || 0),
    step_title: step.title || step.step_title || `Step ${stepIndex + 1}`,
    step_message: step.message || step.clue || step.step_message || '',
    unlock_type: mapUnlockTypeToInt(step.unlockType || step.type || step.unlock_type || 'gps'),
    unlock_data: step.unlockData || step.unlock_data || {},
    // Try multiple sources for GPS coordinates
    latitude: step.unlockData?.latitude || step.latitude || step.location?.lat,
    longitude: step.unlockData?.longitude || step.longitude || step.location?.lng,
    radius: step.unlockData?.radius || step.radius || 50,
    step_value: step.value?.toString() || step.step_value || (totalValue ? totalValue : '0.1'), // Use provided value or totalValue
    reward_content: step.rewardContent,
    reward_content_type: step.rewardContentType,
  }),

  // Convert API step data to frontend format
  formatStepFromAPI: (step: ChainStepResponse) => ({
    id: step.id,
    index: step.step_index,
    title: step.step_title,
    message: step.step_message,
    clue: step.step_message,
    type: step.unlock_type,
    unlockData: step.unlock_data,
    location: step.latitude && step.longitude ? {
      lat: step.latitude,
      lng: step.longitude,
    } : undefined,
    radius: step.radius,
    value: step.step_value,
    rewardContent: step.reward_content,
    rewardContentType: step.reward_content_type,
    isCompleted: step.is_completed,
    completedAt: step.completed_at,
    createdAt: step.created_at,
  }),

  // Convert frontend chain data to API format
  prepareChainForAPI: (chainData: any): ChainCreate => {
    const totalValue = chainData.totalValue?.toString() || chainData.total_value;
    const steps = chainData.steps || [];
    
    return {
      chain_title: chainData.title || chainData.chain_title,
      chain_description: chainData.description || chainData.chain_description,
      recipient_address: chainData.recipientAddress || chainData.recipient_address,
      recipient_email: chainData.recipientEmail || chainData.recipient_email,
      total_value: totalValue,
      expiry_days: chainData.expiryDays || chainData.expiry_days || 30,
      steps: steps.map((step: any, index: number) => {
        // Calculate step value by dividing total value evenly among steps
        const stepValue = totalValue && steps.length > 0 
          ? (parseFloat(totalValue) / steps.length).toFixed(18) 
          : '0.1';
        return chainUtils.prepareStepForAPI(step, index, stepValue);
      }),
      blockchain_chain_id: chainData.blockchainChainId || chainData.blockchain_chain_id,
      transaction_hash: chainData.transactionHash || chainData.transaction_hash,
    };
  },

  // Convert API chain to frontend format
  formatChainFromAPI: (chain: ChainResponse) => ({
    id: chain.id,
    title: chain.chain_title,
    description: chain.chain_description,
    giverAddress: chain.giver_address,
    recipientAddress: chain.recipient_address,
    recipientEmail: chain.recipient_email,
    totalValue: chain.total_value,
    totalSteps: chain.total_steps,
    currentStep: chain.current_step,
    isCompleted: chain.is_completed,
    isExpired: chain.is_expired,
    expiryDate: chain.expiry_date,
    blockchainChainId: chain.blockchain_chain_id,
    transactionHash: chain.transaction_hash,
    createdAt: chain.created_at,
    completedAt: chain.completed_at,
    steps: chain.steps?.map(chainUtils.formatStepFromAPI) || [],
  }),
};

// Dashboard API functions (new - isolated)
export const dashboardAPI = {
  // Authentication (shared with chainAPI)
  setAuthToken: (token: string | null) => {
    apiClient.setAuthToken(token);
  },

  // Get user statistics
  getStats: async (): Promise<DashboardStats> => {
    return apiClient.get('dashboard/stats');
  },

  // Get sent gifts
  getSentGifts: async (options?: { skip?: number; limit?: number }): Promise<DashboardGiftListResponse> => {
    const params: Record<string, string> = {};
    if (options?.skip !== undefined) params.skip = options.skip.toString();
    if (options?.limit !== undefined) params.limit = options.limit.toString();
    
    return apiClient.get('dashboard/gifts/sent', params);
  },

  // Get received gifts
  getReceivedGifts: async (options?: { skip?: number; limit?: number }): Promise<DashboardGiftListResponse> => {
    const params: Record<string, string> = {};
    if (options?.skip !== undefined) params.skip = options.skip.toString();
    if (options?.limit !== undefined) params.limit = options.limit.toString();
    
    return apiClient.get('dashboard/gifts/received', params);
  },

  // Get sent chains
  getSentChains: async (options?: { skip?: number; limit?: number }): Promise<DashboardChainListResponse> => {
    const params: Record<string, string> = {};
    if (options?.skip !== undefined) params.skip = options.skip.toString();
    if (options?.limit !== undefined) params.limit = options.limit.toString();
    
    return apiClient.get('dashboard/chains/sent', params);
  },

  // Get received chains
  getReceivedChains: async (options?: { skip?: number; limit?: number }): Promise<DashboardChainListResponse> => {
    const params: Record<string, string> = {};
    if (options?.skip !== undefined) params.skip = options.skip.toString();
    if (options?.limit !== undefined) params.limit = options.limit.toString();
    
    return apiClient.get('dashboard/chains/received', params);
  },
};

// Profile API functions
export const profileAPI = {
  // Authentication (shared with other APIs)
  setAuthToken: (token: string | null) => {
    apiClient.setAuthToken(token);
  },

  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    return apiClient.get('profile');
  },

  // Update user profile
  updateProfile: async (profileData: UserProfileUpdate): Promise<UserProfile> => {
    return apiClient.put('profile', profileData);
  },

  // Get notification preferences
  getPreferences: async (): Promise<NotificationPreferences> => {
    return apiClient.get('profile/preferences');
  },

  // Update notification preferences
  updatePreferences: async (preferences: NotificationPreferencesUpdate): Promise<NotificationPreferences> => {
    return apiClient.put('profile/preferences', preferences);
  },

  // Get user achievements
  getAchievements: async (): Promise<UserAchievements> => {
    return apiClient.get('profile/achievements');
  },
};

export default chainAPI;