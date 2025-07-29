"""
Gift management endpoints for creating, claiming, and managing crypto gifts.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal
import structlog
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.api.routes.auth import get_current_user_from_token
from app.crud import gift as gift_crud, user as user_crud
from app.schemas.gift import GiftCreate, GiftRead, GiftUpdate
from app.models.gift import GiftStatus

router = APIRouter()
logger = structlog.get_logger()


class GiftLocation(BaseModel):
    """Location data for gift placement."""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")
    radius: int = Field(..., ge=5, le=1000, description="Verification radius in meters")


class CreateGiftRequest(BaseModel):
    """Request model for creating a new gift."""
    recipient_address: str = Field(..., description="Ethereum address of gift recipient")
    amount: Decimal = Field(..., gt=0, description="Gift amount in ETH")
    location: GiftLocation
    clue_text: str = Field(..., min_length=1, max_length=500, description="Location clue for recipient")
    expiry_hours: int = Field(default=24, ge=1, le=168, description="Gift expiry in hours")
    message: Optional[str] = Field(None, max_length=1000, description="Personal message to recipient")


class ClaimGiftRequest(BaseModel):
    """Request model for claiming a gift."""
    gift_id: int
    user_location: GiftLocation
    proof: Optional[str] = Field(None, description="Optional cryptographic proof")


class GiftResponse(BaseModel):
    """Response model for gift data."""
    id: int
    giver_address: str
    recipient_address: str
    amount: Decimal
    status: str  # created, claimed, expired
    location: GiftLocation
    clue_text: str
    message: Optional[str]
    created_at: str
    expires_at: str
    claimed_at: Optional[str]
    claim_attempts: int
    transaction_hash: Optional[str]


class GiftListResponse(BaseModel):
    """Response model for gift listings."""
    gifts: List[GiftResponse]
    total: int
    page: int
    per_page: int


class CreateGiftRequestV2(BaseModel):
    """Request model for creating a new gift (aligned with frontend)."""
    recipient_address: str = Field(..., description="Ethereum address of gift recipient")
    escrow_id: str = Field(..., description="Smart contract escrow ID")
    lat: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    lon: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")
    message: Optional[str] = Field(None, max_length=1000, description="Personal message to recipient")


@router.post("", response_model=GiftRead, status_code=status.HTTP_201_CREATED)
async def create_gift(
    request: CreateGiftRequestV2,
    db: AsyncSession = Depends(get_db),
    current_user_address: str = Depends(get_current_user_from_token)
):
    """
    Store a new single gift in the database after smart contract creation.
    This is called by the frontend after successful blockchain transaction.
    """
    try:
        # Get the current user
        sender = await user_crud.get_by_wallet_address(db, wallet_address=current_user_address)
        if not sender:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create gift data
        gift_data = GiftCreate(
            sender_id=sender.id,
            recipient_address=request.recipient_address,
            escrow_id=request.escrow_id,
            lat=request.lat,
            lon=request.lon,
            message=request.message
        )
        
        # Store gift in database
        gift = await gift_crud.create(db, obj_in=gift_data)
        
        logger.info(
            "Single gift stored in database",
            gift_id=str(gift.id),
            sender=current_user_address,
            recipient=request.recipient_address,
            escrow_id=request.escrow_id
        )
        
        return gift
        
    except Exception as e:
        logger.error(
            "Failed to create gift",
            error=str(e),
            sender=current_user_address,
            recipient=request.recipient_address
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create gift"
        )


@router.get("/{gift_id}", response_model=GiftRead)
async def get_gift(
    gift_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific gift by UUID.
    Returns public information only.
    """
    try:
        # Parse UUID
        gift_uuid = uuid.UUID(gift_id)
        
        # Fetch gift from database
        gift = await gift_crud.get(db, gift_uuid)
        
        if not gift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Gift not found"
            )
        
        logger.info(
            "Fetched gift details",
            gift_id=gift_id,
            status=gift.status
        )
        
        return gift
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid gift ID format"
        )
    except Exception as e:
        logger.error(
            "Failed to fetch gift",
            gift_id=gift_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch gift"
        )


