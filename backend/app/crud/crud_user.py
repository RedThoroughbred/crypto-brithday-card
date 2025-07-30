from typing import Any, Dict, Optional, Union

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_wallet_address(self, db: AsyncSession, *, wallet_address: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.wallet_address == wallet_address))
        return result.scalars().first()


user_crud = CRUDUser(User)
