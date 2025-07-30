"""
Web3 Authentication API Routes

Provides endpoints for wallet-based authentication using cryptographic signatures:
- Challenge generation for wallet addresses
- Signature verification and JWT token issuance
- User information retrieval for authenticated users

Security Features:
- Rate limiting on challenge generation
- Comprehensive input validation
- JWT token protection for sensitive endpoints
- Structured logging for security monitoring
"""

from datetime import datetime, timedelta
from typing import Dict, Any
import structlog

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.schemas.auth import (
    ChallengeRequest,
    ChallengeResponse,
    VerifySignatureRequest,
    AuthenticationResponse,
    WalletInfoResponse,
    CurrentUserResponse,
    AuthErrorResponse
)
from app.services.web3_auth import web3_auth_service
from app.core.config import settings
from app.core.security import create_access_token, ALGORITHM
from app.crud import user_crud
from app.core.database import get_db
from app.schemas.user import UserCreate
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

# Initialize router (prefix handled by parent router)
router = APIRouter(tags=["authentication"])

# Security dependency for JWT validation
security = HTTPBearer()


async def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> str:
    """
    Extract wallet address from JWT token.
    
    Args:
        credentials: JWT token from Authorization header
        db: Database session
        
    Returns:
        Wallet address from token
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Decode JWT token
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        
        # Extract wallet address from token subject
        wallet_address: str = payload.get("sub")
        
        if wallet_address is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
            
        return wallet_address
        
    except JWTError as e:
        logger.warning("JWT token validation failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )


@router.post(
    "/challenge",
    response_model=ChallengeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Authentication Challenge",
    description="Generate a unique challenge message for wallet signature authentication"
)
async def generate_challenge(request: ChallengeRequest) -> ChallengeResponse:
    """
    Generate authentication challenge for Web3 wallet.
    
    This endpoint generates a unique nonce and challenge message that must be
    signed by the user's wallet to prove ownership. The challenge expires
    after 5 minutes to prevent replay attacks.
    
    Rate limiting: Maximum 5 challenges per minute per wallet address.
    """
    try:
        logger.info(
            "Challenge generation requested",
            wallet_address=request.wallet_address
        )
        
        # Generate challenge using Web3 auth service
        challenge_data = await web3_auth_service.generate_challenge(
            request.wallet_address
        )
        
        return ChallengeResponse(**challenge_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Challenge generation failed",
            wallet_address=request.wallet_address,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate authentication challenge"
        )


@router.post(
    "/verify",
    response_model=AuthenticationResponse,
    summary="Verify Signature and Authenticate",
    description="Verify wallet signature and issue JWT access token"
)
async def verify_signature(
    request: VerifySignatureRequest,
    db: AsyncSession = Depends(get_db)
) -> AuthenticationResponse:
    """
    Verify cryptographic signature and issue JWT token.
    
    This endpoint verifies that the provided signature was created by the
    private key corresponding to the wallet address. On successful verification,
    it issues a JWT access token and creates/updates the user record.
    """
    try:
        logger.info(
            "Signature verification requested",
            wallet_address=request.wallet_address,
            nonce=request.nonce[:8] + "..."
        )
        
        # Verify signature using Web3 auth service
        access_token = await web3_auth_service.verify_signature(
            wallet_address=request.wallet_address,
            signature=request.signature,
            nonce=request.nonce
        )
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Signature verification failed"
            )
        
        # Create or update user in database
        await _ensure_user_exists(db, request.wallet_address)
        
        return AuthenticationResponse(
            access_token=access_token,
            token_type="bearer",
            wallet_address=request.wallet_address,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Signature verification failed",
            wallet_address=request.wallet_address,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    summary="Get Current User",
    description="Get information about the currently authenticated user"
)
async def get_current_user(
    wallet_address: str = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
) -> CurrentUserResponse:
    """
    Get current authenticated user information.
    
    Returns information about the user associated with the provided JWT token.
    Requires valid JWT token in Authorization header.
    """
    try:
        # Ensure user exists in database
        await _ensure_user_exists(db, wallet_address)
        
        return CurrentUserResponse(
            wallet_address=wallet_address,
            authenticated_at=datetime.utcnow(),
            token_expires_at=datetime.utcnow() + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )
        
    except Exception as e:
        logger.error(
            "Failed to get current user",
            wallet_address=wallet_address,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user information"
        )


@router.get(
    "/wallet/{wallet_address}/info",
    response_model=WalletInfoResponse,
    summary="Get Wallet Information",
    description="Get basic information about a wallet address"
)
async def get_wallet_info(wallet_address: str) -> WalletInfoResponse:
    """
    Get basic information about a wallet address.
    
    This endpoint validates a wallet address format and returns
    basic information about it. No authentication required.
    """
    try:
        wallet_info = await web3_auth_service.get_wallet_info(wallet_address)
        return WalletInfoResponse(**wallet_info)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to get wallet info",
            wallet_address=wallet_address,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid wallet address"
        )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout User",
    description="Logout current user (client-side token invalidation)"
)
async def logout_user(
    wallet_address: str = Depends(get_current_user_from_token)
):
    """
    Logout current user.
    
    Since JWT tokens are stateless, this endpoint primarily serves to validate
    the token and log the logout event. Actual token invalidation should be
    handled client-side by removing the token from storage.
    """
    logger.info("User logout", wallet_address=wallet_address)
    
    # In a production system, you might want to add the token to a blacklist
    # stored in Redis with expiration matching the token's remaining lifetime
    
    return None


async def _ensure_user_exists(db: AsyncSession, wallet_address: str):
    """
    Ensure user exists in database, create if necessary.
    
    Args:
        db: Database session
        wallet_address: User's wallet address
    """
    try:
        # Check if user already exists
        existing_user = await user_crud.get_by_wallet_address(db, wallet_address=wallet_address)
        
        if not existing_user:
            # Create new user
            user_data = UserCreate(wallet_address=wallet_address)
            await user_crud.create(db, obj_in=user_data)
            
            logger.info(
                "Created new user account",
                wallet_address=wallet_address
            )
        else:
            logger.debug(
                "User already exists",
                wallet_address=wallet_address,
                user_id=str(existing_user.id)
            )
            
    except Exception as e:
        logger.error(
            "Failed to ensure user exists",
            wallet_address=wallet_address,
            error=str(e)
        )
        # Don't raise here - authentication can succeed even if user creation fails
        # The user will be created on the next request