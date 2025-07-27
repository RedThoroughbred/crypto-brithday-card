# GeoGift System Architecture

> Comprehensive technical architecture for the location-verified crypto gift card platform.

## 🏗️ High-Level Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web App - Next.js]
        B[Mobile PWA]
        C[MetaMask Wallet]
    end
    
    subgraph "API Gateway"
        D[Load Balancer]
        E[Rate Limiting]
        F[Authentication]
    end
    
    subgraph "Backend Services"
        G[FastAPI Server]
        H[Location Service]
        I[Notification Service]
        J[Payment Service]
    end
    
    subgraph "Data Layer"
        K[PostgreSQL]
        L[Redis Cache]
        M[File Storage]
    end
    
    subgraph "Blockchain Layer"
        N[Polygon Network]
        O[Arbitrum Network]
        P[Smart Contracts]
        Q[IPFS Storage]
    end
    
    subgraph "External APIs"
        R[Google Maps]
        S[Mapbox]
        T[Twilio SMS]
        U[Email Service]
    end
    
    A --> D
    B --> D
    C --> N
    D --> G
    G --> H
    G --> I
    G --> J
    G --> K
    G --> L
    H --> R
    H --> S
    I --> T
    I --> U
    J --> N
    J --> O
    P --> N
    P --> O
    K --> M
    N --> Q
```

## 🌐 Frontend Architecture

### Next.js 14 Application Structure

```
frontend/
├── app/                     # App Router (Next.js 14)
│   ├── (auth)/             # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── create/         # Gift creation
│   │   ├── gifts/          # Gift management
│   │   └── profile/        # User profile
│   ├── claim/[id]/         # Public gift claiming
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/             # Reusable UI components
│   ├── ui/                 # shadcn/ui components
│   ├── maps/               # Map-related components
│   ├── wallet/             # Web3 wallet components
│   └── forms/              # Form components
├── lib/                    # Utility libraries
│   ├── utils.ts            # General utilities
│   ├── web3.ts             # Web3 configuration
│   ├── api.ts              # API client
│   └── validation.ts       # Form validation schemas
├── hooks/                  # Custom React hooks
│   ├── useWallet.ts        # Wallet connection
│   ├── useLocation.ts      # Geolocation handling
│   └── useGift.ts          # Gift management
├── stores/                 # Zustand state management
│   ├── wallet.ts           # Wallet state
│   ├── user.ts             # User state
│   └── gifts.ts            # Gift state
└── types/                  # TypeScript type definitions
    ├── api.ts
    ├── web3.ts
    └── gift.ts
```

### Key Frontend Technologies

```typescript
// Core Framework & Styling
import { NextRequest, NextResponse } from 'next/server'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Web3 Integration
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

// Map Integration
import mapboxgl from 'mapbox-gl'
import { Map, Marker, NavigationControl } from 'react-map-gl'

// State Management
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Forms & Validation
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Animations
import { motion, AnimatePresence } from 'framer-motion'
```

### Component Architecture Patterns

```typescript
// Component Composition Pattern
export function GiftCreationWizard() {
  return (
    <WizardProvider>
      <WizardSteps>
        <StepOne>
          <CardDesignSelector />
          <MessageEditor />
        </StepOne>
        <StepTwo>
          <LocationPicker />
          <ClueEditor />
        </StepTwo>
        <StepThree>
          <PaymentSetup />
          <SecuritySettings />
        </StepThree>
      </WizardSteps>
    </WizardProvider>
  )
}

