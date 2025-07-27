"""
Health check endpoints for monitoring and load balancer probes.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any

from app.core.config import settings

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    version: str
    environment: str
    services: Dict[str, str]


@router.get("", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check endpoint.
    Returns status of all critical services.
    """
    # TODO: Add actual health checks for dependencies
    services = {
        "database": "healthy",  # TODO: Check PostgreSQL connection
        "redis": "healthy",     # TODO: Check Redis connection  
        "web3": "healthy",      # TODO: Check Web3 provider connection
    }
    
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        services=services
    )


@router.get("/liveness")
async def liveness_probe():
    """
    Kubernetes liveness probe endpoint.
    Simple check that the service is running.
    """
    return {"status": "alive"}


@router.get("/readiness")
async def readiness_probe():
    """
    Kubernetes readiness probe endpoint.
    Checks if service is ready to handle requests.
    """
    # TODO: Add readiness checks for critical dependencies
    return {"status": "ready"}