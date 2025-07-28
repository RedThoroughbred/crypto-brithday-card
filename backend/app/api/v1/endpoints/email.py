"""Email notification endpoints"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.services.email_service import email_service
from app.api.routes.auth import get_current_user_from_token

router = APIRouter()

class SendGiftEmailRequest(BaseModel):
    recipient_email: EmailStr
    gift_id: str
    giver_name: str
    amount: str
    message: str
    clue: str

class SendWalletHelpRequest(BaseModel):
    recipient_email: EmailStr
    gift_id: str

@router.post("/send-gift-notification")
async def send_gift_notification(
    request: SendGiftEmailRequest,
    wallet_address: str = Depends(get_current_user_from_token)
):
    """Send gift notification email to recipient"""
    
    try:
        # Build claim URL
        claim_url = f"http://localhost:3000/claim?id={request.gift_id}"
        
        success = await email_service.send_gift_notification(
            recipient_email=request.recipient_email,
            gift_id=request.gift_id,
            giver_name=request.giver_name,
            amount=request.amount,
            message=request.message,
            clue=request.clue,
            claim_url=claim_url
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email")
        
        return {
            "success": True,
            "message": f"Gift notification sent to {request.recipient_email}",
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
async def test_email(email: str):
    """Test email sending (development only)"""
    
    try:
        success = await email_service.send_gift_notification(
            recipient_email=email,
            gift_id="test-123",
            giver_name="Test Sender",
            amount="0.001 ETH",
            message="This is a test gift message!",
            clue="Look for the place where developers debug their code...",
            claim_url="http://localhost:3000/claim?id=test-123"
        )
        
        return {
            "success": success,
            "message": f"Test email sent to {email}" if success else "Test email failed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test email failed: {str(e)}")