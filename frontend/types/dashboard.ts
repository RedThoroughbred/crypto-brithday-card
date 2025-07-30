// Dashboard-specific types

export interface DashboardStats {
  total_gifts_sent: number;
  total_chains_sent: number;
  total_gifts_received: number;
  total_chains_received: number;
  total_ggt_spent: number;
  total_ggt_received: number;
  active_gifts: number;
  active_chains: number;
  completion_rate: number;
  popular_unlock_types: Array<{
    type: string;
    count: number;
  }>;
  recent_activity: Array<{
    type: string;
    id: string;
    recipient: string;
    amount: number;
    status: string;
    created_at: string;
  }>;
}

export interface DashboardGift {
  id: string;
  blockchain_gift_id?: number;
  recipient_address: string;
  recipient_email?: string;
  amount: number;
  currency: string;
  message: string;
  unlock_type: string;
  status: 'active' | 'claimed' | 'expired';
  created_at: string;
  claimed_at?: string;
  expiry_date?: string;
  transaction_hash: string;
  share_url: string;
}

export interface DashboardChain {
  id: string;
  blockchain_chain_id?: number;
  chain_title: string;
  chain_description?: string;
  recipient_address: string;
  recipient_email?: string;
  total_value: number;
  total_steps: number;
  current_step: number;
  completion_percentage: number;
  status: 'active' | 'completed' | 'expired';
  created_at: string;
  completed_at?: string;
  expiry_date?: string;
  transaction_hash: string;
  share_url: string;
  steps_summary: Array<{
    index: number;
    title: string;
    type: string;
    completed: boolean;
  }>;
}

export interface DashboardGiftListResponse {
  gifts: DashboardGift[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface DashboardChainListResponse {
  chains: DashboardChain[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}