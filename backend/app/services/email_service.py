"""Email service for sending gift notifications"""
import os
from typing import Optional, Dict, Any
from pathlib import Path
from datetime import datetime
from app.core.config import settings

# Import the new flexible email system
from app.services.email_providers import email_service as flexible_email_service

class LegacyEmailService:
    """Legacy email service for backward compatibility"""
    def __init__(self):
        # Use the new flexible email service
        pass
    
    async def send_gift_notification(
        self,
        recipient_email: str,
        gift_id: str,
        giver_name: str,
        amount: str,
        message: str,
        clue: str,
        claim_url: str
    ) -> bool:
        """Send gift notification email to recipient"""
        
        if not self.client:
            print("⚠️  SendGrid not configured - email would be sent to:", recipient_email)
            print(f"Gift URL: {claim_url}")
            return True  # Return success for development
        
        try:
            # Email content
            subject = f"🎁 You've received a GeoGift from {giver_name}!"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>You've Received a GeoGift!</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .gift-amount {{ font-size: 24px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }}
                    .message-box {{ background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }}
                    .clue-box {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0; }}
                    .claim-button {{ display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }}
                    .steps {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
                    .step {{ margin: 10px 0; padding: 10px; border-left: 3px solid #667eea; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎁 You've Received a GeoGift!</h1>
                        <p>Someone special has sent you a location-based treasure hunt</p>
                    </div>
                    
                    <div class="content">
                        <div class="gift-amount">
                            Prize: {amount}
                        </div>
                        
                        <div class="message-box">
                            <h3>Personal Message:</h3>
                            <p style="font-style: italic;">"{message}"</p>
                            <p><strong>From:</strong> {giver_name}</p>
                        </div>
                        
                        <div class="clue-box">
                            <h3>🔍 Your Treasure Clue:</h3>
                            <p style="font-weight: bold; color: #856404;">"{clue}"</p>
                        </div>
                        
                        <div class="steps">
                            <h3>How to Claim Your Gift:</h3>
                            <div class="step">
                                <strong>1.</strong> Click the claim button below to open your gift
                            </div>
                            <div class="step">
                                <strong>2.</strong> Connect a crypto wallet (we'll help you create one if needed)
                            </div>
                            <div class="step">
                                <strong>3.</strong> Solve the clue to find the treasure location
                            </div>
                            <div class="step">
                                <strong>4.</strong> Go to that location and claim your crypto prize!
                            </div>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="{claim_url}" class="claim-button">
                                🎁 Claim Your Gift
                            </a>
                        </div>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                            <p>This is a GeoGift - a location-verified crypto gift. The funds are securely held in a smart contract until you claim them at the correct location.</p>
                            <p>Gift ID: {gift_id}</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Create email
            message = Mail(
                from_email=Email(self.from_email),
                to_emails=[To(recipient_email)],
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            # Send email
            response = self.client.send(message)
            
            if response.status_code == 202:
                print(f"✅ Email sent successfully to {recipient_email}")
                return True
            else:
                print(f"❌ Failed to send email: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Email sending error: {str(e)}")
            return False
    
    async def send_wallet_creation_help(self, recipient_email: str, claim_url: str) -> bool:
        """Send wallet creation instructions"""
        
        if not self.client:
            print("⚠️  Would send wallet help email to:", recipient_email)
            return True
        
        try:
            subject = "How to Create Your Crypto Wallet for GeoGift"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Create Your Crypto Wallet</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .step {{ background: white; margin: 15px 0; padding: 20px; border-radius: 5px; border-left: 4px solid #4CAF50; }}
                    .download-button {{ display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🦊 Create Your MetaMask Wallet</h1>
                        <p>Get ready to claim your GeoGift!</p>
                    </div>
                    
                    <div class="content">
                        <p>To claim your crypto gift, you'll need a digital wallet. Don't worry - it's free and takes just 2 minutes!</p>
                        
                        <div class="step">
                            <h3>Step 1: Download MetaMask</h3>
                            <p>MetaMask is a free, secure crypto wallet that works in your browser.</p>
                            <a href="https://metamask.io/download/" class="download-button" target="_blank">
                                Download MetaMask
                            </a>
                        </div>
                        
                        <div class="step">
                            <h3>Step 2: Create Your Wallet</h3>
                            <p>Follow MetaMask's setup guide to create your new wallet. Keep your secret phrase safe!</p>
                        </div>
                        
                        <div class="step">
                            <h3>Step 3: Switch to Sepolia Network</h3>
                            <p>Your gift is on the Sepolia test network. MetaMask will help you switch networks.</p>
                        </div>
                        
                        <div class="step">
                            <h3>Step 4: Claim Your Gift</h3>
                            <p>Once your wallet is set up, return to your gift claim page:</p>
                            <a href="{claim_url}" class="download-button">
                                Return to Claim Gift
                            </a>
                        </div>
                        
                        <div style="margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 5px;">
                            <h4>Need Help?</h4>
                            <p>Creating your first crypto wallet can feel overwhelming, but millions of people use MetaMask safely every day. If you need help, search "MetaMask tutorial" on YouTube for step-by-step videos.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
            
            message = Mail(
                from_email=Email(self.from_email),
                to_emails=[To(recipient_email)],
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            response = self.client.send(message)
            return response.status_code == 202
            
        except Exception as e:
            print(f"❌ Wallet help email error: {str(e)}")
            return False

    async def send_gift_chain_notification(
        self,
        recipient_email: str,
        gift_data: Dict[str, Any]
    ) -> bool:
        """Send beautiful gift chain notification email using template"""
        
        if not self.client:
            print("⚠️  SendGrid not configured - email would be sent to:", recipient_email)
            print(f"Gift URL: {gift_data.get('claim_url')}")
            return True  # Return success for development
        
        try:
            # Check if template exists, use inline HTML if not
            template_path = Path(__file__).parent.parent / "templates" / "gift_chain_email.html"
            
            if template_path.exists():
                # Use Jinja2 template
                template = self.jinja_env.get_template("gift_chain_email.html")
                
                # Prepare template data with defaults
                template_data = {
                    "recipient_name": gift_data.get("recipient_name"),
                    "sender_name": gift_data.get("sender_name", gift_data.get("giver_name")),
                    "gift_type": gift_data.get("gift_type", "chain"),
                    "gift_title": gift_data.get("title", "A Special Gift Awaits!"),
                    "gift_message": gift_data.get("message", "Someone special has sent you a gift!"),
                    "total_amount": gift_data.get("amount", "0.001"),
                    "currency": gift_data.get("currency", "ETH"),
                    "claim_url": gift_data.get("claim_url"),
                    "expiry_date": gift_data.get("expiry_date", "30 days"),
                    "total_steps": gift_data.get("total_steps", 1),
                    "first_step_title": gift_data.get("first_step_title", "Your First Challenge"),
                    "first_step_type": gift_data.get("first_step_type", "gps"),
                    "estimated_duration": gift_data.get("estimated_duration", "30-60 minutes"),
                    "theme": gift_data.get("theme", "custom")
                }
                
                html_content = template.render(**template_data)
            else:
                # Fallback to inline template
                html_content = await self._generate_inline_email_html(gift_data)
            
            # Determine subject based on gift type
            if gift_data.get("gift_type") == "chain":
                subject = f"🎁 {gift_data.get('title', 'A Multi-Step Adventure Awaits!')} - {gift_data.get('amount', '0.001')} {gift_data.get('currency', 'ETH')}"
            else:
                subject = f"🎁 You've received {gift_data.get('amount', '0.001')} {gift_data.get('currency', 'ETH')}!"
            
            # Create mail object
            message = Mail(
                from_email=Email(self.from_email),
                to_emails=[To(recipient_email)],
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            # Send email
            response = self.client.send(message)
            
            if response.status_code == 202:
                print(f"✅ Gift notification sent to {recipient_email}")
                return True
            else:
                print(f"❌ Failed to send email: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Email sending error: {str(e)}")
            return False
    
    async def _generate_inline_email_html(self, gift_data: Dict[str, Any]) -> str:
        """Generate inline HTML email when template file is not available"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{gift_data.get('title', 'GeoGift')}</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }}
                .container {{ max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }}
                .header {{ background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); padding: 40px 20px; text-align: center; color: white; }}
                .gift-icon {{ width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; }}
                .content {{ padding: 40px 30px; }}
                .amount-badge {{ display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 10px 0; }}
                .cta-button {{ display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); color: white !important; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; margin: 20px 0; }}
                .step-card {{ background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #8b5cf6; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="gift-icon">🎁</div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">
                        {gift_data.get('title', 'A Special Gift Awaits!')}
                    </h1>
                    <p style="margin: 10px 0 0; opacity: 0.9;">
                        From {gift_data.get('sender_name', 'Someone Special')}
                    </p>
                </div>
                
                <div class="content">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <p style="font-size: 18px; color: #374151; line-height: 1.6;">
                            {gift_data.get('message', 'You have received a special gift!')}
                        </p>
                        <span class="amount-badge">
                            {gift_data.get('amount', '0.001')} {gift_data.get('currency', 'ETH')}
                        </span>
                    </div>
                    
                    {'<div style="margin: 30px 0;"><h2 style="color: #1f2937;">Your Adventure Awaits! 🗺️</h2><p>This gift includes ' + str(gift_data.get("total_steps", 1)) + ' exciting steps to unlock.</p></div>' if gift_data.get('gift_type') == 'chain' else ''}
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{gift_data.get('claim_url')}" class="cta-button">
                            {'Start Your Adventure →' if gift_data.get('gift_type') == 'chain' else 'Claim Your Gift →'}
                        </a>
                        <p style="margin: 10px 0 0; color: #9ca3af; font-size: 14px;">
                            Expires: {gift_data.get('expiry_date', '30 days')}
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

# Use the flexible email service as the main service
email_service = flexible_email_service