// Custom Hook Pattern
export function useGiftCreation() {
  const [step, setStep] = useState(0)
  const [giftData, setGiftData] = useState<GiftData>()
  
  const createGift = async (data: GiftData) => {
    // Smart contract interaction
    const contract = useContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: EscrowABI,
    })
    
    return await contract.write.createGift({
      args: [data.recipient, data.amount, data.location],
      value: data.amount,
    })
  }
  
  return { step, setStep, giftData, setGiftData, createGift }
}
```

## 🐍 Backend Architecture

### FastAPI Application Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py             # FastAPI application entry point
│   ├── config.py           # Configuration management
│   ├── dependencies.py     # Dependency injection
│   ├── api/                # API route handlers
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py     # Authentication endpoints
│   │   │   ├── gifts.py    # Gift management endpoints
│   │   │   ├── location.py # Location verification endpoints
│   │   │   ├── payments.py # Payment processing endpoints
│   │   │   └── users.py    # User management endpoints
│   ├── core/               # Core business logic
│   │   ├── __init__.py
│   │   ├── security.py     # Security utilities
│   │   ├── location.py     # Location verification logic
│   │   ├── blockchain.py   # Web3 integration
│   │   └── notifications.py # Notification services
│   ├── models/             # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── gift.py
│   │   ├── location.py
│   │   └── transaction.py
│   ├── schemas/            # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── gift.py
│   │   └── location.py
│   ├── services/           # Business logic services
│   │   ├── __init__.py
│   │   ├── gift_service.py
│   │   ├── location_service.py
│   │   ├── payment_service.py
│   │   └── notification_service.py
│   └── utils/              # Utility functions
│       ├── __init__.py
│       ├── crypto.py       # Cryptographic utilities
│       ├── geocoding.py    # Location utilities
│       └── validation.py   # Validation helpers
├── tests/                  # Test suite
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_api/
│   ├── test_core/
│   └── test_services/
├── alembic/                # Database migrations
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container configuration
└── docker-compose.yml     # Development environment
```

### Core Backend Services

```python
# Location Verification Service
from geopy.distance import geodesic
from typing import Tuple, Optional
import math

class LocationService:
    def __init__(self):
        self.verification_radius = 50  # meters
        self.max_speed_kmh = 120  # Maximum reasonable travel speed
    
    async def verify_location(
        self,
        target_coords: Tuple[float, float],
        user_coords: Tuple[float, float],
        radius: float = None
    ) -> bool:
        """Verify if user is within target location radius"""
        radius = radius or self.verification_radius
        distance = geodesic(target_coords, user_coords).meters
        return distance <= radius
    
    async def anti_spoofing_check(
        self,
        user_id: str,
        new_coords: Tuple[float, float],
        timestamp: int
    ) -> bool:
        """Check for GPS spoofing by analyzing movement patterns"""
        last_location = await self.get_last_location(user_id)
        
        if not last_location:
            return True
        
        # Calculate distance and time elapsed
        distance_km = geodesic(last_location.coords, new_coords).kilometers
        time_elapsed_hours = (timestamp - last_location.timestamp) / 3600
        
        # Check if movement speed is reasonable
        if time_elapsed_hours > 0:
            speed_kmh = distance_km / time_elapsed_hours
            return speed_kmh <= self.max_speed_kmh
        
        return True

# Web3 Integration Service
from web3 import Web3
from eth_account import Account
import json

class BlockchainService:
    def __init__(self, network_config: dict):
        self.w3 = Web3(Web3.HTTPProvider(network_config['rpc_url']))
        self.contract_address = network_config['contract_address']
        self.contract_abi = self._load_abi()
        self.contract = self.w3.eth.contract(
            address=self.contract_address,
            abi=self.contract_abi
        )
    
    async def create_gift(
        self,
        giver_address: str,
        recipient_address: str,
        amount: int,
        location: Tuple[float, float],
        clue_hash: str
    ) -> str:
        """Create a new gift escrow on blockchain"""
        # Convert coordinates to integers (multiply by 1e6 for precision)
        lat_int = int(location[0] * 1000000)
        lon_int = int(location[1] * 1000000)
        
        transaction = self.contract.functions.createGift(
            recipient_address,
            lat_int,
            lon_int,
            clue_hash
        ).build_transaction({
            'from': giver_address,
            'value': amount,
            'gas': 200000,
            'gasPrice': self.w3.to_wei('20', 'gwei'),
            'nonce': self.w3.eth.get_transaction_count(giver_address)
        })
        
        return transaction
    
    async def claim_gift(
        self,
        gift_id: int,
        recipient_address: str,
        user_location: Tuple[float, float]
    ) -> str:
        """Claim a gift by verifying location"""
        lat_int = int(user_location[0] * 1000000)
        lon_int = int(user_location[1] * 1000000)
        
        transaction = self.contract.functions.claimGift(
            gift_id,
            lat_int,
            lon_int
        ).build_transaction({
            'from': recipient_address,
            'gas': 150000,
            'gasPrice': self.w3.to_wei('20', 'gwei'),
            'nonce': self.w3.eth.get_transaction_count(recipient_address)
        })
        
        return transaction
```

