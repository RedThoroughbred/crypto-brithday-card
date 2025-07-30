import enum
import uuid

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class GiftStatus(str, enum.Enum):
    PENDING = "PENDING"
    CLAIMED = "CLAIMED"
    EXPIRED = "EXPIRED"


class UnlockType(str, enum.Enum):
    GPS = "GPS"
    VIDEO = "VIDEO"
    IMAGE = "IMAGE"
    MARKDOWN = "MARKDOWN"
    QUIZ = "QUIZ"
    PASSWORD = "PASSWORD"
    URL = "URL"


class Gift(Base):
    __tablename__ = "gifts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    recipient_address = Column(String, nullable=False)
    escrow_id = Column(String, unique=True, index=True, nullable=False)

    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)

    message = Column(String, nullable=True)
    status = Column(SAEnum(GiftStatus), default=GiftStatus.PENDING, nullable=False)
    
    # Unlock mechanism (how to claim the gift)
    unlock_type = Column(SAEnum(UnlockType), default=UnlockType.GPS, nullable=False)
    unlock_challenge_data = Column(Text, nullable=True)  # Password, quiz Q&A, content URL, etc.
    
    # Reward content (what unlocks WITH the funds)
    reward_content = Column(Text, nullable=True)  # URL, file, additional message
    reward_content_type = Column(String(50), nullable=True)  # 'url', 'file', 'message'

    sender = relationship("User", back_populates="gifts_sent")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Gift(id={self.id}, status='{self.status.value}')>"
