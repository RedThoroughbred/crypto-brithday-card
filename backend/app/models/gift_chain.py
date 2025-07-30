import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
    BigInteger,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ChainStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class GiftChain(Base):
    __tablename__ = "gift_chains"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chain_id = Column(String, unique=True, index=True, nullable=False)  # Blockchain chain ID
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    giver_address = Column(String, nullable=False)  # For API compatibility
    recipient_address = Column(String, nullable=False)
    recipient_email = Column(String, nullable=True)
    
    chain_title = Column(String, nullable=False)
    chain_description = Column(Text, nullable=True)
    total_value = Column(String, nullable=False)  # GGT amount as string to handle big numbers
    total_steps = Column(Integer, nullable=False)
    current_step = Column(Integer, default=0)
    
    status = Column(SAEnum(ChainStatus), default=ChainStatus.ACTIVE, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    is_expired = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    expiry_date = Column(DateTime(timezone=True), nullable=False)  # API compatibility
    
    # Transaction data
    creation_tx_hash = Column(String, nullable=False)
    creation_block_number = Column(BigInteger, nullable=True)
    blockchain_chain_id = Column(BigInteger, nullable=True)  # API compatibility
    transaction_hash = Column(String, nullable=True)  # API compatibility
    
    # Relationships
    creator = relationship("User", back_populates="chains_created")
    steps = relationship("ChainStep", back_populates="chain", cascade="all, delete-orphan")
    claims = relationship("ChainClaim", back_populates="chain", cascade="all, delete-orphan")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<GiftChain(id={self.id}, chain_id={self.chain_id}, title='{self.chain_title}')>"