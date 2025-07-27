import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserBase(BaseModel):
    wallet_address: str = Field(..., example="0x1234567890abcdef1234567890abcdef12345678")


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    wallet_address: Optional[str] = Field(None, example="0x1234567890abcdef1234567890abcdef12345678")


class UserRead(UserBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True