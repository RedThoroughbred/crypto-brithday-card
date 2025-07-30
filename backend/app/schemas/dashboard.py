"""
Dashboard schemas for API responses
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DashboardStats(BaseModel):
    """Aggregate statistics for user dashboard"""
    total_gifts_sent: int = Field(description="Total number of single gifts created")
    total_chains_sent: int = Field(description="Total number of gift chains created")
    total_gifts_received: int = Field(description="Total number of gifts received")
    total_chains_received: int = Field(description="Total number of chains received")
    total_ggt_spent: float = Field(description="Total GGT tokens spent on gifts")
    total_ggt_received: float = Field(description="Total GGT tokens received")
    active_gifts: int = Field(description="Number of unclaimed gifts")
    active_chains: int = Field(description="Number of incomplete chains")
    completion_rate: float = Field(description="Percentage of gifts/chains claimed")
    popular_unlock_types: List[Dict[str, Any]] = Field(
        description="Most used unlock types with counts"
    )
    recent_activity: List[Dict[str, Any]] = Field(
        description="Last 5 gift/chain events"
    )


class DashboardGift(BaseModel):
    """Gift summary for dashboard display"""
    id: str
    blockchain_gift_id: Optional[int]
    recipient_address: str
    recipient_email: Optional[str]
    amount: float
    currency: str  # 'ETH' or 'GGT'
    message: str
    unlock_type: str
    status: str  # 'active', 'claimed', 'expired'
    created_at: datetime
    claimed_at: Optional[datetime]
    expiry_date: Optional[datetime]
    transaction_hash: str
    share_url: str
    
    class Config:
        from_attributes = True


class DashboardChain(BaseModel):
    """Chain summary for dashboard display"""
    id: str
    blockchain_chain_id: Optional[int]
    chain_title: str
    chain_description: Optional[str]
    recipient_address: str
    recipient_email: Optional[str]
    total_value: float
    total_steps: int
    current_step: int
    completion_percentage: float
    status: str  # 'active', 'completed', 'expired'
    created_at: datetime
    completed_at: Optional[datetime]
    expiry_date: Optional[datetime]
    transaction_hash: str
    share_url: str
    steps_summary: List[Dict[str, Any]]  # Brief step info
    
    class Config:
        from_attributes = True


class DashboardGiftListResponse(BaseModel):
    """Paginated response for gift lists"""
    gifts: List[DashboardGift]
    total: int
    page: int
    per_page: int
    has_more: bool


class DashboardChainListResponse(BaseModel):
    """Paginated response for chain lists"""
    chains: List[DashboardChain]
    total: int
    page: int
    per_page: int
    has_more: bool