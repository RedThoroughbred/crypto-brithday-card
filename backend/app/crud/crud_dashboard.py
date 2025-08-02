"""
Dashboard CRUD operations - READ ONLY for safety
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, Float
from sqlalchemy.orm import selectinload

from app.models.gift import Gift
from app.models.gift_chain import GiftChain
from app.models.chain_step import ChainStep
from app.models.user import User


class CRUDDashboard:
    """Read-only CRUD operations for dashboard data"""
    
    async def get_user_stats(
        self, 
        db: AsyncSession, 
        wallet_address: str
    ) -> Dict[str, Any]:
        """Get aggregate statistics for a user"""
        
        # Get user
        user_result = await db.execute(
            select(User).where(User.wallet_address == wallet_address)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            return self._empty_stats()
        
        # Count gifts sent
        gifts_sent_result = await db.execute(
            select(func.count(Gift.id)).where(Gift.sender_id == user.id)
        )
        total_gifts_sent = gifts_sent_result.scalar() or 0
        
        # Count chains sent
        chains_sent_result = await db.execute(
            select(func.count(GiftChain.id)).where(GiftChain.creator_id == user.id)
        )
        total_chains_sent = chains_sent_result.scalar() or 0
        
        # Count gifts received
        gifts_received_result = await db.execute(
            select(func.count(Gift.id)).where(
                Gift.recipient_address == wallet_address
            )
        )
        total_gifts_received = gifts_received_result.scalar() or 0
        
        # Count chains received
        chains_received_result = await db.execute(
            select(func.count(GiftChain.id)).where(
                GiftChain.recipient_address == wallet_address
            )
        )
        total_chains_received = chains_received_result.scalar() or 0
        
        # Calculate GGT spent - Gift model doesn't have amount field, using chain data only
        total_ggt_spent = 0.0
        
        # Add chain values to spent - cast string to numeric for sum
        chain_value_result = await db.execute(
            select(func.sum(func.cast(GiftChain.total_value, Float))).where(
                GiftChain.creator_id == user.id
            )
        )
        chain_total = chain_value_result.scalar()
        if chain_total:
            try:
                total_ggt_spent += float(chain_total)
            except (ValueError, TypeError):
                total_ggt_spent += 0.0
        
        # Calculate GGT received - Gift model doesn't have amount field, setting to 0 for now
        total_ggt_received = 0.0
        
        # Count active (pending) gifts
        from app.models.gift import GiftStatus
        active_gifts_result = await db.execute(
            select(func.count(Gift.id)).where(
                and_(
                    Gift.sender_id == user.id,
                    Gift.status == GiftStatus.PENDING
                )
            )
        )
        active_gifts = active_gifts_result.scalar() or 0
        
        # Count active (incomplete) chains
        active_chains_result = await db.execute(
            select(func.count(GiftChain.id)).where(
                and_(
                    GiftChain.creator_id == user.id,
                    GiftChain.is_completed == False
                )
            )
        )
        active_chains = active_chains_result.scalar() or 0
        
        # Calculate completion rate
        total_created = total_gifts_sent + total_chains_sent
        if total_created > 0:
            completed = total_created - active_gifts - active_chains
            completion_rate = (completed / total_created) * 100
        else:
            completion_rate = 0.0
        
        # Get popular unlock types
        unlock_types_result = await db.execute(
            select(
                Gift.unlock_type,
                func.count(Gift.id).label('count')
            ).where(
                Gift.sender_id == user.id
            ).group_by(Gift.unlock_type)
            .order_by(desc('count'))
            .limit(5)
        )
        popular_unlock_types = [
            {"type": row.unlock_type.value if row.unlock_type else "GPS", "count": row.count}
            for row in unlock_types_result
        ]
        
        # Get recent activity (last 5 events)
        recent_gifts = await db.execute(
            select(Gift)
            .where(Gift.sender_id == user.id)
            .order_by(desc(Gift.created_at))
            .limit(5)
        )
        
        recent_activity = [
            {
                "type": "gift",
                "id": str(gift.id),
                "recipient": gift.recipient_address[:8] + "...",
                "amount": 0.0,  # Gift model doesn't have amount field
                "status": "claimed" if (gift.status and gift.status.value == "CLAIMED") else "active",
                "created_at": gift.created_at.isoformat()
            }
            for gift in recent_gifts.scalars()
        ]
        
        return {
            "total_gifts_sent": total_gifts_sent,
            "total_chains_sent": total_chains_sent,
            "total_gifts_received": total_gifts_received,
            "total_chains_received": total_chains_received,
            "total_ggt_spent": total_ggt_spent,
            "total_ggt_received": total_ggt_received,
            "active_gifts": active_gifts,
            "active_chains": active_chains,
            "completion_rate": round(completion_rate, 2),
            "popular_unlock_types": popular_unlock_types,
            "recent_activity": recent_activity
        }
    
    async def get_sent_gifts(
        self,
        db: AsyncSession,
        wallet_address: str,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get paginated list of gifts sent by user"""
        
        # Get user
        user_result = await db.execute(
            select(User).where(User.wallet_address == wallet_address)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            return self._empty_list_response()
        
        # Get total count
        count_result = await db.execute(
            select(func.count(Gift.id)).where(Gift.sender_id == user.id)
        )
        total = count_result.scalar() or 0
        
        # Get gifts
        gifts_result = await db.execute(
            select(Gift)
            .where(Gift.sender_id == user.id)
            .order_by(desc(Gift.created_at))
            .offset(skip)
            .limit(limit)
        )
        gifts = gifts_result.scalars().all()
        
        return {
            "gifts": gifts,
            "total": total,
            "page": skip // limit + 1,
            "per_page": limit,
            "has_more": (skip + limit) < total
        }
    
    async def get_received_gifts(
        self,
        db: AsyncSession,
        wallet_address: str,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get paginated list of gifts received by user"""
        
        # Get total count
        count_result = await db.execute(
            select(func.count(Gift.id)).where(
                Gift.recipient_address == wallet_address
            )
        )
        total = count_result.scalar() or 0
        
        # Get gifts
        gifts_result = await db.execute(
            select(Gift)
            .where(Gift.recipient_address == wallet_address)
            .order_by(desc(Gift.created_at))
            .offset(skip)
            .limit(limit)
        )
        gifts = gifts_result.scalars().all()
        
        return {
            "gifts": gifts,
            "total": total,
            "page": skip // limit + 1,
            "per_page": limit,
            "has_more": (skip + limit) < total
        }
    
    async def get_sent_chains(
        self,
        db: AsyncSession,
        wallet_address: str,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get paginated list of chains sent by user"""
        
        # Get user
        user_result = await db.execute(
            select(User).where(User.wallet_address == wallet_address)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            return self._empty_list_response()
        
        # Get total count
        count_result = await db.execute(
            select(func.count(GiftChain.id)).where(
                GiftChain.creator_id == user.id
            )
        )
        total = count_result.scalar() or 0
        
        # Get chains with steps
        chains_result = await db.execute(
            select(GiftChain)
            .options(selectinload(GiftChain.steps))
            .where(GiftChain.creator_id == user.id)
            .order_by(desc(GiftChain.created_at))
            .offset(skip)
            .limit(limit)
        )
        chains = chains_result.scalars().all()
        
        return {
            "chains": chains,
            "total": total,
            "page": skip // limit + 1,
            "per_page": limit,
            "has_more": (skip + limit) < total
        }
    
    async def get_received_chains(
        self,
        db: AsyncSession,
        wallet_address: str,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get paginated list of chains received by user"""
        
        # Get total count
        count_result = await db.execute(
            select(func.count(GiftChain.id)).where(
                GiftChain.recipient_address == wallet_address
            )
        )
        total = count_result.scalar() or 0
        
        # Get chains with steps
        chains_result = await db.execute(
            select(GiftChain)
            .options(selectinload(GiftChain.steps))
            .where(GiftChain.recipient_address == wallet_address)
            .order_by(desc(GiftChain.created_at))
            .offset(skip)
            .limit(limit)
        )
        chains = chains_result.scalars().all()
        
        return {
            "chains": chains,
            "total": total,
            "page": skip // limit + 1,
            "per_page": limit,
            "has_more": (skip + limit) < total
        }
    
    def _empty_stats(self) -> Dict[str, Any]:
        """Return empty stats structure"""
        return {
            "total_gifts_sent": 0,
            "total_chains_sent": 0,
            "total_gifts_received": 0,
            "total_chains_received": 0,
            "total_ggt_spent": 0.0,
            "total_ggt_received": 0.0,
            "active_gifts": 0,
            "active_chains": 0,
            "completion_rate": 0.0,
            "popular_unlock_types": [],
            "recent_activity": []
        }
    
    def _empty_list_response(self) -> Dict[str, Any]:
        """Return empty list response"""
        return {
            "items": [],
            "total": 0,
            "page": 1,
            "per_page": 20,
            "has_more": False
        }


# Singleton instance
crud_dashboard = CRUDDashboard()