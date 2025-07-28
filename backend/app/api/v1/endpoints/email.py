"""Email notification endpoints"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from app.services.email_service import email_service
# from app.api.v1.endpoints.auth import get_current_user  # Not needed for public email testing

router = APIRouter()

class SendGiftEmailRequest(BaseModel):
    recipient_email: EmailStr
    gift_id: Optional[str] = None
    giver_name: Optional[str] = None
    amount: str
    message: str
    clue: Optional[str] = None
    # Enhanced fields for beautiful emails
    gift_type: str = Field(default="single", pattern="^(single|chain)$")
    title: Optional[str] = None
    currency: str = Field(default="ETH", pattern="^(ETH|GGT)$")
    expiry_date: Optional[str] = None
    # Chain specific
    total_steps: Optional[int] = None
    first_step_title: Optional[str] = None
    first_step_type: Optional[str] = None

class SendWalletHelpRequest(BaseModel):
    recipient_email: EmailStr
    gift_id: str

@router.post("/send-gift-notification")
async def send_gift_notification(
    request: SendGiftEmailRequest
):
    """Send beautiful gift notification email to recipient"""
    
    try:
        # Build claim URL based on gift type
        if request.gift_type == "chain":
            claim_url = f"http://localhost:3000/claim-chain?id={request.gift_id or 'new'}"
        else:
            claim_url = f"http://localhost:3000/claim?id={request.gift_id or 'new'}"
        
        # Prepare gift data for new template system
        gift_data = {
            "recipient_email": request.recipient_email,
            "gift_id": request.gift_id,
            "sender_name": request.giver_name or "Anonymous Sender",
            "giver_name": request.giver_name,  # Backward compatibility
            "amount": request.amount,
            "currency": request.currency,
            "message": request.message,
            "clue": request.clue,
            "claim_url": claim_url,
            "gift_type": request.gift_type,
            "title": request.title or "A Special Gift Awaits!",
            "expiry_date": request.expiry_date or "30 days",
            "total_steps": request.total_steps,
            "first_step_title": request.first_step_title,
            "first_step_type": request.first_step_type
        }
        
        # Use new template-based email service
        success = await email_service.send_gift_chain_notification(
            recipient_email=request.recipient_email,
            gift_data=gift_data
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email")
        
        return {
            "success": True,
            "message": f"Beautiful gift notification sent to {request.recipient_email}",
            "claim_url": claim_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email sending failed: {str(e)}")

@router.post("/send-wallet-help")
async def send_wallet_help(
    request: SendWalletHelpRequest
):
    """Send wallet creation help email (no auth required)"""
    
    try:
        claim_url = f"http://localhost:3000/claim?id={request.gift_id}"
        
        success = await email_service.send_wallet_creation_help(
            recipient_email=request.recipient_email,
            claim_url=claim_url
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send wallet help email")
        
        return {
            "success": True,
            "message": f"Wallet help sent to {request.recipient_email}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Wallet help email failed: {str(e)}")

@router.get("/test-email/{email}")
async def test_email(email: str, gift_type: str = "chain"):
    """Test email sending with beautiful templates (development only)"""
    
    try:
        # Create test data based on gift type
        if gift_type == "chain":
            gift_data = {
                "recipient_name": "Test Recipient",
                "sender_name": "Test Sender",
                "gift_type": "chain",
                "title": "Amazing Adventure Quest",
                "message": "I've created a special multi-step treasure hunt just for you! Each step reveals a new surprise.",
                "amount": "0.1",
                "currency": "ETH",
                "claim_url": "http://localhost:3000/claim-chain?id=test-123",
                "expiry_date": "December 31, 2024",
                "total_steps": 5,
                "first_step_title": "The Journey Begins at Our Favorite Spot",
                "first_step_type": "gps",
                "estimated_duration": "45-60 minutes",
                "theme": "adventure"
            }
        else:
            gift_data = {
                "sender_name": "Test Sender",
                "gift_type": "single",
                "title": "You've Received a GeoGift!",
                "message": "This is a test gift message! Follow the clue to find your treasure.",
                "amount": "0.001",
                "currency": "ETH",
                "claim_url": "http://localhost:3000/claim?id=test-123",
                "clue": "Look for the place where developers debug their code...",
                "expiry_date": "30 days"
            }
        
        success = await email_service.send_gift_chain_notification(
            recipient_email=email,
            gift_data=gift_data
        )
        
        return {
            "success": success,
            "message": f"Beautiful test email sent to {email}" if success else "Test email failed",
            "gift_type": gift_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test email failed: {str(e)}")