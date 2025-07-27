import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from .user import UserRead
from app.models.gift import GiftStatus


class GiftBase(BaseModel):
    recipient_address: str = Field(..., example="0xabcdef1234567890abcdef1234567890abcdef12")
    lat: float = Field(..., example=34.052235)
    lon: float = Field(..., example=-118.243683)
    message: Optional[str] = Field(None, example="Happy Birthday!")


class GiftCreate(GiftBase):
    sender_id: uuid.UUID
    escrow_id: str = Field(..., example="some_escrow_id")


class GiftUpdate(BaseModel):
    recipient_address: Optional[str] = Field(None, example="0xabcdef1234567890abcdef1234567890abcdef12")
    lat: Optional[float] = Field(None, example=34.052235)
    lon: Optional[float] = Field(None, example=-118.243683)
    message: Optional[str] = Field(None, example="Happy Birthday!")
    status: Optional[GiftStatus] = None


class GiftRead(GiftBase):
    id: uuid.UUID
    sender: UserRead
    status: GiftStatus
    escrow_id: str
    created_at: datetime

    class Config:
        from_attributes = True