### API Route Examples

```python
# FastAPI Route Handlers
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.schemas.gift import GiftCreate, GiftResponse
from app.services.gift_service import GiftService

router = APIRouter(prefix="/api/v1/gifts", tags=["gifts"])

@router.post("/", response_model=GiftResponse)
async def create_gift(
    gift_data: GiftCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new location-verified gift"""
    gift_service = GiftService(db)
    
    try:
        gift = await gift_service.create_gift(
            giver_id=current_user.id,
            **gift_data.dict()
        )
        return gift
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{gift_id}/claim")
async def claim_gift(
    gift_id: int,
    location_data: LocationVerification,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Claim a gift by verifying location"""
    gift_service = GiftService(db)
    location_service = LocationService()
    
    # Verify location
    is_valid = await location_service.verify_location(
        target_coords=(gift_data.latitude, gift_data.longitude),
        user_coords=(location_data.latitude, location_data.longitude),
        radius=gift_data.verification_radius
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location verification failed"
        )
    
    # Process blockchain transaction
    result = await gift_service.claim_gift(gift_id, current_user.id)
    return {"success": True, "transaction_hash": result.tx_hash}
```

## ⛓️ Blockchain Architecture

### Smart Contract Architecture

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract LocationEscrow is ReentrancyGuard, Ownable, Pausable {
    struct Gift {
        address payable giver;
        address payable recipient;
        uint256 amount;
        int256 targetLatitude;   // Multiplied by 1e6 for precision
        int256 targetLongitude;  // Multiplied by 1e6 for precision
        uint256 verificationRadius; // In meters
        bytes32 clueHash;        // Hash of clues for verification
        uint256 expiryTime;      // Timestamp when gift expires
        bool claimed;            // Whether gift has been claimed
        bool exists;             // Whether gift exists
    }
    
    mapping(uint256 => Gift) public gifts;
    mapping(address => uint256[]) public userGifts;
    mapping(address => uint256[]) public recipientGifts;
    
    uint256 public nextGiftId = 1;
    uint256 public platformFee = 250; // 2.5% in basis points
    address payable public feeRecipient;
    
    // Events
    event GiftCreated(
        uint256 indexed giftId,
        address indexed giver,
        address indexed recipient,
        uint256 amount
    );
    
    event GiftClaimed(
        uint256 indexed giftId,
        address indexed recipient,
        uint256 amount
    );
    
    event GiftExpired(
        uint256 indexed giftId,
        address indexed giver,
        uint256 amount
    );
    
    constructor(address payable _feeRecipient) {
        feeRecipient = _feeRecipient;
    }
    
    function createGift(
        address payable _recipient,
        int256 _latitude,
        int256 _longitude,
        uint256 _radius,
        bytes32 _clueHash,
        uint256 _expiryTime
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(msg.value > 0, "Gift amount must be greater than 0");
        require(_recipient != address(0), "Invalid recipient address");
        require(_recipient != msg.sender, "Cannot send gift to yourself");
        require(_expiryTime > block.timestamp, "Expiry time must be in future");
        require(_radius > 0 && _radius <= 1000, "Radius must be 1-1000 meters");
        
        uint256 giftId = nextGiftId++;
        
        gifts[giftId] = Gift({
            giver: payable(msg.sender),
            recipient: _recipient,
            amount: msg.value,
            targetLatitude: _latitude,
            targetLongitude: _longitude,
            verificationRadius: _radius,
            clueHash: _clueHash,
            expiryTime: _expiryTime,
            claimed: false,
            exists: true
        });
        
        userGifts[msg.sender].push(giftId);
        recipientGifts[_recipient].push(giftId);
        
        emit GiftCreated(giftId, msg.sender, _recipient, msg.value);
        
        return giftId;
    }
    
    function claimGift(
        uint256 _giftId,
        int256 _userLatitude,
        int256 _userLongitude
    ) external whenNotPaused nonReentrant {
        Gift storage gift = gifts[_giftId];
        
        require(gift.exists, "Gift does not exist");
        require(!gift.claimed, "Gift already claimed");
        require(gift.recipient == msg.sender, "Only recipient can claim");
        require(block.timestamp <= gift.expiryTime, "Gift has expired");
        
        // Verify location using Haversine formula
        bool locationValid = _verifyLocation(
            gift.targetLatitude,
            gift.targetLongitude,
            _userLatitude,
            _userLongitude,
            gift.verificationRadius
        );
        
        require(locationValid, "Location verification failed");
        
        gift.claimed = true;
        
        // Calculate platform fee
        uint256 fee = (gift.amount * platformFee) / 10000;
        uint256 recipientAmount = gift.amount - fee;
        
        // Transfer funds
        if (fee > 0) {
            feeRecipient.transfer(fee);
        }
        gift.recipient.transfer(recipientAmount);
        
        emit GiftClaimed(_giftId, gift.recipient, recipientAmount);
    }
    
    function emergencyWithdraw(uint256 _giftId) external nonReentrant {
        Gift storage gift = gifts[_giftId];
        
        require(gift.exists, "Gift does not exist");
        require(!gift.claimed, "Gift already claimed");
        require(gift.giver == msg.sender, "Only giver can withdraw");
        require(block.timestamp > gift.expiryTime, "Gift not yet expired");
        
        gift.claimed = true; // Prevent re-entry
        
        uint256 amount = gift.amount;
        gift.giver.transfer(amount);
        
        emit GiftExpired(_giftId, gift.giver, amount);
    }
    
    function _verifyLocation(
        int256 targetLat,
        int256 targetLon,
        int256 userLat,
        int256 userLon,
        uint256 radiusMeters
    ) internal pure returns (bool) {
        // Simplified distance calculation
        // In production, use more accurate Haversine formula
        int256 latDiff = targetLat - userLat;
        int256 lonDiff = targetLon - userLon;
        
        // Convert to approximate meters (very rough approximation)
        // 1 degree ≈ 111,000 meters at equator
        int256 latDiffMeters = (latDiff * 111000) / 1000000;
        int256 lonDiffMeters = (lonDiff * 111000) / 1000000;
        
        uint256 distanceSquared = uint256(
            latDiffMeters * latDiffMeters + lonDiffMeters * lonDiffMeters
        );
        uint256 radiusSquared = radiusMeters * radiusMeters;
        
        return distanceSquared <= radiusSquared;
    }
    
    // Admin functions
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%");
        platformFee = _newFee;
    }
    
    function updateFeeRecipient(address payable _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid address");
        feeRecipient = _newRecipient;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // View functions
    function getGift(uint256 _giftId) external view returns (Gift memory) {
        require(gifts[_giftId].exists, "Gift does not exist");
        return gifts[_giftId];
    }
    
    function getUserGifts(address _user) external view returns (uint256[] memory) {
        return userGifts[_user];
    }
    
    function getRecipientGifts(address _recipient) external view returns (uint256[] memory) {
        return recipientGifts[_recipient];
    }
}
```

### Deployment Configuration

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 30000000000, // 30 gwei
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 30000000000,
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

export default config;
```

