"""
Authentication endpoints for Web3 wallet connection and JWT tokens.

This module provides complete Web3 authentication using cryptographic signatures:
- Challenge generation with secure nonces
- EIP-191 compliant signature verification  
- JWT token management
- User creation and management
"""

# Re-export the complete auth router implementation
from app.api.routes.auth import router