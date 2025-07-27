"""
Web3 Authentication Service for GeoGift Platform

Implements challenge-response authentication flow using Ethereum signatures:
1. Generate unique nonce challenges for wallet addresses
2. Verify cryptographic signatures using eth-account
3. Manage nonce storage and expiration with Redis
4. Integrate with JWT token generation

Security Features:
- EIP-191 compliant message signing
- Nonce expiration (5 minutes) prevents replay attacks
- Rate limiting per IP and wallet address
- Input validation and sanitization
"""

import secrets
import hashlib
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import structlog

from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_defunct
import redis.asyncio as redis
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token

logger = structlog.get_logger(__name__)


class Web3AuthService:
    """Service for Web3 wallet-based authentication using cryptographic signatures."""
    
    def __init__(self):
        """Initialize Web3 authentication service with Redis connection."""
        self.redis = None
        self._w3 = Web3()  # No provider needed for signature verification
        
    async def _get_redis(self) -> redis.Redis:
        """Get Redis connection for nonce storage."""
        if self.redis is None:
            self.redis = await redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                encoding="utf-8"
            )
        return self.redis
    
    async def close(self):
        """Close Redis connection."""
        if self.redis:
            await self.redis.close()
    
    def _validate_wallet_address(self, wallet_address: str) -> str:
        """
        Validate and normalize Ethereum wallet address.
        
        Args:
            wallet_address: Raw wallet address string
            
        Returns:
            Checksummed wallet address
            
        Raises:
            HTTPException: If address format is invalid
        """
        try:
            # Remove any whitespace and ensure lowercase
            address = wallet_address.strip()
            
            # Validate address format
            if not self._w3.is_address(address):
                raise ValueError("Invalid Ethereum address format")
                
            # Return checksummed address
            return self._w3.to_checksum_address(address)
            
        except Exception as e:
            logger.error("Invalid wallet address", address=wallet_address, error=str(e))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid wallet address format"
            )
    
    def _generate_nonce(self) -> str:
        """
        Generate cryptographically secure nonce for challenge.
        
        Returns:
            Hex-encoded random nonce string
        """
        # Generate 32 bytes of random data
        random_bytes = secrets.token_bytes(32)
        
        # Add timestamp for uniqueness
        timestamp = str(int(time.time())).encode()
        
        # Hash together for deterministic length
        nonce_hash = hashlib.sha256(random_bytes + timestamp).hexdigest()
        
        return nonce_hash
    
    def _create_challenge_message(self, wallet_address: str, nonce: str) -> str:
        """
        Create standardized challenge message for signing.
        
        Args:
            wallet_address: User's wallet address
            nonce: Unique nonce for this challenge
            
        Returns:
            Formatted challenge message string
        """
        message = (
            f"Welcome to GeoGift!\n\n"
            f"Sign this message to authenticate your wallet:\n"
            f"Address: {wallet_address}\n"
            f"Nonce: {nonce}\n"
            f"Timestamp: {datetime.utcnow().isoformat()}Z\n\n"
            f"This request will not trigger any blockchain transaction or cost any gas fees."
        )
        return message
    
    async def generate_challenge(self, wallet_address: str) -> Dict[str, Any]:
        """
        Generate authentication challenge for wallet address.
        
        Args:
            wallet_address: User's Ethereum wallet address
            
        Returns:
            Dictionary containing challenge message and nonce
            
        Raises:
            HTTPException: If rate limited or validation fails
        """
        # Validate and normalize wallet address
        wallet_address = self._validate_wallet_address(wallet_address)
        
        # Check rate limiting
        await self._check_rate_limit(wallet_address)
        
        # Generate unique nonce
        nonce = self._generate_nonce()
        
        # Create challenge message
        message = self._create_challenge_message(wallet_address, nonce)
        
        # Store nonce in Redis with expiration (5 minutes)
        redis_client = await self._get_redis()
        nonce_key = f"auth_nonce:{wallet_address}:{nonce}"
        
        await redis_client.setex(
            nonce_key,
            300,  # 5 minutes expiration
            "1"   # Simple flag value
        )
        
        # Track challenge generation for rate limiting
        await self._track_challenge_request(wallet_address)
        
        logger.info(
            "Generated authentication challenge",
            wallet_address=wallet_address,
            nonce=nonce[:8] + "..."  # Log partial nonce for debugging
        )
        
        return {
            "message": message,
            "nonce": nonce,
            "wallet_address": wallet_address,
            "expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat() + "Z"
        }
    
    async def _check_rate_limit(self, wallet_address: str):
        """
        Check rate limiting for challenge generation.
        
        Args:
            wallet_address: User's wallet address
            
        Raises:
            HTTPException: If rate limit exceeded
        """
        redis_client = await self._get_redis()
        rate_limit_key = f"auth_rate_limit:{wallet_address}"
        
        # Check current request count
        current_count = await redis_client.get(rate_limit_key)
        
        if current_count and int(current_count) >= 5:  # Max 5 challenges per minute
            logger.warning("Rate limit exceeded", wallet_address=wallet_address)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please wait before requesting another challenge."
            )
    
    async def _track_challenge_request(self, wallet_address: str):
        """Track challenge request for rate limiting."""
        redis_client = await self._get_redis()
        rate_limit_key = f"auth_rate_limit:{wallet_address}"
        
        # Increment counter with 60 second expiration
        pipe = redis_client.pipeline()
        pipe.incr(rate_limit_key)
        pipe.expire(rate_limit_key, 60)
        await pipe.execute()
    
    async def verify_signature(
        self, 
        wallet_address: str, 
        signature: str, 
        nonce: str
    ) -> Optional[str]:
        """
        Verify cryptographic signature and generate JWT token.
        
        Args:
            wallet_address: User's wallet address
            signature: Hex-encoded signature from MetaMask
            nonce: Nonce from previous challenge
            
        Returns:
            JWT access token if verification successful, None otherwise
            
        Raises:
            HTTPException: If verification fails or nonce invalid
        """
        try:
            # Validate wallet address
            wallet_address = self._validate_wallet_address(wallet_address)
            
            # Verify nonce exists and hasn't expired
            await self._verify_nonce(wallet_address, nonce)
            
            # Recreate the challenge message
            message = self._create_challenge_message(wallet_address, nonce)
            
            # Encode message using EIP-191 standard
            encoded_message = encode_defunct(text=message)
            
            # Recover signer address from signature
            recovered_address = Account.recover_message(encoded_message, signature=signature)
            
            # Verify recovered address matches provided wallet address
            if recovered_address.lower() != wallet_address.lower():
                logger.warning(
                    "Signature verification failed - address mismatch",
                    expected=wallet_address,
                    recovered=recovered_address
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Signature verification failed"
                )
            
            # Clean up used nonce
            await self._cleanup_nonce(wallet_address, nonce)
            
            # Generate JWT token
            access_token = create_access_token(subject=wallet_address)
            
            logger.info(
                "Web3 authentication successful",
                wallet_address=wallet_address,
                nonce=nonce[:8] + "..."
            )
            
            return access_token
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(
                "Signature verification error",
                wallet_address=wallet_address,
                error=str(e),
                signature=signature[:10] + "..." if signature else None
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Signature verification failed"
            )
    
    async def _verify_nonce(self, wallet_address: str, nonce: str):
        """
        Verify nonce exists and hasn't expired.
        
        Args:
            wallet_address: User's wallet address
            nonce: Nonce to verify
            
        Raises:
            HTTPException: If nonce is invalid or expired
        """
        redis_client = await self._get_redis()
        nonce_key = f"auth_nonce:{wallet_address}:{nonce}"
        
        nonce_exists = await redis_client.exists(nonce_key)
        
        if not nonce_exists:
            logger.warning(
                "Invalid or expired nonce",
                wallet_address=wallet_address,
                nonce=nonce[:8] + "..."
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired nonce. Please request a new challenge."
            )
    
    async def _cleanup_nonce(self, wallet_address: str, nonce: str):
        """Clean up used nonce from Redis."""
        redis_client = await self._get_redis()
        nonce_key = f"auth_nonce:{wallet_address}:{nonce}"
        await redis_client.delete(nonce_key)
    
    async def get_wallet_info(self, wallet_address: str) -> Dict[str, Any]:
        """
        Get basic information about a wallet address.
        
        Args:
            wallet_address: Ethereum wallet address
            
        Returns:
            Dictionary with wallet information
        """
        wallet_address = self._validate_wallet_address(wallet_address)
        
        return {
            "wallet_address": wallet_address,
            "is_valid": True,
            "checksum": self._w3.is_checksum_address(wallet_address)
        }


# Global service instance
web3_auth_service = Web3AuthService()