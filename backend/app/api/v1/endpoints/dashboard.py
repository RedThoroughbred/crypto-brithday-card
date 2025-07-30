"""
Dashboard API endpoints - Read-only operations for user gift/chain history
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.crud.crud_dashboard import crud_dashboard
from app.schemas.dashboard import (
    DashboardStats,
    DashboardGift,
    DashboardChain,
    DashboardGiftListResponse,
    DashboardChainListResponse
)
from app.api.routes.auth import get_current_user_from_token

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user_address: str = Depends(get_current_user_from_token)
):
    """
    Get aggregate statistics for the authenticated user's dashboard.
    
    Returns:
    - Total gifts/chains sent and received
    - Total GGT spent and received
    - Active (unclaimed) gifts and chains
    - Completion rates
    - Popular unlock types
    - Recent activity
    """
    stats = await crud_dashboard.get_user_stats(
        db=db,
        wallet_address=current_user_address
    )
    return DashboardStats(**stats)


@router.get("/gifts/sent", response_model=DashboardGiftListResponse)
async def get_sent_gifts(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return"),
    db: AsyncSession = Depends(get_db),
    current_user_address: str = Depends(get_current_user_from_token)
):
    """
    Get paginated list of single gifts created by the authenticated user.
    
    Query Parameters:
    - skip: Number of items to skip (for pagination)
    - limit: Number of items to return (max 100)
    """
    result = await crud_dashboard.get_sent_gifts(
        db=db,
        wallet_address=current_user_address,
        skip=skip,
        limit=limit
    )
    
    # Transform Gift models to DashboardGift schemas
    gifts = [
        DashboardGift(
            id=str(gift.id),
            blockchain_gift_id=None,  # Gift model doesn't have this field
            recipient_address=gift.recipient_address,
            recipient_email=None,  # Gift model doesn't have this field
            amount=0.0,  # Gift model doesn't have amount field
            currency="GGT",  # Assuming GGT for now
            message=gift.message or "",
            unlock_type=gift.unlock_type.value if hasattr(gift.unlock_type, 'value') else str(gift.unlock_type),
            status="claimed" if gift.status.value == "CLAIMED" else (
                "expired" if gift.status.value == "EXPIRED" else "active"
            ),
            created_at=gift.created_at,
            claimed_at=None,  # Gift model doesn't have this field
            expiry_date=None,  # Gift model doesn't have this field
            transaction_hash="",  # Gift model doesn't have this field
            share_url=f"/gift/{gift.id}"
        )
        for gift in result["gifts"]
    ]
    
    return DashboardGiftListResponse(
        gifts=gifts,
        total=result["total"],
        page=result["page"],
        per_page=result["per_page"],
        has_more=result["has_more"]
    )


@router.get("/gifts/received", response_model=DashboardGiftListResponse)
async def get_received_gifts(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return"),
    db: AsyncSession = Depends(get_db),
    current_user_address: str = Depends(get_current_user_from_token)
):
    """
    Get paginated list of single gifts received by the authenticated user.
    """
    result = await crud_dashboard.get_received_gifts(
        db=db,
        wallet_address=current_user_address,
        skip=skip,
        limit=limit
    )
    
    # Transform Gift models to DashboardGift schemas  
    gifts = [
        DashboardGift(
            id=str(gift.id),
            blockchain_gift_id=None,  # Gift model doesn't have this field
            recipient_address=gift.recipient_address,
            recipient_email=None,  # Gift model doesn't have this field
            amount=0.0,  # Gift model doesn't have amount field
            currency="GGT",
            message=gift.message or "",
            unlock_type=gift.unlock_type.value if hasattr(gift.unlock_type, 'value') else str(gift.unlock_type),
            status="claimed" if gift.status.value == "CLAIMED" else (
                "expired" if gift.status.value == "EXPIRED" else "active"
            ),
            created_at=gift.created_at,
            claimed_at=None,  # Gift model doesn't have this field
            expiry_date=None,  # Gift model doesn't have this field
            transaction_hash="",  # Gift model doesn't have this field
            share_url=f"/gift/{gift.id}"
        )
        for gift in result["gifts"]
    ]
    
    return DashboardGiftListResponse(
        gifts=gifts,
        total=result["total"],
        page=result["page"],
        per_page=result["per_page"],
        has_more=result["has_more"]
    )


@router.get("/chains/sent", response_model=DashboardChainListResponse)
async def get_sent_chains(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return"),
    db: AsyncSession = Depends(get_db),
    current_user_address: str = Depends(get_current_user_from_token)
):
    """
    Get paginated list of gift chains created by the authenticated user.
    """
    result = await crud_dashboard.get_sent_chains(
        db=db,
        wallet_address=current_user_address,
        skip=skip,
        limit=limit
    )
    
    # Transform GiftChain models to DashboardChain schemas
    chains = [
        DashboardChain(
            id=str(chain.id),
            blockchain_chain_id=chain.blockchain_chain_id,
            chain_title=chain.chain_title,
            chain_description=chain.chain_description,
            recipient_address=chain.recipient_address,
            recipient_email=chain.recipient_email,
            total_value=float(chain.total_value),
            total_steps=chain.total_steps,
            current_step=chain.current_step,
            completion_percentage=(
                (chain.current_step / chain.total_steps * 100) 
                if chain.total_steps > 0 else 0
            ),
            status="completed" if chain.is_completed else (
                "expired" if chain.is_expired else "active"
            ),
            created_at=chain.created_at,
            completed_at=chain.completed_at,
            expiry_date=chain.expiry_date,
            transaction_hash=chain.transaction_hash or "",
            share_url=f"/chain/{chain.id}",
            steps_summary=[
                {
                    "index": step.step_index,
                    "title": step.step_title,
                    "type": step.unlock_type,
                    "completed": step.is_completed
                }
                for step in sorted(chain.steps, key=lambda s: s.step_index)
            ]
        )
        for chain in result["chains"]
    ]
    
    return DashboardChainListResponse(
        chains=chains,
        total=result["total"],
        page=result["page"],
        per_page=result["per_page"],
        has_more=result["has_more"]
    )


@router.get("/chains/received", response_model=DashboardChainListResponse)
async def get_received_chains(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return"),
    db: AsyncSession = Depends(get_db),
    current_user_address: str = Depends(get_current_user_from_token)
):
    """
    Get paginated list of gift chains received by the authenticated user.
    """
    result = await crud_dashboard.get_received_chains(
        db=db,
        wallet_address=current_user_address,
        skip=skip,
        limit=limit
    )
    
    # Transform GiftChain models to DashboardChain schemas
    chains = [
        DashboardChain(
            id=str(chain.id),
            blockchain_chain_id=chain.blockchain_chain_id,
            chain_title=chain.chain_title,
            chain_description=chain.chain_description,
            recipient_address=chain.recipient_address,
            recipient_email=chain.recipient_email,
            total_value=float(chain.total_value),
            total_steps=chain.total_steps,
            current_step=chain.current_step,
            completion_percentage=(
                (chain.current_step / chain.total_steps * 100) 
                if chain.total_steps > 0 else 0
            ),
            status="completed" if chain.is_completed else (
                "expired" if chain.is_expired else "active"
            ),
            created_at=chain.created_at,
            completed_at=chain.completed_at,
            expiry_date=chain.expiry_date,
            transaction_hash=chain.transaction_hash or "",
            share_url=f"/chain/{chain.id}",
            steps_summary=[
                {
                    "index": step.step_index,
                    "title": step.step_title,
                    "type": step.unlock_type,
                    "completed": step.is_completed
                }
                for step in sorted(chain.steps, key=lambda s: s.step_index)
            ]
        )
        for chain in result["chains"]
    ]
    
    return DashboardChainListResponse(
        chains=chains,
        total=result["total"],
        page=result["page"],
        per_page=result["per_page"],
        has_more=result["has_more"]
    )