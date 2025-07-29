"""
CRUD operations for gift chains
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, func, desc, select

from app.crud.base import CRUDBase
from app.models.gift_chain import GiftChain
from app.models.chain_step import ChainStep
from app.models.chain_claim import ChainClaim
from app.schemas.chain import ChainCreate, ChainClaimCreate

class CRUDChain(CRUDBase[GiftChain, ChainCreate, dict]):
    
    async def create_chain_with_steps(
        self, 
        db: AsyncSession, 
        *,
        chain_data: ChainCreate,
        giver_address: str
    ) -> GiftChain:
        """Create a gift chain with its steps"""
        
        # Calculate expiry date
        expiry_date = datetime.utcnow() + timedelta(days=chain_data.expiry_days)
        
        # Create the chain
        chain = GiftChain(
            chain_title=chain_data.chain_title,
            chain_description=chain_data.chain_description,
            giver_address=giver_address.lower(),
            recipient_address=chain_data.recipient_address.lower(),
            recipient_email=chain_data.recipient_email,
            total_value=chain_data.total_value,
            total_steps=len(chain_data.steps),
            current_step=0,
            is_completed=False,
            is_expired=False,
            expiry_date=expiry_date,
            blockchain_chain_id=chain_data.blockchain_chain_id,
            transaction_hash=chain_data.transaction_hash
        )
        
        db.add(chain)
        await db.flush()  # Get the chain ID
        
        # Create the steps
        for step_data in chain_data.steps:
            step = ChainStep(
                chain_id=chain.id,
                step_index=step_data.step_index,
                step_title=step_data.step_title,
                step_message=step_data.step_message,
                unlock_type=step_data.unlock_type.value,
                unlock_data=step_data.unlock_data,
                latitude=step_data.latitude,
                longitude=step_data.longitude,
                radius=step_data.radius,
                step_value=step_data.step_value,
                is_completed=False
            )
            db.add(step)
        
        await db.commit()
        await db.refresh(chain)
        return chain
    
    async def get_chain_with_steps(self, db: AsyncSession, chain_id: int) -> Optional[GiftChain]:
        """Get a chain with all its steps loaded"""
        result = await db.execute(
            select(GiftChain).options(
                selectinload(GiftChain.steps)
            ).filter(GiftChain.id == chain_id)
        )
        return result.scalar_one_or_none()
    
    async def get_chain_by_blockchain_id(self, db: AsyncSession, blockchain_chain_id: int) -> Optional[GiftChain]:
        """Get a chain by its blockchain chain ID"""
        result = await db.execute(
            select(GiftChain).options(
                selectinload(GiftChain.steps)
            ).filter(GiftChain.blockchain_chain_id == blockchain_chain_id)
        )
        return result.scalar_one_or_none()
    
    async def get_chains_by_giver(
        self, 
        db: AsyncSession, 
        giver_address: str,
        skip: int = 0,
        limit: int = 10
    ) -> List[GiftChain]:
        """Get chains created by a specific giver"""
        result = await db.execute(
            select(GiftChain).filter(
                GiftChain.giver_address == giver_address.lower()
            ).options(
                selectinload(GiftChain.steps)
            ).order_by(desc(GiftChain.created_at)).offset(skip).limit(limit)
        )
        return result.scalars().all()
    
    async def get_chains_by_recipient(
        self, 
        db: AsyncSession, 
        recipient_address: str,
        skip: int = 0,
        limit: int = 10
    ) -> List[GiftChain]:
        """Get chains for a specific recipient"""
        result = await db.execute(
            select(GiftChain).filter(
                GiftChain.recipient_address == recipient_address.lower()
            ).options(
                selectinload(GiftChain.steps)
            ).order_by(desc(GiftChain.created_at)).offset(skip).limit(limit)
        )
        return result.scalars().all()
    
    async def update_blockchain_data(
        self, 
        db: AsyncSession, 
        chain_id: int,
        blockchain_chain_id: int,
        transaction_hash: str
    ) -> Optional[GiftChain]:
        """Update chain with blockchain data after contract creation"""
        result = await db.execute(
            select(GiftChain).filter(GiftChain.id == chain_id)
        )
        chain = result.scalar_one_or_none()
        if chain:
            chain.blockchain_chain_id = blockchain_chain_id
            chain.transaction_hash = transaction_hash
            await db.commit()
            await db.refresh(chain)
        return chain
    
    async def mark_step_completed(
        self, 
        db: AsyncSession, 
        chain_id: int,
        step_index: int
    ) -> bool:
        """Mark a step as completed and advance chain progress"""
        # Mark the step as completed
        step_result = await db.execute(
            select(ChainStep).filter(
                and_(
                    ChainStep.chain_id == chain_id,
                    ChainStep.step_index == step_index
                )
            )
        )
        step = step_result.scalar_one_or_none()
        
        if not step:
            return False
        
        step.is_completed = True
        step.completed_at = datetime.utcnow()
        
        # Update chain progress
        chain_result = await db.execute(
            select(GiftChain).filter(GiftChain.id == chain_id)
        )
        chain = chain_result.scalar_one_or_none()
        if chain:
            chain.current_step = step_index + 1
            
            # Check if chain is completed
            if chain.current_step >= chain.total_steps:
                chain.is_completed = True
                chain.completed_at = datetime.utcnow()
        
        await db.commit()
        return True
    
    async def get_chain_statistics(self, db: AsyncSession) -> Dict[str, Any]:
        """Get overall chain statistics"""
        # Total chains
        total_chains_result = await db.execute(select(func.count(GiftChain.id)))
        total_chains = total_chains_result.scalar()
        
        # Completed chains
        completed_chains_result = await db.execute(
            select(func.count(GiftChain.id)).filter(GiftChain.is_completed == True)
        )
        completed_chains = completed_chains_result.scalar()
        
        # Active chains
        active_chains_result = await db.execute(
            select(func.count(GiftChain.id)).filter(
                and_(
                    GiftChain.is_completed == False,
                    GiftChain.is_expired == False
                )
            )
        )
        active_chains = active_chains_result.scalar()
        
        # Calculate total value locked (sum of uncompleted chains)
        total_value_result = await db.execute(
            select(func.sum(GiftChain.total_value.cast(func.numeric))).filter(
                GiftChain.is_completed == False
            )
        )
        total_value_locked = str(total_value_result.scalar() or 0)
        
        # Get claim statistics
        total_claims_result = await db.execute(select(func.count(ChainClaim.id)))
        total_claims = total_claims_result.scalar()
        
        successful_claims_result = await db.execute(
            select(func.count(ChainClaim.id)).filter(ChainClaim.was_successful == True)
        )
        successful_claims = successful_claims_result.scalar()
        
        completion_rate = (completed_chains / total_chains * 100) if total_chains > 0 else 0
        
        return {
            "total_chains": total_chains or 0,
            "completed_chains": completed_chains or 0,
            "active_chains": active_chains or 0,
            "total_value_locked": total_value_locked,
            "total_claims_attempted": total_claims or 0,
            "total_successful_claims": successful_claims or 0,
            "average_completion_rate": round(completion_rate, 2)
        }

class CRUDChainClaim(CRUDBase[ChainClaim, ChainClaimCreate, dict]):
    
    async def create_claim_attempt(
        self, 
        db: AsyncSession, 
        claim_data: ChainClaimCreate
    ) -> ChainClaim:
        """Record a chain step claim attempt"""
        claim = ChainClaim(
            chain_id=claim_data.chain_id,
            step_index=claim_data.step_index,
            claimer_address=claim_data.claimer_address.lower(),
            user_latitude=claim_data.user_latitude,
            user_longitude=claim_data.user_longitude,
            unlock_data=claim_data.unlock_data,
            transaction_hash=claim_data.transaction_hash,
            was_successful=claim_data.was_successful,
            error_message=claim_data.error_message
        )
        
        db.add(claim)
        await db.commit()
        await db.refresh(claim)
        return claim
    
    async def get_claims_for_chain(
        self, 
        db: AsyncSession, 
        chain_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[ChainClaim]:
        """Get all claim attempts for a chain"""
        result = await db.execute(
            select(ChainClaim).filter(
                ChainClaim.chain_id == chain_id
            ).order_by(desc(ChainClaim.claimed_at)).offset(skip).limit(limit)
        )
        return result.scalars().all()
    
    async def get_claims_by_user(
        self, 
        db: AsyncSession, 
        claimer_address: str,
        skip: int = 0,
        limit: int = 50
    ) -> List[ChainClaim]:
        """Get all claim attempts by a user"""
        result = await db.execute(
            select(ChainClaim).filter(
                ChainClaim.claimer_address == claimer_address.lower()
            ).order_by(desc(ChainClaim.claimed_at)).offset(skip).limit(limit)
        )
        return result.scalars().all()

# Create instances
crud_chain = CRUDChain(GiftChain)
crud_chain_claim = CRUDChainClaim(ChainClaim)