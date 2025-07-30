import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from .user import UserRead
from app.models.gift import GiftStatus, UnlockType


class GiftBase(BaseModel):
    recipient_address: str = Field(..., example="0xabcdef1234567890abcdef1234567890abcdef12")
    lat: float = Field(..., example=34.052235)
    lon: float = Field(..., example=-118.243683)
    message: Optional[str] = Field(None, example="Happy Birthday!")
    unlock_type: Optional[UnlockType] = Field(UnlockType.GPS, example="GPS")
    unlock_challenge_data: Optional[str] = Field(None, example='{"password": "secret123", "quiz": {"question": "What is 2+2?", "answer": "4"}, "content_url": "https://video.com/watch"}')
    reward_content: Optional[str] = Field(None, example="https://example.com/surprise")
    reward_content_type: Optional[str] = Field(None, example="url")


class GiftCreate(GiftBase):
    sender_id: uuid.UUID
    escrow_id: str = Field(..., example="some_escrow_id")


class GiftUpdate(BaseModel):
    recipient_address: Optional[str] = Field(None, example="0xabcdef1234567890abcdef1234567890abcdef12")
    lat: Optional[float] = Field(None, example=34.052235)
    lon: Optional[float] = Field(None, example=-118.243683)
    message: Optional[str] = Field(None, example="Happy Birthday!")
    status: Optional[GiftStatus] = None
    unlock_type: Optional[UnlockType] = None
    unlock_challenge_data: Optional[str] = None
    reward_content: Optional[str] = None
    reward_content_type: Optional[str] = None


class GiftRead(GiftBase):
    id: uuid.UUID
    sender: UserRead
    status: GiftStatus
    escrow_id: str
    created_at: datetime

    class Config:
        from_attributes = True