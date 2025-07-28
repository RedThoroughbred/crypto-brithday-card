"""
API v1 router that includes all endpoint modules.
Organizes routes by feature area.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import gifts, auth, location, health, email

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(gifts.router, prefix="/gifts", tags=["gifts"])
api_router.include_router(location.router, prefix="/location", tags=["location"])
api_router.include_router(email.router, prefix="/email", tags=["email"])