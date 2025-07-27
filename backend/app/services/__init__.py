"""
Services package for GeoGift backend.

Contains business logic services that handle complex operations:
- Web3 authentication with signature verification
- Location verification and GPS calculations
- Gift management and blockchain interactions
- External API integrations
"""

from .web3_auth import web3_auth_service

__all__ = ["web3_auth_service"]