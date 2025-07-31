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
        # Count gifts created by this user
        gifts_created_stmt = select(func.count(Gift.id)).where(Gift.giver_address == user.wallet_address)
        gifts_created_result = await db.execute(gifts_created_stmt)
        gifts_created = gifts_created_result.scalar() or 0
        
        # Count gifts claimed by this user
        gifts_claimed_stmt = select(func.count(Gift.id)).where(
            Gift.receiver_address == user.wallet_address,
            Gift.claimed == True
        )
        gifts_claimed_result = await db.execute(gifts_claimed_stmt)
        gifts_claimed = gifts_claimed_result.scalar() or 0
        
        # Count chains created by this user
        chains_created_stmt = select(func.count(GiftChain.id)).where(GiftChain.creator_address == user.wallet_address)
        chains_created_result = await db.execute(chains_created_stmt)
        chains_created = chains_created_result.scalar() or 0
        
        # Count unique locations for gifts created
        unique_locations_stmt = select(func.count(distinct(func.concat(Gift.latitude, ',', Gift.longitude)))).where(
            Gift.giver_address == user.wallet_address
        )
        unique_locations_result = await db.execute(unique_locations_stmt)
        unique_locations = unique_locations_result.scalar() or 0
        
        # Get first gift created date
        first_gift_stmt = select(func.min(Gift.created_at)).where(Gift.giver_address == user.wallet_address)
        first_gift_result = await db.execute(first_gift_stmt)
        first_gift_created_at = first_gift_result.scalar()
        
        # Get first gift claimed date
        first_claim_stmt = select(func.min(Gift.claimed_at)).where(
            Gift.receiver_address == user.wallet_address,
            Gift.claimed == True
        )
        first_claim_result = await db.execute(first_claim_stmt)
        first_gift_claimed_at = first_claim_result.scalar()
        
        # Count gifts created by user that were claimed by others
        gifts_created_and_claimed_stmt = select(func.count(Gift.id)).where(
            Gift.giver_address == user.wallet_address,
            Gift.claimed == True
        )
        gifts_created_and_claimed_result = await db.execute(gifts_created_and_claimed_stmt)
        gifts_created_and_claimed = gifts_created_and_claimed_result.scalar() or 0
        
        # Calculate days active
        days_active = (datetime.utcnow() - user.created_at).days
        
        return UserStatsResponse(
            total_gifts_created=gifts_created,
            total_gifts_claimed=gifts_claimed,
            total_chains_created=chains_created,
            first_gift_created_at=first_gift_created_at,
            first_gift_claimed_at=first_gift_claimed_at,
            unique_locations_count=unique_locations,
            days_active=days_active,
            gifts_created_and_claimed=gifts_created_and_claimed
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
            days_active=0,
            gifts_created_and_claimed=0
        )


def generate_achievements(stats: UserStatsResponse, user: User) -> List[UserAchievement]:
    """Generate user achievements based on stats."""
    achievements = []
    
    # Welcome Aboard - has profile display name
    achievements.append(UserAchievement(
        id="welcome_aboard",
        title="Welcome Aboard",
        description="Complete your profile with a display name",
        category="milestone",
        earned=bool(user.display_name),
        earned_date=user.created_at if user.display_name else None,
        progress=100 if user.display_name else 0
    ))
    
    # First Steps - created first gift
    achievements.append(UserAchievement(
        id="first_steps",
        title="First Steps", 
        description="Create your first gift",
        category="creator",
        earned=stats.total_gifts_created > 0,
        earned_date=stats.first_gift_created_at,
        progress=100 if stats.total_gifts_created > 0 else 0
    ))
    
    # Adventure Seeker - created gifts at 3+ unique locations
    achievements.append(UserAchievement(
        id="adventure_seeker",
        title="Adventure Seeker",
        description="Create gifts at 3 different locations",
        category="explorer", 
        earned=stats.unique_locations_count >= 3,
        earned_date=None,  # Would need more complex calculation
        progress=min(100, int((stats.unique_locations_count / 3) * 100))
    ))
    
    # Chain Master - created 3+ chains
    achievements.append(UserAchievement(
        id="chain_master",
        title="Chain Master",
        description="Create 3 multi-step adventures",
        category="creator",
        earned=stats.total_chains_created >= 3,
        earned_date=None,  # Would need to get from chains table
        progress=min(100, int((stats.total_chains_created / 3) * 100))
    ))
    
    # Community Member - gifts claimed by others (measuring engagement)
    achievements.append(UserAchievement(
        id="community_member",
        title="Community Member", 
        description="Have 3 of your gifts claimed by others",
        category="social",
        earned=stats.gifts_created_and_claimed >= 3,
        earned_date=None,  # Would need to track when 3rd gift was claimed
        progress=min(100, int((stats.gifts_created_and_claimed / 3) * 100))
    ))
    
    # Explorer - claimed 5+ gifts from others
    achievements.append(UserAchievement(
        id="explorer",
        title="Explorer",
        description="Claim 5 gifts from other users", 
        category="explorer",
        earned=stats.total_gifts_claimed >= 5,
        earned_date=None,  # Would need more complex calculation
        progress=min(100, int((stats.total_gifts_claimed / 5) * 100))
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
        achievements = generate_achievements(stats, user)
        
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