"""
Flexible email provider system that supports multiple email services
"""
import smtplib
import logging
from abc import ABC, abstractmethod
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailProvider(ABC):
    """Abstract base class for email providers"""
    
    @abstractmethod
    async def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send an email"""
        pass


class LogEmailProvider(EmailProvider):
    """Development provider that just logs emails instead of sending them"""
    
    async def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Log email instead of sending"""
        print("\n" + "="*80)
        print("📧 EMAIL WOULD BE SENT")
        print("="*80)
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print("-"*40)
        print("HTML Content Preview:")
        # Extract the main message from HTML for preview
        import re
        text_content = re.sub('<[^<]+?>', '', html_content)
        preview = text_content[:300] + "..." if len(text_content) > 300 else text_content
        print(preview)
        print("-"*40)
        print("Full HTML saved to: /tmp/last_email.html")
        
        # Save full HTML to file for preview
        try:
            with open("/tmp/last_email.html", "w") as f:
                f.write(html_content)
            print("💡 Open /tmp/last_email.html in a browser to see the full email!")
        except Exception as e:
            print(f"Could not save HTML file: {e}")
        
        print("="*80 + "\n")
        return True


class SMTPEmailProvider(EmailProvider):
    """Generic SMTP provider that works with Gmail, Outlook, Yahoo, etc."""
    
    def __init__(
        self, 
        smtp_server: str,
        smtp_port: int,
        username: str,
        password: str,
        use_tls: bool = True,
        from_email: Optional[str] = None
    ):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.use_tls = use_tls
        self.from_email = from_email or username
    
    async def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email via SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {str(e)}")
            return False


class GmailProvider(SMTPEmailProvider):
    """Gmail-specific SMTP provider"""
    
    def __init__(self, email: str, app_password: str):
        super().__init__(
            smtp_server="smtp.gmail.com",
            smtp_port=587,
            username=email,
            password=app_password,
            use_tls=True,
            from_email=email
        )


class OutlookProvider(SMTPEmailProvider):
    """Outlook/Hotmail SMTP provider"""
    
    def __init__(self, email: str, password: str):
        super().__init__(
            smtp_server="smtp-mail.outlook.com",
            smtp_port=587,
            username=email,
            password=password,
            use_tls=True,
            from_email=email
        )