## 💾 Data Architecture

### Database Schema Design

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Gifts table
CREATE TABLE gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giver_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID REFERENCES users(id),
    recipient_address VARCHAR(42),
    blockchain_gift_id INTEGER NOT NULL,
    network VARCHAR(20) NOT NULL DEFAULT 'polygon',
    
    -- Gift details
    title VARCHAR(200) NOT NULL,
    message TEXT,
    amount_wei NUMERIC(78, 0) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETH',
    
    -- Location data (encrypted)
    target_location_encrypted BYTEA NOT NULL,
    verification_radius INTEGER DEFAULT 50,
    location_hints JSONB,
    
    -- Clues and puzzles
    clues JSONB NOT NULL,
    clue_hash VARCHAR(66) NOT NULL,
    difficulty_level INTEGER DEFAULT 1,
    
    -- Status and timing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'claimed', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Blockchain data
    creation_tx_hash VARCHAR(66),
    claim_tx_hash VARCHAR(66),
    gas_used BIGINT,
    
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Gift attempts table (for tracking claim attempts)
CREATE TABLE gift_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES gifts(id),
    user_id UUID REFERENCES users(id),
    attempt_wallet_address VARCHAR(42) NOT NULL,
    
    -- Location attempt data
    submitted_location POINT NOT NULL,
    distance_from_target DECIMAL(10, 2),
    was_successful BOOLEAN DEFAULT FALSE,
    
    -- Attempt metadata
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Anti-fraud data
    is_suspicious BOOLEAN DEFAULT FALSE,
    fraud_score DECIMAL(3, 2),
    fraud_reasons JSONB
);

