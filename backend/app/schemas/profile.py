"""
Profile-related Pydantic schemas for API validation and serialization.

Defines schemas for user profile management, notification preferences,
and achievement tracking.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile information."""
    display_name: Optional[str] = Field(None, max_length=100, description="User's display name")
    bio: Optional[str] = Field(None, max_length=1000, description="User's bio/description")
    favorite_location: Optional[str] = Field(None, max_length=200, description="User's favorite location")
    is_public_profile: Optional[bool] = Field(None, description="Whether profile is publicly visible")

    @validator('display_name')
    def validate_display_name(cls, v):
        if v is not None and v.strip() == '':
            return None
        return v.strip() if v else v

    @validator('bio')
    def validate_bio(cls, v):
        if v is not None and v.strip() == '':
            return None
        return v.strip() if v else v

    @validator('favorite_location')
    def validate_favorite_location(cls, v):
        if v is not None and v.strip() == '':
            return None
        return v.strip() if v else v


class UserProfileResponse(BaseModel):
    """Schema for user profile API responses."""
    wallet_address: str = Field(..., description="User's wallet address")
    display_name: Optional[str] = Field(None, description="User's display name")
    bio: Optional[str] = Field(None, description="User's bio/description")
    favorite_location: Optional[str] = Field(None, description="User's favorite location")
    is_public_profile: bool = Field(..., description="Whether profile is publicly visible")
    member_since: datetime = Field(..., description="Date user joined")
    last_activity: Optional[datetime] = Field(None, description="Last activity timestamp")

    class Config:
        from_attributes = True


class NotificationPreferencesUpdate(BaseModel):
    """Schema for updating notification preferences."""
    email_notifications: Optional[bool] = Field(None, description="Receive email notifications")
    gift_notifications: Optional[bool] = Field(None, description="Receive gift-related notifications")
    marketing_emails: Optional[bool] = Field(None, description="Receive marketing emails")


class NotificationPreferencesResponse(BaseModel):
    """Schema for notification preferences API responses."""
    email_notifications: bool = Field(..., description="Receive email notifications")
    gift_notifications: bool = Field(..., description="Receive gift-related notifications")
    marketing_emails: bool = Field(..., description="Receive marketing emails")

    class Config:
        from_attributes = True


class UserAchievement(BaseModel):
    """Schema for individual user achievements."""
    id: str = Field(..., description="Achievement identifier")
    title: str = Field(..., description="Achievement title")
    description: str = Field(..., description="Achievement description")
    category: str = Field(..., description="Achievement category (milestone, creator, explorer)")
    earned: bool = Field(..., description="Whether achievement has been earned")
    earned_date: Optional[datetime] = Field(None, description="Date achievement was earned")
    progress: Optional[int] = Field(None, ge=0, le=100, description="Progress percentage (0-100)")


class UserAchievementsResponse(BaseModel):
    """Schema for user achievements API responses."""
    achievements: List[UserAchievement] = Field(..., description="List of user achievements")
    total_earned: int = Field(..., description="Total number of achievements earned")
    total_available: int = Field(..., description="Total number of achievements available")
    completion_percentage: int = Field(..., ge=0, le=100, description="Overall completion percentage")


class UserStatsResponse(BaseModel):
    """Schema for user statistics (used internally for achievement calculations)."""
    total_gifts_created: int = Field(..., description="Total gifts created by user")
    total_gifts_claimed: int = Field(..., description="Total gifts claimed by user")
    total_chains_created: int = Field(..., description="Total chains created by user")
    first_gift_created_at: Optional[datetime] = Field(None, description="Date of first gift creation")
    first_gift_claimed_at: Optional[datetime] = Field(None, description="Date of first gift claim")
    unique_locations_count: int = Field(..., description="Number of unique locations used")
    days_active: int = Field(..., description="Number of days since joining")
    gifts_created_and_claimed: int = Field(0, description="Gifts created by user that were claimed by others")

    class Config:
        from_attributes = True