class SendGridProvider(EmailProvider):
    """SendGrid provider (if API key is available)"""
    
    def __init__(self, api_key: str, from_email: str):
        self.api_key = api_key
        self.from_email = from_email
        
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Email, To, Content
            self.client = SendGridAPIClient(api_key)
            self.Mail = Mail
            self.Email = Email
            self.To = To
            self.Content = Content
        except ImportError:
            logger.warning("SendGrid library not installed")
            self.client = None
    
    async def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email via SendGrid"""
        if not self.client:
            logger.error("SendGrid client not available")
            return False
        
        try:
            message = self.Mail(
                from_email=self.Email(self.from_email),
                to_emails=[self.To(to_email)],
                subject=subject,
                html_content=self.Content("text/html", html_content)
            )
            
            response = self.client.send(message)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent via SendGrid to {to_email}")
                return True
            else:
                logger.error(f"SendGrid failed with status: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"SendGrid error: {str(e)}")
            return False


class EmailService:
    """Main email service that uses the configured provider"""
    
    def __init__(self):
        self.provider = self._get_email_provider()
        
        # Set up Jinja2 for email templates
        template_dir = Path(__file__).parent.parent / "templates"
        template_dir.mkdir(exist_ok=True)
        self.jinja_env = Environment(loader=FileSystemLoader(str(template_dir)))
    
    def _get_email_provider(self) -> EmailProvider:
        """Select and configure the email provider based on available settings"""
        
        # 1. Try SendGrid if API key is available
        if hasattr(settings, 'SENDGRID_API_KEY') and settings.SENDGRID_API_KEY:
            logger.info("Using SendGrid email provider")
            return SendGridProvider(settings.SENDGRID_API_KEY, settings.FROM_EMAIL)
        
        # 2. Try Gmail if credentials are available
        if hasattr(settings, 'GMAIL_EMAIL') and hasattr(settings, 'GMAIL_APP_PASSWORD'):
            if settings.GMAIL_EMAIL and settings.GMAIL_APP_PASSWORD:
                logger.info("Using Gmail SMTP provider")
                return GmailProvider(settings.GMAIL_EMAIL, settings.GMAIL_APP_PASSWORD)
        
        # 3. Try Outlook if credentials are available
        if hasattr(settings, 'OUTLOOK_EMAIL') and hasattr(settings, 'OUTLOOK_PASSWORD'):
            if settings.OUTLOOK_EMAIL and settings.OUTLOOK_PASSWORD:
                logger.info("Using Outlook SMTP provider")
                return OutlookProvider(settings.OUTLOOK_EMAIL, settings.OUTLOOK_PASSWORD)
        
        # 4. Try generic SMTP if configured
        if all(hasattr(settings, attr) for attr in ['SMTP_SERVER', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD']):
            if all(getattr(settings, attr, None) for attr in ['SMTP_SERVER', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD']):
                logger.info("Using generic SMTP provider")
                return SMTPEmailProvider(
                    smtp_server=settings.SMTP_SERVER,
                    smtp_port=settings.SMTP_PORT,
                    username=settings.SMTP_USERNAME,
                    password=settings.SMTP_PASSWORD,
                    use_tls=getattr(settings, 'SMTP_USE_TLS', True),
                    from_email=getattr(settings, 'FROM_EMAIL', settings.SMTP_USERNAME)
                )
        
        # 5. Default to log provider for development
        logger.info("Using Log email provider (development mode)")
        return LogEmailProvider()
    
    async def send_gift_chain_notification(
        self,
        recipient_email: str,
        gift_data: Dict[str, Any]
    ) -> bool:
        """Send beautiful gift chain notification email using templates"""
        
        try:
            # Try to load Jinja2 template
            template_path = Path(__file__).parent.parent / "templates" / "gift_chain_email.html"
            
            if template_path.exists():
                template = self.jinja_env.get_template("gift_chain_email.html")
                html_content = template.render(**gift_data)
            else:
                # Use inline HTML template
                html_content = self._generate_inline_email_html(gift_data)
            
            # Generate subject
            if gift_data.get("gift_type") == "chain":
                subject = f"🎁 {gift_data.get('title', 'A Multi-Step Adventure Awaits!')} - {gift_data.get('amount', '0.001')} {gift_data.get('currency', 'ETH')}"
            else:
                subject = f"🎁 You've received {gift_data.get('amount', '0.001')} {gift_data.get('currency', 'ETH')}!"
            
            # Send via configured provider
            return await self.provider.send_email(recipient_email, subject, html_content)
            
        except Exception as e:
            logger.error(f"Error sending gift notification: {str(e)}")
            return False
    
    def _generate_inline_email_html(self, gift_data: Dict[str, Any]) -> str:
        """Generate beautiful inline HTML email"""
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
                .step-info {{ background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #8b5cf6; }}
                .footer {{ background: #f8f9fa; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }}
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
                    
                    {'<div class="step-info"><h3 style="margin: 0 0 10px; color: #1f2937;">🗺️ Your Adventure Awaits!</h3><p style="margin: 0; color: #6b7280;">This gift includes ' + str(gift_data.get('total_steps', 1)) + ' exciting steps to unlock. Each step reveals new surprises!</p></div>' if gift_data.get('gift_type') == 'chain' else ''}
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{gift_data.get('claim_url')}" class="cta-button">
                            {'🎮 Start Your Adventure' if gift_data.get('gift_type') == 'chain' else '🎁 Claim Your Gift'}
                        </a>
                        <p style="margin: 10px 0 0; color: #9ca3af; font-size: 14px;">
                            Expires: {gift_data.get('expiry_date', '30 days')}
                        </p>
                    </div>
                    
                    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            <strong>🔒 Secure & Easy:</strong> This gift is protected by blockchain technology. 
                            You'll need a crypto wallet like MetaMask to claim it - we'll help you set one up!
                        </p>
                    </div>
                </div>
                
                <div class="footer">
                    <p style="margin: 0 0 10px;">
                        <strong>GeoGift</strong> - {'Multi-Step Crypto Adventures' if gift_data.get('gift_type') == 'chain' else 'Location-Verified Crypto Gifts'}
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                        Can't see the button? Copy this link: {gift_data.get('claim_url', '')}
                    </p>
                </div>
            </div>
        </body>
        </html>
        """


# Global email service instance
email_service = EmailService()