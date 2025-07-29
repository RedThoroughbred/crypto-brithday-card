"""
Pydantic schemas for gift chain operations
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import IntEnum

class UnlockType(IntEnum):
    GPS = 0
    VIDEO = 1
    IMAGE = 2
    MARKDOWN = 3
    QUIZ = 4
    PASSWORD = 5
    URL = 6

class ChainStepCreate(BaseModel):
    """Schema for creating a chain step"""
    step_index: int = Field(..., ge=0, description="Step index in the chain (0-based)")
    step_title: str = Field(..., min_length=1, max_length=200, description="Step title")
    step_message: str = Field(..., max_length=1000, description="Step message/clue")
    unlock_type: UnlockType = Field(..., description="Type of unlock mechanism")
    unlock_data: Optional[Dict[str, Any]] = Field(default=None, description="Type-specific unlock data")
    latitude: Optional[float] = Field(default=None, ge=-90, le=90, description="Target latitude")
    longitude: Optional[float] = Field(default=None, ge=-180, le=180, description="Target longitude")
    radius: int = Field(default=50, ge=1, le=10000, description="Radius in meters for GPS unlock")
    step_value: str = Field(..., description="GGT value for this step (as string to avoid precision loss)")

    @validator('step_value')
    def validate_step_data(cls, v, values):
        """Validate step data based on unlock_type (runs after all fields are processed)"""
        unlock_type = values.get('unlock_type')
        unlock_data = values.get('unlock_data')
        
        if unlock_type == UnlockType.GPS:
            # GPS steps require latitude and longitude
            if not values.get('latitude') or not values.get('longitude'):
                raise ValueError("GPS unlock type requires latitude and longitude")
        elif unlock_type == UnlockType.PASSWORD:
            # Password steps require password in unlock_data
            if not unlock_data or not unlock_data.get('password'):
                raise ValueError("Password unlock type requires password in unlock_data")
        elif unlock_type == UnlockType.QUIZ:
            # Quiz steps require question and answer
            if not unlock_data or not unlock_data.get('question') or not unlock_data.get('answer'):
                raise ValueError("Quiz unlock type requires question and answer in unlock_data")
        return v

class ChainCreate(BaseModel):
    """Schema for creating a gift chain"""
    chain_title: str = Field(..., min_length=1, max_length=200, description="Chain title")
    chain_description: Optional[str] = Field(default=None, max_length=1000, description="Chain description")
    recipient_address: str = Field(..., min_length=42, max_length=42, description="Ethereum address of recipient")
    recipient_email: Optional[str] = Field(default=None, description="Email of recipient")
    total_value: str = Field(..., description="Total GGT value (as string to avoid precision loss)")
    expiry_days: int = Field(..., ge=1, le=365, description="Days until expiry")
    steps: List[ChainStepCreate] = Field(..., min_items=2, max_items=10, description="Chain steps")
    
    # Blockchain data (set after contract interaction)
    blockchain_chain_id: Optional[int] = Field(default=None, description="Chain ID from smart contract")
    transaction_hash: Optional[str] = Field(default=None, description="Creation transaction hash")

    @validator('steps')
    def validate_steps(cls, v):
        """Validate step ordering and requirements"""
        if len(v) < 2:
            raise ValueError("Chain must have at least 2 steps")
        if len(v) > 10:
            raise ValueError("Chain cannot have more than 10 steps")
        
        # Validate step indices are sequential
        for i, step in enumerate(v):
            if step.step_index != i:
                raise ValueError(f"Step {i} has incorrect step_index {step.step_index}")
        
        return v

class ChainStepResponse(BaseModel):
    """Schema for chain step responses"""
    id: str  # UUID
    chain_id: str  # UUID
    step_index: int
    step_title: str
    step_message: str
    unlock_type: UnlockType
    unlock_data: Optional[Dict[str, Any]]
    latitude: Optional[float]
    longitude: Optional[float]
    radius: int
    step_value: str
    is_completed: bool
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class ChainResponse(BaseModel):
    """Schema for chain responses"""
    id: str  # UUID
    chain_title: str
    chain_description: Optional[str]
    giver_address: str
    recipient_address: str
    recipient_email: Optional[str]
    total_value: str
    total_steps: int
    current_step: int
    is_completed: bool
    is_expired: bool
    expiry_date: datetime
    blockchain_chain_id: Optional[int]
    transaction_hash: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    
    # Include steps if requested
    steps: Optional[List[ChainStepResponse]] = None

    class Config:
        from_attributes = True

class ChainClaimCreate(BaseModel):
    """Schema for recording a chain step claim attempt"""
    chain_id: int = Field(..., description="Database chain ID")
    step_index: int = Field(..., ge=0, description="Step index being claimed")
    claimer_address: str = Field(..., min_length=42, max_length=42, description="Address attempting claim")
    user_latitude: Optional[float] = Field(default=None, description="User's latitude during claim")
    user_longitude: Optional[float] = Field(default=None, description="User's longitude during claim")
    unlock_data: Optional[Dict[str, Any]] = Field(default=None, description="Unlock attempt data")
    transaction_hash: Optional[str] = Field(default=None, description="Blockchain transaction hash")
    was_successful: bool = Field(..., description="Whether the claim was successful")
    error_message: Optional[str] = Field(default=None, description="Error message if unsuccessful")

class ChainClaimResponse(BaseModel):
    """Schema for chain claim responses"""
    id: int
    chain_id: int
    step_index: int
    claimer_address: str
    user_latitude: Optional[float]
    user_longitude: Optional[float]
    unlock_data: Optional[Dict[str, Any]]
    transaction_hash: Optional[str]
    was_successful: bool
    error_message: Optional[str]
    claimed_at: datetime

    class Config:
        from_attributes = True

class ChainListResponse(BaseModel):
    """Schema for chain list responses"""
    chains: List[ChainResponse]
    total: int
    page: int
    per_page: int

class ChainStatsResponse(BaseModel):
    """Schema for chain statistics"""
    total_chains: int
    completed_chains: int
    active_chains: int
    total_value_locked: str
    total_claims_attempted: int
    total_successful_claims: int
    average_completion_rate: float