-- Location history for anti-spoofing
CREATE TABLE location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    location POINT NOT NULL,
    accuracy_meters DECIMAL(6, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(20) DEFAULT 'gps',
    device_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE
);

-- Transactions table for financial tracking
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES gifts(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'claim', 'refund', 'fee')),
    
    -- Blockchain data
    tx_hash VARCHAR(66) NOT NULL,
    block_number BIGINT,
    network VARCHAR(20) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount_wei NUMERIC(78, 0) NOT NULL,
    gas_used BIGINT,
    gas_price_wei NUMERIC(78, 0),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    confirmations INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_gifts_giver_id ON gifts(giver_id);
CREATE INDEX idx_gifts_recipient_id ON gifts(recipient_id);
CREATE INDEX idx_gifts_status ON gifts(status);
CREATE INDEX idx_gifts_expires_at ON gifts(expires_at);
CREATE INDEX idx_gift_attempts_gift_id ON gift_attempts(gift_id);
CREATE INDEX idx_location_history_user_id ON location_history(user_id);
CREATE INDEX idx_location_history_timestamp ON location_history(timestamp);
CREATE INDEX idx_transactions_gift_id ON transactions(gift_id);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
```

### Caching Strategy (Redis)

```python
# Redis caching patterns
import redis
import json
from typing import Optional, Dict, Any

class CacheService:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.default_ttl = 3600  # 1 hour
    
    async def cache_gift_data(self, gift_id: str, data: Dict[Any, Any], ttl: int = None):
        """Cache gift data with expiration"""
        cache_key = f"gift:{gift_id}"
        ttl = ttl or self.default_ttl
        
        serialized_data = json.dumps(data, default=str)
        await self.redis.setex(cache_key, ttl, serialized_data)
    
    async def get_cached_gift(self, gift_id: str) -> Optional[Dict[Any, Any]]:
        """Retrieve cached gift data"""
        cache_key = f"gift:{gift_id}"
        cached_data = await self.redis.get(cache_key)
        
        if cached_data:
            return json.loads(cached_data)
        return None
    
    async def cache_user_location(self, user_id: str, location: tuple, ttl: int = 300):
        """Cache user's last known location (5 minute TTL)"""
        cache_key = f"location:{user_id}"
        location_data = {
            "latitude": location[0],
            "longitude": location[1],
            "timestamp": time.time()
        }
        
        await self.redis.setex(cache_key, ttl, json.dumps(location_data))
    
    async def rate_limit_check(self, user_id: str, action: str, limit: int = 10, window: int = 60) -> bool:
        """Rate limiting for sensitive actions"""
        cache_key = f"rate_limit:{action}:{user_id}"
        current_count = await self.redis.get(cache_key)
        
        if current_count is None:
            await self.redis.setex(cache_key, window, 1)
            return True
        elif int(current_count) < limit:
            await self.redis.incr(cache_key)
            return True
        else:
            return False
```

## 🔒 Security Architecture

### Authentication & Authorization

```python
# JWT-based authentication with Web3 signature verification
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer
from web3 import Web3
import jwt
from datetime import datetime, timedelta

