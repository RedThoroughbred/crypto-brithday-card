"""
API endpoints for gift chain operations
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.crud.crud_chain import crud_chain, crud_chain_claim
from app.crud.crud_user import user
from app.schemas.chain import (
    ChainCreate,
    ChainResponse,
    ChainListResponse,
    ChainStatsResponse,
    ChainClaimCreate,
    ChainClaimResponse
)
from app.api.routes.auth import get_current_user_from_token

router = APIRouter()

@router.post("/", response_model=ChainResponse, status_code=status.HTTP_201_CREATED)
async def create_chain(
    chain_data: ChainCreate,
    db: AsyncSession = Depends(get_db),
    current_user_address: str = Depends(get_current_user_from_token)
):
    """
    Create a new gift chain
    
    This endpoint stores the chain data in the database. The frontend should
    call this AFTER successfully creating the chain on the blockchain.
    """
    try:
        # Get the user record
        user_record = await user.get_by_wallet_address(db, wallet_address=current_user_address)
        if not user_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create the chain with steps
        chain = await crud_chain.create_chain_with_steps(
            db=db,
            chain_data=chain_data,
            creator_id=user_record.id,
            giver_address=current_user_address
        )
        
        # Return the created chain with steps
        return ChainResponse(
            id=str(chain.id),
            chain_title=chain.chain_title,
            chain_description=chain.chain_description,
            giver_address=chain.giver_address,
            recipient_address=chain.recipient_address,
            recipient_email=chain.recipient_email,
            total_value=chain.total_value,
            total_steps=chain.total_steps,
            current_step=chain.current_step,
            is_completed=chain.is_completed,
            is_expired=chain.is_expired,
            expiry_date=chain.expiry_date,
            blockchain_chain_id=chain.blockchain_chain_id,
            transaction_hash=chain.transaction_hash,
            created_at=chain.created_at,
            completed_at=chain.completed_at,
            steps=[
                {
                    "id": str(step.id),
                    "chain_id": str(step.chain_id),
                    "step_index": step.step_index,
                    "step_title": step.step_title,
                    "step_message": step.step_message,
                    "unlock_type": step.unlock_type,
                    "unlock_data": step.unlock_data,
                    "latitude": step.latitude,
                    "longitude": step.longitude,
                    "radius": step.radius,
                    "step_value": step.step_value,
                    "is_completed": step.is_completed,
                    "completed_at": step.completed_at,
                    "created_at": step.created_at
                }
                for step in chain.steps
            ]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create chain: {str(e)}"
        )

@router.get("/{chain_id}", response_model=ChainResponse)
async def get_chain(
    chain_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific chain by database ID"""
    chain = await crud_chain.get_chain_with_steps(db=db, chain_id=chain_id)
    
    if not chain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chain not found"
        )
    
    return ChainResponse(
        id=chain.id,
        chain_title=chain.chain_title,
        chain_description=chain.chain_description,
        giver_address=chain.giver_address,
        recipient_address=chain.recipient_address,
        recipient_email=chain.recipient_email,
        total_value=chain.total_value,
        total_steps=chain.total_steps,
        current_step=chain.current_step,
        is_completed=chain.is_completed,
        is_expired=chain.is_expired,
        expiry_date=chain.expiry_date,
        blockchain_chain_id=chain.blockchain_chain_id,
        transaction_hash=chain.transaction_hash,
        created_at=chain.created_at,
        completed_at=chain.completed_at,
        steps=[
            {
                "id": step.id,
                "chain_id": step.chain_id,
                "step_index": step.step_index,
                "step_title": step.step_title,
                "step_message": step.step_message,
                "unlock_type": step.unlock_type,
                "unlock_data": step.unlock_data,
                "latitude": step.latitude,
                "longitude": step.longitude,
                "radius": step.radius,
                "step_value": step.step_value,
                "reward_content": step.reward_content,
                "reward_content_type": step.reward_content_type,
                "is_completed": step.is_completed,
                "completed_at": step.completed_at,
                "created_at": step.created_at
            }
            for step in chain.steps
        ]
    )

