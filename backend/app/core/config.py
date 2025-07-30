"""
Application configuration using Pydantic settings.
Loads from environment variables with validation.
"""

from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, validator
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable loading."""
    
    # Application
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "GeoGift"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_SECRET_KEY: str = "your-jwt-secret"
    ENCRYPTION_KEY: str = "your-encryption-key"
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0", "192.168.86.245"]
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.86.245:3000"]
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "geogift"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "geogift_dev"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[PostgresDsn] = None
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=values.get("POSTGRES_PORT"),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 300  # 5 minutes
    
    # Blockchain
    WEB3_PROVIDER_URL: str = "https://eth-sepolia.g.alchemy.com/v2/demo"
    ETHEREUM_RPC_URL: str = "https://eth-mainnet.g.alchemy.com/v2/demo"
    SEPOLIA_RPC_URL: str = "https://eth-sepolia.g.alchemy.com/v2/demo"
    PRIVATE_KEY: Optional[str] = None
    CONTRACT_ADDRESS: Optional[str] = None
    
    # Location Services
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    MAPBOX_ACCESS_TOKEN: Optional[str] = None
    MAX_LOCATION_RADIUS: int = 1000  # meters
    MIN_LOCATION_RADIUS: int = 5     # meters
    
    # Platform
    PLATFORM_FEE_RATE: int = 250  # 2.5% in basis points
    FEE_RECIPIENT_ADDRESS: Optional[str] = None
    
    # Email Configuration (Multiple providers supported)
    FROM_EMAIL: str = "noreply@geogift.xyz"
    
    # SendGrid (if available)
    SENDGRID_API_KEY: Optional[str] = None
    
    # Gmail SMTP (if available) 
    GMAIL_EMAIL: Optional[str] = None
    GMAIL_APP_PASSWORD: Optional[str] = None  # Use App Password, not regular password
    
    # Outlook/Hotmail SMTP (if available)
    OUTLOOK_EMAIL: Optional[str] = None
    OUTLOOK_PASSWORD: Optional[str] = None
    
    # Generic SMTP (for any email provider)
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = True
    
    # External APIs
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    
    # File Storage
    UPLOAD_MAX_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_UPLOAD_TYPES: List[str] = ["image/jpeg", "image/png", "image/gif"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()