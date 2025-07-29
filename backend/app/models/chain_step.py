import enum
import uuid

from sqlalchemy import (
    Column,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UnlockType(int, enum.Enum):
    GPS = 0
    VIDEO = 1
    IMAGE = 2
    MARKDOWN = 3
    QUIZ = 4
    PASSWORD = 5
    URL = 6


class ChainStep(Base):
    __tablename__ = "chain_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chain_id = Column(UUID(as_uuid=True), ForeignKey("gift_chains.id"), nullable=False)
    step_index = Column(Integer, nullable=False)  # 0-based index
    
    title = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    unlock_type = Column(SAEnum(UnlockType), nullable=False)
    
    # GPS fields (only used for GPS type)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    radius = Column(Integer, nullable=True)
    
    # Unlock data stored as JSON for flexibility
    unlock_data = Column(JSON, nullable=True)
    # Examples:
    # Password: {"password": "hash", "hint": "text"}
    # Quiz: {"question": "text", "answer": "hash", "hints": ["hint1"]}
    # Markdown: {"content": "markdown text"}
    # Video/Image: {"url": "https://...", "type": "youtube"}
    # URL: {"target": "https://...", "instruction": "text"}
    
    # Clue hash stored on blockchain
    clue_hash = Column(String, nullable=False)
    
    # Reward
    reward_amount = Column(String, nullable=False)  # GGT amount as string
    
    # Status
    is_completed = Column(Boolean, default=False)
    is_unlocked = Column(Boolean, default=False)
    
    # Relationship
    chain = relationship("GiftChain", back_populates="steps")
    claims = relationship("ChainClaim", back_populates="step", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ChainStep(id={self.id}, chain_id={self.chain_id}, index={self.step_index}, type={self.unlock_type.name})>"