@router.get("/blockchain/{blockchain_chain_id}", response_model=ChainResponse)
async def get_chain_by_blockchain_id(
    blockchain_chain_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a chain by its blockchain chain ID"""
    try:
        # Use the CRUD method that properly loads steps
        chain = await crud_chain.get_chain_by_blockchain_id_with_steps(db=db, blockchain_chain_id=blockchain_chain_id)
        
        if not chain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chain not found"
            )
        
        return ChainResponse(
            id=str(chain.id),
            chain_title=chain.chain_title,
            chain_description=chain.chain_description,
            giver_address=chain.giver_address,
            recipient_address=chain.recipient_address,
            recipient_email=chain.recipient_email,
            total_value=chain.total_value,
            total_steps=chain.total_steps,
            current_step=chain.current_step,
            is_completed=chain.is_completed,
            is_expired=chain.is_expired,
            expiry_date=chain.expiry_date,
            blockchain_chain_id=chain.blockchain_chain_id,
            transaction_hash=chain.transaction_hash,
            created_at=chain.created_at,  
            completed_at=chain.completed_at,
            steps=[
                {
                    "id": str(step.id),
                    "chain_id": str(step.chain_id),
                    "step_index": step.step_index,
                    "step_title": step.step_title,
                    "step_message": step.step_message,
                    "unlock_type": step.unlock_type,
                    "unlock_data": step.unlock_data,
                    "latitude": step.latitude,
                    "longitude": step.longitude,
                    "radius": step.radius,
                    "step_value": step.step_value,
                    "reward_content": step.reward_content,
                    "reward_content_type": step.reward_content_type,
                    "is_completed": step.is_completed,
                    "completed_at": step.completed_at,
                    "created_at": step.created_at
                }
                for step in chain.steps
            ]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chain: {str(e)}"
        )

@router.put("/{chain_id}/blockchain", response_model=ChainResponse)
async def update_chain_blockchain_data(
    chain_id: int,
    blockchain_chain_id: int,
    transaction_hash: str,
    db: AsyncSession = Depends(get_db),
    current_user_address: str = Depends(get_current_user_from_token)
):
    """Update chain with blockchain data after contract creation"""
    chain = await crud_chain.get(db=db, id=chain_id)
    
    if not chain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chain not found"
        )
    
    # Verify user owns this chain
    if chain.giver_address.lower() != current_user_address.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this chain"
        )
    
    updated_chain = await crud_chain.update_blockchain_data(
        db=db,
        chain_id=chain_id,
        blockchain_chain_id=blockchain_chain_id,
        transaction_hash=transaction_hash
    )
    
    if not updated_chain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update chain"
        )
    
    return ChainResponse.from_orm(updated_chain)

@router.get("/", response_model=ChainListResponse)
async def list_chains(
    giver_address: str = Query(None, description="Filter by giver address"),
    recipient_address: str = Query(None, description="Filter by recipient address"),
    skip: int = Query(0, ge=0, description="Number of chains to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of chains to return"),
    db: AsyncSession = Depends(get_db)
):
    """List chains with optional filtering"""
    
    if giver_address:
        chains = await crud_chain.get_chains_by_giver(
            db=db, 
            giver_address=giver_address,
            skip=skip,
            limit=limit
        )
    elif recipient_address:
        chains = await crud_chain.get_chains_by_recipient(
            db=db,
            recipient_address=recipient_address,
            skip=skip,
            limit=limit
        )
    else:
        chains = await crud_chain.get_multi(db=db, skip=skip, limit=limit)
    
    # Convert to response format
    chain_responses = []
    for chain in chains:
        chain_responses.append(ChainResponse(
            id=str(chain.id),
            chain_title=chain.chain_title,
            chain_description=chain.chain_description,
            giver_address=chain.giver_address,
            recipient_address=chain.recipient_address,
            recipient_email=chain.recipient_email,
            total_value=chain.total_value,
            total_steps=chain.total_steps,
            current_step=chain.current_step,
            is_completed=chain.is_completed,
            is_expired=chain.is_expired,
            expiry_date=chain.expiry_date,
            blockchain_chain_id=chain.blockchain_chain_id,
            transaction_hash=chain.transaction_hash,
            created_at=chain.created_at,
            completed_at=chain.completed_at,
            steps=[]  # Empty for list view - use individual chain endpoint for full details
        ))
    
    return ChainListResponse(
        chains=chain_responses,
        total=len(chains),
        page=skip // limit + 1,
        per_page=limit
    )

@router.post("/{chain_id}/claims", response_model=ChainClaimResponse)
async def record_claim_attempt(
    chain_id: int,
    claim_data: ChainClaimCreate,
    db: AsyncSession = Depends(get_db)
):
    """Record a chain step claim attempt"""
    
    # Verify chain exists
    chain = await crud_chain.get(db=db, id=chain_id)
    if not chain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chain not found"
        )
    
    # Ensure chain_id matches
    claim_data.chain_id = chain_id
    
    try:
        claim = await crud_chain_claim.create_claim_attempt(db=db, claim_data=claim_data)
        
        # If claim was successful, mark step as completed
        if claim.was_successful:
            await crud_chain.mark_step_completed(
                db=db,
                chain_id=chain_id,
                step_index=claim.step_index
            )
        
        return ChainClaimResponse.from_orm(claim)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to record claim: {str(e)}"
        )

@router.get("/{chain_id}/claims", response_model=List[ChainClaimResponse])
async def get_chain_claims(
    chain_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get all claim attempts for a chain"""
    
    # Verify chain exists
    chain = await crud_chain.get(db=db, id=chain_id)
    if not chain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chain not found"
        )
    
    claims = await crud_chain_claim.get_claims_for_chain(
        db=db,
        chain_id=chain_id,
        skip=skip,
        limit=limit
    )
    
    return [ChainClaimResponse.from_orm(claim) for claim in claims]

@router.get("/health/test", response_model=dict)
async def test_chain_api():
    """Test endpoint to verify chain API is working"""
    return {
        "status": "success",
        "message": "Chain API is working!",
        "endpoints": {
            "create_chain": "POST /chains/",
            "get_chain": "GET /chains/{chain_id}",
            "list_chains": "GET /chains/",
            "statistics": "GET /chains/stats/overview"
        }
    }

@router.get("/stats/overview", response_model=ChainStatsResponse)
async def get_chain_statistics():
    """Get overall chain statistics (simplified for testing)"""
    
    # Return mock data for now since we're having async/sync issues
    return ChainStatsResponse(
        total_chains=0,
        completed_chains=0, 
        active_chains=0,
        total_value_locked="0",
        total_claims_attempted=0,
        total_successful_claims=0,
        average_completion_rate=0.0
    )