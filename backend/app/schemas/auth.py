"""
Authentication Schemas for Web3 Authentication

Defines Pydantic models for request/response validation in the
Web3 authentication flow including challenge generation and signature verification.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator


class ChallengeRequest(BaseModel):
    """Request schema for generating authentication challenge."""
    
    wallet_address: str = Field(
        ...,
        example="0x742d35Cc6634C0532925a3b8D8C12bFA3B0D9e2d",
        description="Ethereum wallet address to authenticate"
    )
    
    @validator('wallet_address')
    def validate_wallet_address(cls, v):
        """Validate wallet address format."""
        if not v or not isinstance(v, str):
            raise ValueError('Wallet address is required')
        
        # Remove whitespace
        v = v.strip()
        
        # Check basic format (0x prefix + 40 hex characters)
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid wallet address format')
        
        # Check if hex characters
        try:
            int(v[2:], 16)
        except ValueError:
            raise ValueError('Wallet address must contain valid hex characters')
        
        return v


class ChallengeResponse(BaseModel):
    """Response schema for authentication challenge."""
    
    message: str = Field(
        ...,
        description="Challenge message to be signed by the user's wallet"
    )
    nonce: str = Field(
        ...,
        description="Unique nonce for this challenge session"
    )
    wallet_address: str = Field(
        ...,
        description="Checksummed wallet address"
    )
    expires_at: str = Field(
        ...,
        description="ISO timestamp when challenge expires"
    )


class VerifySignatureRequest(BaseModel):
    """Request schema for signature verification."""
    
    wallet_address: str = Field(
        ...,
        example="0x742d35Cc6634C0532925a3b8D8C12bFA3B0D9e2d",
        description="Ethereum wallet address that signed the message"
    )
    signature: str = Field(
        ...,
        example="0x1a8bbe6eab8c72a219385681efefe565afd3accee35f516f8edf5ae82208fbd45a58f9f9116d8d88ba40fcd29076d6eada7027a3b412a9db55a0164547810cc401",
        description="Hex-encoded signature from MetaMask or other Web3 wallet"
    )
    nonce: str = Field(
        ...,
        description="Nonce from the challenge that was signed"
    )
    
    @validator('wallet_address')
    def validate_wallet_address(cls, v):
        """Validate wallet address format."""
        if not v or not isinstance(v, str):
            raise ValueError('Wallet address is required')
        
        v = v.strip()
        
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid wallet address format')
        
        try:
            int(v[2:], 16)
        except ValueError:
            raise ValueError('Wallet address must contain valid hex characters')
        
        return v
    
    @validator('signature')
    def validate_signature(cls, v):
        """Validate signature format."""
        if not v or not isinstance(v, str):
            raise ValueError('Signature is required')
        
        v = v.strip()
        
        # Check signature format (0x prefix + 130 hex characters for r+s+v)
        if not v.startswith('0x'):
            raise ValueError('Signature must start with 0x')
        
        # Remove 0x prefix for length check
        hex_part = v[2:]
        
        # Ethereum signatures are typically 65 bytes (130 hex characters)
        if len(hex_part) != 130:
            raise ValueError('Invalid signature length')
        
        try:
            int(hex_part, 16)
        except ValueError:
            raise ValueError('Signature must contain valid hex characters')
        
        return v
    
    @validator('nonce')
    def validate_nonce(cls, v):
        """Validate nonce format."""
        if not v or not isinstance(v, str):
            raise ValueError('Nonce is required')
        
        v = v.strip()
        
        # Nonce should be 64 hex characters (32 bytes)
        if len(v) != 64:
            raise ValueError('Invalid nonce length')
        
        try:
            int(v, 16)
        except ValueError:
            raise ValueError('Nonce must contain valid hex characters')
        
        return v


class AuthenticationResponse(BaseModel):
    """Response schema for successful authentication."""
    
    access_token: str = Field(
        ...,
        description="JWT access token for API authentication"
    )
    token_type: str = Field(
        default="bearer",
        description="Token type (always 'bearer')"
    )
    wallet_address: str = Field(
        ...,
        description="Authenticated wallet address"
    )
    expires_in: int = Field(
        ...,
        description="Token expiration time in seconds"
    )


class WalletInfoResponse(BaseModel):
    """Response schema for wallet information."""
    
    wallet_address: str = Field(
        ...,
        description="Checksummed wallet address"
    )
    is_valid: bool = Field(
        ...,
        description="Whether the wallet address is valid"
    )
    checksum: bool = Field(
        ...,
        description="Whether the address is properly checksummed"
    )


class AuthErrorResponse(BaseModel):
    """Error response schema for authentication failures."""
    
    detail: str = Field(
        ...,
        description="Error message"
    )
    error_code: Optional[str] = Field(
        None,
        description="Specific error code for client handling"
    )


# User info response for authenticated endpoints
class CurrentUserResponse(BaseModel):
    """Response schema for current user information."""
    
    wallet_address: str = Field(
        ...,
        description="User's wallet address"
    )
    authenticated_at: Optional[datetime] = Field(
        None,
        description="When the user was authenticated"
    )
    token_expires_at: Optional[datetime] = Field(
        None,
        description="When the current token expires"
    )