class Web3AuthService:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.algorithm = "HS256"
        self.bearer_scheme = HTTPBearer()
    
    def verify_signature(self, message: str, signature: str, address: str) -> bool:
        """Verify Web3 signature for authentication"""
        try:
            # Recover address from signature
            message_hash = Web3.solidity_keccak(['string'], [message])
            recovered_address = Web3().eth.account.recover_message(
                message_hash, signature=signature
            )
            return recovered_address.lower() == address.lower()
        except Exception:
            return False
    
    def create_access_token(self, user_data: dict, expires_delta: timedelta = None):
        """Create JWT access token"""
        to_encode = user_data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=24)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str):
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

# Dependency for protected routes
async def get_current_user(token: str = Depends(HTTPBearer())):
    auth_service = Web3AuthService(settings.SECRET_KEY)
    payload = auth_service.verify_token(token.credentials)
    
    # Get user from database
    user = await UserService.get_by_wallet_address(payload.get("wallet_address"))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user
```

### Data Encryption

```python
# Encryption service for sensitive location data
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os

class EncryptionService:
    def __init__(self, password: str):
        self.password = password.encode()
        self.salt = os.urandom(16)
        self.key = self._derive_key()
        self.cipher_suite = Fernet(self.key)
    
    def _derive_key(self) -> bytes:
        """Derive encryption key from password"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.password))
        return key
    
    def encrypt_location(self, latitude: float, longitude: float) -> bytes:
        """Encrypt GPS coordinates"""
        location_data = f"{latitude},{longitude}"
        encrypted_data = self.cipher_suite.encrypt(location_data.encode())
        return self.salt + encrypted_data
    
    def decrypt_location(self, encrypted_data: bytes) -> tuple:
        """Decrypt GPS coordinates"""
        salt = encrypted_data[:16]
        encrypted_location = encrypted_data[16:]
        
        # Re-derive key with original salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.password))
        cipher_suite = Fernet(key)
        
        decrypted_data = cipher_suite.decrypt(encrypted_location)
        latitude, longitude = decrypted_data.decode().split(',')
        return float(latitude), float(longitude)
```

## 📊 Monitoring & Analytics

### Application Monitoring

```python
# Comprehensive monitoring setup
import logging
import time
from functools import wraps
from prometheus_client import Counter, Histogram, Gauge
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

# Metrics
gift_creation_counter = Counter('gifts_created_total', 'Total gifts created')
gift_claim_counter = Counter('gifts_claimed_total', 'Total gifts claimed')
location_verification_duration = Histogram('location_verification_seconds', 'Time spent verifying location')
active_gifts_gauge = Gauge('active_gifts_total', 'Number of active gifts')

def monitor_performance(func_name: str):
    """Decorator to monitor function performance"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                
                # Log successful execution
                logging.info(f"{func_name} completed in {duration:.2f}s")
                
                # Update metrics based on function
                if func_name == "create_gift":
                    gift_creation_counter.inc()
                elif func_name == "claim_gift":
                    gift_claim_counter.inc()
                elif func_name == "verify_location":
                    location_verification_duration.observe(duration)
                
                return result
            except Exception as e:
                # Log errors with context
                logging.error(f"{func_name} failed: {str(e)}", exc_info=True)
                sentry_sdk.capture_exception(e)
                raise
        return wrapper
    return decorator

# Usage example
@monitor_performance("create_gift")
async def create_gift_service(gift_data: GiftCreate):
    # Gift creation logic
    pass
```

## 🚀 Deployment Architecture

### Infrastructure Overview

```yaml
# docker-compose.yml for development
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
      - NEXT_PUBLIC_MAPBOX_TOKEN=${MAPBOX_TOKEN}
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/geogift
      - REDIS_URL=redis://redis:6379/0
      - POLYGON_RPC_URL=${POLYGON_RPC_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=geogift
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

### Production Deployment (Kubernetes)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: geogift-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: geogift-backend
  template:
    metadata:
      labels:
        app: geogift-backend
    spec:
      containers:
      - name: backend
        image: geogift/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: geogift-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: geogift-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

This comprehensive architecture document provides the foundation for building a secure, scalable, and maintainable location-verified crypto gift platform. The modular design allows for independent development and deployment of different components while maintaining strong integration points.

---

**Next: See [Smart Contracts Documentation](./smart-contracts.md) for detailed blockchain implementation.**