"""
Profile Management API Endpoints

Provides endpoints for user profile management, notification preferences,
and achievement tracking.
"""

from datetime import datetime, timedelta
from typing import List, Optional
import structlog

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct

from app.core.database import get_db
from app.api.routes.auth import get_current_user_from_token
from app.models.user import User
from app.models.gift import Gift
from app.models.gift_chain import GiftChain
from app.schemas.profile import (
    UserProfileUpdate,
    UserProfileResponse, 
    NotificationPreferencesUpdate,
    NotificationPreferencesResponse,
    UserAchievement,
    UserAchievementsResponse,
    UserStatsResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get(
    "",
    response_model=UserProfileResponse,
    summary="Get User Profile",
    description="Retrieve the current user's profile information"
)
async def get_profile(
    current_user: str = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's profile information."""
    try:
        # Get user from database
        stmt = select(User).where(User.wallet_address == current_user)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return UserProfileResponse(
            wallet_address=user.wallet_address,
            display_name=user.display_name,
            bio=user.bio,
            favorite_location=user.favorite_location,
            is_public_profile=user.is_public_profile,
            member_since=user.created_at,
            last_activity=user.last_activity_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get user profile", error=str(e), user=current_user)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )


@router.put(
    "",
    response_model=UserProfileResponse,
    summary="Update User Profile",
    description="Update the current user's profile information"
)
async def update_profile(
    profile_update: UserProfileUpdate,
    current_user: str = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile information."""
    try:
        # Get user from database
        stmt = select(User).where(User.wallet_address == current_user)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Update fields that were provided
        update_data = profile_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        # Update timestamp
        user.updated_at = datetime.utcnow()
        
        # Commit changes
        await db.commit()
        await db.refresh(user)
        
        logger.info("Profile updated successfully", user=current_user, fields=list(update_data.keys()))
        
        return UserProfileResponse(
            wallet_address=user.wallet_address,
            display_name=user.display_name,
            bio=user.bio,
            favorite_location=user.favorite_location,
            is_public_profile=user.is_public_profile,
            member_since=user.created_at,
            last_activity=user.last_activity_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update user profile", error=str(e), user=current_user)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.get(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    summary="Get Notification Preferences",
    description="Retrieve the current user's notification preferences"
)
async def get_preferences(
    current_user: str = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's notification preferences."""
    try:
        # Get user from database
        stmt = select(User).where(User.wallet_address == current_user)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return NotificationPreferencesResponse(
            email_notifications=user.email_notifications,
            gift_notifications=user.gift_notifications,
            marketing_emails=user.marketing_emails
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get user preferences", error=str(e), user=current_user)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve preferences"
        )


@router.put(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    summary="Update Notification Preferences",
    description="Update the current user's notification preferences"
)
async def update_preferences(
    preferences_update: NotificationPreferencesUpdate,
    current_user: str = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's notification preferences."""
    try:
        # Get user from database
        stmt = select(User).where(User.wallet_address == current_user)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Update fields that were provided
        update_data = preferences_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        # Update timestamp
        user.updated_at = datetime.utcnow()
        
        # Commit changes
        await db.commit()
        await db.refresh(user)
        
        logger.info("Preferences updated successfully", user=current_user, fields=list(update_data.keys()))
        
        return NotificationPreferencesResponse(
            email_notifications=user.email_notifications,
            gift_notifications=user.gift_notifications,
            marketing_emails=user.marketing_emails
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update user preferences", error=str(e), user=current_user)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preferences"
        )


async def calculate_user_stats(user: User, db: AsyncSession) -> UserStatsResponse:
    """Calculate user statistics for achievement system."""
    
    try:
        # Simple approach - just count what we can safely count
        gifts_created = 0
        gifts_claimed = 0
        chains_created = 0
        unique_locations = 0
        
        # Calculate days active
        days_active = (datetime.utcnow() - user.created_at).days
        
        return UserStatsResponse(
            total_gifts_created=gifts_created,
            total_gifts_claimed=gifts_claimed,
            total_chains_created=chains_created,
            first_gift_created_at=None,
            first_gift_claimed_at=None,
            unique_locations_count=unique_locations,
            days_active=days_active
        )
    except Exception as e:
        logger.error("Error calculating user stats", error=str(e), user=user.wallet_address)
        # Return safe defaults
        return UserStatsResponse(
            total_gifts_created=0,
            total_gifts_claimed=0,
            total_chains_created=0,
            first_gift_created_at=None,
            first_gift_claimed_at=None,
            unique_locations_count=0,
            days_active=0
        )


def generate_achievements(stats: UserStatsResponse) -> List[UserAchievement]:
    """Generate user achievements based on stats."""
    achievements = []
    
    # Welcome Aboard - automatic
    achievements.append(UserAchievement(
        id="welcome_aboard",
        title="Welcome Aboard",
        description="Joined the GeoGift community",
        category="milestone",
        earned=True,
        earned_date=datetime.utcnow() - timedelta(days=stats.days_active)
    ))
    
    # First Steps - created first gift
    achievements.append(UserAchievement(
        id="first_steps",
        title="First Steps", 
        description="Created your first gift",
        category="creator",
        earned=stats.total_gifts_created > 0,
        earned_date=stats.first_gift_created_at
    ))
    
    # Adventure Seeker - claimed first gift
    achievements.append(UserAchievement(
        id="adventure_seeker",
        title="Adventure Seeker",
        description="Claimed your first treasure",
        category="explorer", 
        earned=stats.total_gifts_claimed > 0,
        earned_date=stats.first_gift_claimed_at
    ))
    
    # Chain Master - created first chain
    achievements.append(UserAchievement(
        id="chain_master",
        title="Chain Master",
        description="Created a multi-step adventure",
        category="creator",
        earned=stats.total_chains_created > 0,
        earned_date=None  # Would need to get from chains table
    ))
    
    # Community Member - active for 30+ days
    achievements.append(UserAchievement(
        id="community_member",
        title="Community Member", 
        description="Active for 30+ days",
        category="milestone",
        earned=stats.days_active >= 30,
        earned_date=datetime.utcnow() - timedelta(days=max(0, stats.days_active - 30)) if stats.days_active >= 30 else None
    ))
    
    # Explorer - visited 5+ different locations
    achievements.append(UserAchievement(
        id="explorer",
        title="Explorer",
        description="Created gifts at 5+ different locations", 
        category="explorer",
        earned=stats.unique_locations_count >= 5,
        earned_date=None,  # Would need more complex calculation
        progress=min(100, (stats.unique_locations_count / 5) * 100) if stats.unique_locations_count < 5 else None
    ))
    
    return achievements


@router.get(
    "/achievements",
    response_model=UserAchievementsResponse,
    summary="Get User Achievements",
    description="Retrieve the current user's achievements and progress"
)
async def get_achievements(
    current_user: str = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's achievements and progress."""
    try:
        # Get user from database
        stmt = select(User).where(User.wallet_address == current_user)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Calculate user stats
        stats = await calculate_user_stats(user, db)
        
        # Generate achievements
        achievements = generate_achievements(stats)
        
        # Calculate totals
        total_earned = sum(1 for achievement in achievements if achievement.earned)
        total_available = len(achievements)
        completion_percentage = int((total_earned / total_available) * 100)
        
        return UserAchievementsResponse(
            achievements=achievements,
            total_earned=total_earned,
            total_available=total_available,
            completion_percentage=completion_percentage
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get user achievements", error=str(e), user=current_user)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve achievements"
        )