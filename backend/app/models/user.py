import uuid

from sqlalchemy import Column, DateTime, String, Boolean, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_address = Column(String, unique=True, index=True, nullable=False)

    # Profile Information
    display_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    favorite_location = Column(String(200), nullable=True)
    is_public_profile = Column(Boolean, default=False, nullable=False)

    # Notification Preferences
    email_notifications = Column(Boolean, default=True, nullable=False)
    gift_notifications = Column(Boolean, default=True, nullable=False)
    marketing_emails = Column(Boolean, default=False, nullable=False)

    # Achievement Tracking (for performance)
    total_gifts_created = Column(Integer, default=0, nullable=False)
    total_gifts_claimed = Column(Integer, default=0, nullable=False)
    total_chains_created = Column(Integer, default=0, nullable=False)
    first_gift_created_at = Column(DateTime(timezone=True), nullable=True)
    first_gift_claimed_at = Column(DateTime(timezone=True), nullable=True)
    last_activity_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    gifts_sent = relationship(
        "Gift", back_populates="sender", cascade="all, delete-orphan"
    )
    chains_created = relationship(
        "GiftChain", back_populates="creator", cascade="all, delete-orphan"
    )

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, wallet_address='{self.wallet_address}')>"