@router.post("/{gift_id}/claim", response_model=GiftResponse)
async def claim_gift(gift_id: int, request: ClaimGiftRequest):
    """
    Claim a gift by verifying location.
    Triggers smart contract execution if verification succeeds.
    """
    # TODO: Verify user is the designated recipient
    # TODO: Check gift hasn't expired or been claimed
    # TODO: Verify user location against gift location
    # TODO: Execute smart contract claim transaction
    # TODO: Update gift status in database
    
    logger.info(
        "Attempting to claim gift",
        gift_id=gift_id,
        user_location=request.user_location.dict()
    )
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Location verification failed"
    )


@router.get("", response_model=GiftListResponse)
async def list_gifts(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    status_filter: Optional[str] = Query(None, description="Filter by gift status"),
    user_address: Optional[str] = Query(None, description="Filter by user address")
):
    """
    List gifts with pagination and filtering.
    Returns different data based on user permissions.
    """
    # TODO: Implement database query with filters
    # TODO: Apply user permissions for sensitive data
    # TODO: Add proper pagination
    
    logger.info(
        "Listing gifts",
        page=page,
        per_page=per_page,
        filters={"status": status_filter, "user": user_address}
    )
    
    return GiftListResponse(
        gifts=[],
        total=0,
        page=page,
        per_page=per_page
    )


@router.get("/escrow/{escrow_id}", response_model=GiftRead)
async def get_gift_by_escrow_id(
    escrow_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get gift details by escrow ID (used by frontend for gift claiming).
    """
    try:
        gift = await gift_crud.get_by_escrow_id(db, escrow_id=escrow_id)
        
        if not gift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Gift not found"
            )
        
        logger.info(
            "Fetched gift by escrow ID",
            escrow_id=escrow_id,
            gift_id=str(gift.id),
            status=gift.status
        )
        
        return gift
        
    except Exception as e:
        logger.error(
            "Failed to fetch gift by escrow ID",
            escrow_id=escrow_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch gift"
        )


@router.get("/user/{user_address}", response_model=List[GiftRead])
async def get_user_gifts(
    user_address: str,
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """
    Get all gifts associated with a user address.
    Includes both sent and received gifts.
    """
    try:
        # Get user
        user = await user_crud.get_by_wallet_address(db, wallet_address=user_address)
        if not user:
            return []
        
        # Get gifts sent by this user
        sent_gifts = await gift_crud.get_by_sender(db, sender_id=user.id, skip=skip, limit=limit)
        
        # Get gifts received by this user
        received_gifts = await gift_crud.get_by_recipient(db, recipient_address=user_address, skip=skip, limit=limit)
        
        # Combine and deduplicate
        all_gifts = sent_gifts + received_gifts
        unique_gifts = {str(gift.id): gift for gift in all_gifts}.values()
        
        logger.info(
            "Fetched user gifts",
            user_address=user_address,
            sent_count=len(sent_gifts),
            received_count=len(received_gifts),
            total=len(unique_gifts)
        )
        
        return list(unique_gifts)
        
    except Exception as e:
        logger.error(
            "Failed to fetch user gifts",
            user_address=user_address,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user gifts"
        )


@router.delete("/{gift_id}")
async def cancel_gift(gift_id: int):
    """
    Cancel an unclaimed gift (emergency withdrawal).
    Only available to gift creator after expiry.
    """
    # TODO: Verify user is gift creator
    # TODO: Check gift is expired and unclaimed
    # TODO: Execute smart contract emergency withdrawal
    # TODO: Update gift status
    
    logger.info("Canceling gift", gift_id=gift_id)
    
    return {"message": "Gift cancelled successfully"}