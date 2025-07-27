"""
FastAPI main application for GeoGift platform.
Handles location-verified crypto gift creation and claiming.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import uvicorn
import structlog

from app.core.config import settings
from app.core.database import engine, get_db
from app.core.logging import setup_logging
from app.api.v1.router import api_router

# Setup structured logging
setup_logging()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting GeoGift API server", version=settings.VERSION)
    
    # TODO: Initialize database, Redis, Web3 connections
    # TODO: Start background tasks
    
    yield
    
    # Shutdown
    logger.info("Shutting down GeoGift API server")
    # TODO: Close database connections, cleanup resources


# Create FastAPI application
app = FastAPI(
    title="GeoGift API",
    description="Location-verified crypto gift platform API",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {
        "message": "GeoGift API",
        "version": settings.VERSION,
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "connected",  # TODO: Add actual database health check
        "redis": "connected",     # TODO: Add actual Redis health check
        "web3": "connected"       # TODO: Add actual Web3 health check
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_config=None  # Use our custom logging setup
    )