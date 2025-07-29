import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Float,
    Text,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ChainClaim(Base):
    __tablename__ = "chain_claims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chain_id = Column(UUID(as_uuid=True), ForeignKey("gift_chains.id"), nullable=False)
    step_id = Column(UUID(as_uuid=True), ForeignKey("chain_steps.id"), nullable=False)
    claimer_address = Column(String, nullable=False)  # Wallet address
    
    # Claim location (for GPS steps)
    claim_lat = Column(Float, nullable=True)
    claim_lng = Column(Float, nullable=True)
    
    # Claim data (for other unlock types)
    claim_data = Column(JSON, nullable=True)
    # Examples:
    # Password: {"password_attempt": "text"}
    # Quiz: {"answer_attempt": "text"}
    # View: {"viewed_at": "timestamp"}
    
    # Transaction data
    claim_tx_hash = Column(String, nullable=False)
    claim_block_number = Column(Integer, nullable=True)
    
    # Relationships
    chain = relationship("GiftChain", back_populates="claims")
    step = relationship("ChainStep", back_populates="claims")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ChainClaim(id={self.id}, chain_id={self.chain_id}, step_id={self.step_id})>"