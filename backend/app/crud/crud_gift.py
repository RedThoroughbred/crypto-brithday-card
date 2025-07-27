from typing import List, Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.gift import Gift, GiftStatus
from app.schemas.gift import GiftCreate, GiftUpdate


class CRUDGift(CRUDBase[Gift, GiftCreate, GiftUpdate]):
    async def get_by_escrow_id(self, db: AsyncSession, *, escrow_id: str) -> Optional[Gift]:
        """Get gift by escrow ID."""
        result = await db.execute(
            select(Gift)
            .options(selectinload(Gift.sender))
            .filter(Gift.escrow_id == escrow_id)
        )
        return result.scalars().first()

    async def get_by_sender(
        self, db: AsyncSession, *, sender_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> List[Gift]:
        """Get all gifts sent by a specific user."""
        result = await db.execute(
            select(Gift)
            .options(selectinload(Gift.sender))
            .filter(Gift.sender_id == sender_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_recipient(
        self, db: AsyncSession, *, recipient_address: str, skip: int = 0, limit: int = 100
    ) -> List[Gift]:
        """Get all gifts for a specific recipient address."""
        result = await db.execute(
            select(Gift)
            .options(selectinload(Gift.sender))
            .filter(Gift.recipient_address == recipient_address)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_status(
        self, db: AsyncSession, *, status: GiftStatus, skip: int = 0, limit: int = 100
    ) -> List[Gift]:
        """Get all gifts with a specific status."""
        result = await db.execute(
            select(Gift)
            .options(selectinload(Gift.sender))
            .filter(Gift.status == status)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def update_status(
        self, db: AsyncSession, *, gift_id: uuid.UUID, status: GiftStatus
    ) -> Optional[Gift]:
        """Update gift status."""
        gift = await self.get(db, gift_id)
        if gift:
            gift.status = status
            db.add(gift)
            await db.commit()
            await db.refresh(gift)
        return gift


gift = CRUDGift(Gift)