# CLAUDE.md - GeoGift Project Context

> This file serves as the central memory and context reference for AI-assisted development of the GeoGift platform.

## 🧠 Project Context & Vision

GeoGift is a **location-verified crypto gift card platform** that transforms passive money transfers into active, memorable experiences. Recipients receive clues to find specific GPS coordinates where they can unlock their crypto gifts through smart contract verification.

### Core Innovation
- **Gamified Gifting**: Replace boring money transfers with treasure hunt experiences
- **Crypto Education**: Introduce youth to digital finance through engaging mechanics  
- **Real-World Integration**: Bridge digital payments with physical world exploration
- **Smart Contract Escrow**: Trustless, automated fund release upon location verification

## 📊 Market Research Summary

### Competitive Analysis (From Extensive Research)

| Platform | Model | Pricing | Key Features |
|----------|-------|---------|--------------|
| **Paperless Post** | Premium Design | $0.12-$0.48/coin | Sophisticated templates, coin system |
| **Evite** | Freemium | Free + $12.99-$249.99 | Ad-supported, 2500 free guests |
| **Punchbowl** | Character Focus | $6.99-$12.99/month | Disney/Marvel licensing |
| **GreenEnvelope** | Eco-Premium | Credit-based | Environmental positioning |

**Market Gap Identified**: No crypto-enabled, location-verified gifting platforms exist.

### Technical Infrastructure Research

#### Blockchain Solutions Evaluated:
- **Ethereum Sepolia**: Testnet for development and testing, full EVM compatibility
- **Ethereum Mainnet**: Production deployment target
- **Polygon**: 65,000 TPS, ~$0.01 transactions (future consideration)
- **Arbitrum**: 40,000 TPS, ~$0.02 transactions (future consideration)

**Current Implementation**: Using Ethereum Sepolia testnet for development, with mainnet deployment planned for production.

#### Location Verification Insights:
- **GPS Accuracy**: 3-5 meter precision standard
- **Geocaching Validation**: Millions of successful location verifications prove concept
- **Security Concerns**: GPS spoofing apps exist, need multi-factor verification
- **Fallback Mechanisms**: Time limits, manual overrides, proximity ranges

## 🏗️ Technical Architecture

### Validated Technology Stack

#### Frontend (React/Next.js Ecosystem)
```typescript
// Primary Stack
- Next.js 14 (App Router)
- TypeScript 5.0+
- Tailwind CSS + shadcn/ui
- Mapbox GL JS / Google Maps
- wagmi + RainbowKit (Web3)
- Zustand (State Management)
- Framer Motion (Animations)

// Testing & Tools
- Vitest + Testing Library
- Playwright (E2E)
- ESLint + Prettier
```

#### Backend (Python Ecosystem)
```python
# Core Framework
- FastAPI (async Python web framework)
- Web3.py (Ethereum integration)
- SQLAlchemy + Alembic (Database ORM)
- PostgreSQL (Primary database)
- Redis (Caching + Celery broker)
- Celery (Background tasks)

# Location & Crypto
- Geopy (Location calculations)
- Folium (Map visualization)
- cryptography (Security)
- pydantic (Data validation)

# Infrastructure
- Uvicorn (ASGI server)
- Docker + docker-compose
- pytest (Testing)
```

#### Blockchain Layer
```solidity
// Smart Contracts (Solidity 0.8.20+)
- OpenZeppelin (Security patterns)
- Hardhat (Development framework)
- TypeChain (Type generation)
- Etherscan (Contract verification)

// Networks
- Ethereum Sepolia (Primary testnet)
- Ethereum Mainnet (Production)
- Future L2 expansion (Polygon, Arbitrum)
```

## 🎯 User Stories & MVP Requirements

### Primary User Flows

#### Gift Creator (Giver) Journey:
1. **Authenticate**: Connect Web3 wallet (MetaMask)
2. **Design Card**: Choose template, add personal message
3. **Set Challenge**: Drop map pin, create location clues
4. **Configure Security**: Set radius, backup methods, expiry
5. **Fund Escrow**: Deposit crypto to smart contract
6. **Send Invitation**: Digital card delivered to recipient

#### Gift Recipient Journey:
1. **Receive Invite**: Digital card with mystery clues
2. **Solve Puzzle**: Interpret hints to find location
3. **Navigate**: GPS guidance to target coordinates  
4. **Verify Location**: Automatic detection within radius
5. **Claim Reward**: Smart contract releases funds
6. **Celebrate**: Share experience, create memory

### MVP Feature Prioritization

#### Phase 1 - Core Functionality (8-10 weeks)
- [ ] Basic escrow smart contract (deposit/release)
- [ ] Simple GPS coordinate verification
- [ ] React frontend with wallet integration
- [ ] Python backend with Web3.py
- [ ] Polygon testnet deployment
- [ ] Basic card templates

#### Phase 2 - Enhanced Experience (6-8 weeks)  
- [ ] Complex multi-clue treasure hunts
- [ ] Fiat on/off-ramp integration
- [ ] Advanced location verification
- [ ] Mobile-responsive design
- [ ] Security hardening

#### Phase 3 - Scale & Growth (8-12 weeks)
- [ ] Financial institution partnerships
- [ ] Enterprise team-building features
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mainnet production launch

## 🔧 Development Environment Setup

### Required Dependencies

```bash
# Node.js/Frontend
node --version  # v18.0.0+
npm --version   # v9.0.0+

# Python/Backend  
python --version # v3.11.0+
pip --version    # v23.0.0+

# Database
psql --version   # PostgreSQL 14+
redis-server --version # Redis 7.0+

# Blockchain Development
npx hardhat --version # Latest
foundry --version     # Latest
```

### Environment Variables Template

```bash
# Database
DATABASE_URL=postgresql://geogift:password@localhost:5432/geogift_dev
REDIS_URL=redis://localhost:6379/0

# Blockchain
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-key
PRIVATE_KEY=your-wallet-private-key
ETHERSCAN_API_KEY=your-etherscan-key

# Frontend Blockchain
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-key
NEXT_PUBLIC_ENABLE_TESTNET=true
NEXT_PUBLIC_CHAIN_ID=11155111

# APIs
GOOGLE_MAPS_API_KEY=your-google-maps-key
MAPBOX_ACCESS_TOKEN=your-mapbox-token
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Security
JWT_SECRET_KEY=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

## 🤖 AI Agent Specializations

### Backend Agent - Python/Web3 Expert
- **Focus**: FastAPI, Web3.py, smart contract integration
- **Responsibilities**: API development, blockchain interactions, data models
- **Key Skills**: Async Python, cryptography, database design
- **Reference**: [Backend Agent Prompt](./prompts/backend-agent.md)

### Frontend Agent - React/UI Specialist  
- **Focus**: Next.js, Tailwind CSS, Web3 wallet integration
- **Responsibilities**: User interface, responsive design, user experience
- **Key Skills**: TypeScript, modern React patterns, accessibility
- **Reference**: [Frontend Agent Prompt](./prompts/frontend-agent.md)

### Blockchain Agent - Smart Contract Developer
- **Focus**: Solidity, security patterns, gas optimization
- **Responsibilities**: Smart contract architecture, testing, deployment
- **Key Skills**: DeFi patterns, formal verification, security audits
- **Reference**: [Blockchain Agent Prompt](./prompts/blockchain-agent.md)

### Security Agent - Audit & Best Practices
- **Focus**: Security analysis, vulnerability assessment
- **Responsibilities**: Code review, penetration testing, compliance
- **Key Skills**: Smart contract auditing, GPS spoofing prevention
- **Reference**: [Security Agent Prompt](./prompts/security-agent.md)

## 📁 File Structure & Organization

```
geogift/
├── README.md
├── claude.md (this file)
├── package.json
├── .gitignore
│
├── docs/                    # Technical documentation
│   ├── architecture.md
│   ├── smart-contracts.md
│   ├── api-design.md
│   ├── security.md
│   └── deployment.md
│
├── prompts/                 # AI agent instructions
│   ├── backend-agent.md
│   ├── frontend-agent.md
│   ├── blockchain-agent.md
│   └── security-agent.md
│
├── specs/                   # Requirements & specifications
│   ├── user-stories.md
│   ├── mvp-requirements.md
│   ├── technical-requirements.md
│   └── api-specifications.md
│
├── frontend/                # Next.js application
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── public/
│
├── backend/                 # FastAPI application
│   ├── app/
│   ├── tests/
│   ├── alembic/
│   └── requirements.txt
│
├── contracts/               # Solidity smart contracts
│   ├── src/
│   ├── test/
│   ├── script/
│   └── hardhat.config.ts
│
├── deployment/              # Infrastructure & deployment
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
│
└── .claude_project_config.json  # Claude Code configuration
```

## 💡 Key Development Insights

### Smart Contract Architecture
```solidity
// Core escrow pattern validated through research
contract LocationEscrow {
    struct Gift {
        address giver;
        address receiver;
        uint256 amount;
        int256 targetLat;
        int256 targetLon;
        uint256 radius;
        bool claimed;
        uint256 expiry;
        bytes32 clueHash;
    }
    
    mapping(uint256 => Gift) public gifts;
    uint256 public nextGiftId;
    
    function createGift(address receiver, int256 lat, int256 lon, uint256 radius) 
        external payable returns (uint256);
    
    function claimGift(uint256 giftId, int256 userLat, int256 userLon) 
        external;
    
    function emergencyWithdraw(uint256 giftId) 
        external; // After expiry
}
```

### Location Verification Algorithm
```python
# Haversine formula for GPS distance calculation
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in meters"""
    R = 6371000  # Earth's radius in meters
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def verify_location(target_lat: float, target_lon: float, user_lat: float, user_lon: float, radius: float) -> bool:
    """Verify if user is within the specified radius of target location"""
    distance = calculate_distance(target_lat, target_lon, user_lat, user_lon)
    return distance <= radius
```

## 🔐 Security Considerations

### GPS Spoofing Prevention
1. **Multi-factor Verification**: Combine GPS with device sensors
2. **Behavioral Analysis**: Detect impossible movement patterns
3. **Time Verification**: Ensure reasonable travel time between locations
4. **Device Fingerprinting**: Track unique device characteristics

### Smart Contract Security
1. **Reentrancy Guards**: OpenZeppelin's nonReentrant modifier
2. **Access Control**: Role-based permissions
3. **Emergency Stops**: Circuit breaker patterns
4. **Formal Verification**: Mathematical proof of correctness

### Data Protection
1. **Location Encryption**: Never store raw GPS coordinates
2. **Private Key Security**: Client-side only, never transmitted
3. **Rate Limiting**: Prevent brute force attacks
4. **Input Validation**: Comprehensive sanitization

## 📈 Revenue Model Strategy

### Pricing Tiers (Validated from Market Research)
- **Free Tier**: Basic cards, simple GPS, amounts <$50
- **Premium ($9.99/month)**: Custom clues, multi-location, amounts <$500
- **Enterprise (Custom)**: Team building, corporate accounts, unlimited amounts

### Transaction Fees
- **Platform Fee**: 2-3% on gift amounts
- **Blockchain Fees**: Pass-through gas costs (minimal on L2)
- **Payment Processing**: Standard rates for fiat on/off-ramps

## 🎯 Success Metrics

### Technical KPIs
- **Transaction Success Rate**: >99.5%
- **Location Verification Accuracy**: >98%
- **Average Response Time**: <200ms API calls
- **Smart Contract Gas Efficiency**: <100k gas per transaction

### Business KPIs  
- **User Acquisition**: 1000 MAU by month 6
- **Revenue Growth**: $10k ARR by month 12
- **Platform Engagement**: >80% completion rate for created gifts
- **Customer Satisfaction**: >4.5/5 rating

## 🔄 Development Workflow

### Git Strategy
- **Main Branch**: Production-ready code
- **Develop Branch**: Integration branch for features
- **Feature Branches**: Individual feature development
- **Release Branches**: Prepare for production releases

### CI/CD Pipeline
1. **Code Push**: Trigger automated tests
2. **Smart Contract Tests**: Foundry + Hardhat test suites
3. **Backend Tests**: pytest with coverage reports
4. **Frontend Tests**: Vitest + Playwright E2E
5. **Security Scans**: Slither, MythX for contracts
6. **Deployment**: Automated to staging, manual to production

## 📚 Reference Documentation

### Primary Documentation Files
- **[Architecture](./docs/architecture.md)**: Detailed system design and data flow
- **[Smart Contracts](./docs/smart-contracts.md)**: Blockchain implementation details
- **[API Design](./docs/api-design.md)**: Backend API specifications and examples
- **[Security](./docs/security.md)**: Comprehensive security measures and best practices

### AI Agent Prompts
- **[Backend Agent](./.claude/prompts/backend-agent.md)**: Python/FastAPI/Web3 specialist instructions
- **[Frontend Agent](./.claude/prompts/frontend-agent.md)**: React/Next.js/Tailwind expert guidance
- **[Blockchain Agent](./.claude/prompts/blockchain-agent.md)**: Solidity/DeFi development focus
- **[Security Agent](./.claude/prompts/security-agent.md)**: Security audit and vulnerability assessment

### Specifications & Requirements
- **[User Stories](./specs/user-stories.md)**: Detailed user journey specifications
- **[MVP Requirements](./specs/mvp-requirements.md)**: Phase 1 deliverable requirements
- **[Technical Requirements](./specs/technical-requirements.md)**: Infrastructure and performance specs

## 🚀 Development Progress & Next Steps

### ✅ Completed (Phase 1, Week 1)
1. **✅ Set up development environment** - Python venv, Node.js, Git repository
2. **✅ Initialize repository structure** - Complete folder organization per CLAUDE.md specs
3. **✅ Create comprehensive smart contract** - LocationEscrow.sol (407 lines) with full escrow functionality
4. **✅ Set up FastAPI backend** - Complete API structure with Web3.py, auth, gifts, location endpoints
5. **✅ Configure blockchain development** - Hardhat environment with 18 passing tests, TypeChain types

### ✅ Completed (Phase 1, Week 1) - ALL AGENTS
**Complete foundation infrastructure established across all layers:**
6. **✅ Initialize Next.js frontend** - Complete Next.js 14 app with 8 pages, Web3 integration, responsive design

### ✅ Completed (Phase 1, Week 2) - Backend Agent Lead
**Database Infrastructure & Authentication:**
7. **✅ Database Models & CRUD** - Complete User/Gift models, Alembic migrations, PostgreSQL integration
8. **✅ Docker Environment** - PostgreSQL container configured and running
9. **✅ Web3 Authentication System** - EIP-191 compliant signature verification with JWT tokens
10. **✅ API Integration** - Complete authentication endpoints with database layer integration

### ✅ Current Status: COMPLETE END-TO-END SUCCESS! 🎉
**Full UI-to-blockchain gift creation and claiming system working on Sepolia testnet**

### ✅ Completed (Phase 1, Week 2 - Final)
**Critical Issue Resolution & Wallet Integration:**
11. **✅ Fixed 3GB Memory Usage Issue** - Invalid WalletConnect project ID causing endless 403 API requests
12. **✅ Implemented Stable Service Management** - start-dev.sh script using separate Terminal windows
13. **✅ Successfully Connected MetaMask Wallet** - Web3 authentication working with address: 0x2fa710b2a99cdd9e314080b78b0f7bf78c126234
14. **✅ Migrated to Sepolia Testnet** - Complete network migration from Polygon to Ethereum Sepolia
15. **✅ Fixed Frontend Crash Issues** - Restored Web3 providers and resolved WagmiProviderNotFoundError

### ✅ Completed (Phase 1, Week 2 - BREAKTHROUGH!)
**Complete UI-to-Blockchain Integration:**
16. **✅ Smart Contract Integration** - Frontend forms create real blockchain transactions
17. **✅ Live Testing Success** - Gift created via UI: tx `0x7d07dab7d75889a5a42b04fa77bd2fb7e766bf9e32331ae3588da93e05a9534f`
18. **✅ End-to-End Gift Claiming** - Recipient successfully claimed: tx `0xc2fbd4e7fa7a84351edfa143b89ca414dc54e598ab20911ce40bf060407e207d`
19. **✅ Real Crypto Transfer** - 0.001 ETH transferred via location verification on Sepolia testnet
20. **✅ GPS Location Integration** - Added "Use My Current Location" browser geolocation API

### ⏳ Next Development Phase (Week 3 - Smart Contract Deployment & Testing)
1. **Deploy smart contracts to Sepolia testnet** - LocationEscrow.sol deployment
2. **Complete location verification integration** - GPS services and API testing
3. **Implement gift creation flow** - Frontend to backend to smart contract
4. **Test end-to-end gift claiming** - Location verification and crypto release
5. **Add real WalletConnect project ID** - Clean up console warnings

### Medium-term Objectives (1-3 months)
1. **Complete MVP feature set** with all core functionality
2. **Conduct security audits** of smart contracts and backend
3. **Implement fiat on/off-ramps** for mainstream adoption
4. **Launch beta testing program** with early adopters
5. **Prepare for mainnet deployment** with production infrastructure

## 📊 Current Implementation Status

### 🔧 Development Environment ✅ **COMPLETED**
- **Start Scripts**: `start.sh` and `start-dev.sh` for easy service management
- **PostgreSQL**: Docker container running on port 5432 with proper credentials
- **Environment Variables**: Configured for Ethereum Sepolia testnet development
- **Network Migration**: Successfully migrated from Polygon to Ethereum Sepolia
- **Python Virtual Environment**: `venv` with all backend dependencies installed
- **Node.js Dependencies**: Frontend and contracts dependencies installed

### Blockchain Layer ✅ **COMPLETED**
- **LocationEscrow.sol**: Full implementation with location verification, emergency withdrawal, admin functions
- **Test Suite**: 18 comprehensive tests covering all contract functionality
- **TypeChain Integration**: Full TypeScript support for contract interactions
- **Network Support**: Configured for Ethereum Sepolia testnet and mainnet deployments
- **Security Patterns**: OpenZeppelin ReentrancyGuard, Pausable, AccessControl

### Backend Layer ✅ **CORE COMPLETED + DATABASE + AUTHENTICATION**
- **FastAPI Application**: Async structure with lifespan management
- **API Endpoints**: Complete Auth (Web3 wallet), Gifts (CRUD), Location (verification), Health monitoring
- **Database Models**: Complete User and Gift SQLAlchemy models with relationships
- **Web3 Authentication**: EIP-191 compliant signature verification with challenge-response flow
- **Security Features**: Rate limiting, JWT tokens, Redis nonce management, comprehensive validation
- **Database Integration**: SQLAlchemy with async PostgreSQL + Alembic migrations
- **CRUD Operations**: Comprehensive CRUD for Users and Gifts with specialized queries
- **Docker Environment**: PostgreSQL 14 container configured and running
- **Security Middleware**: CORS, trusted hosts, structured logging
- **Web3 Integration**: Configured for smart contract interaction

### 🔐 Web3 Authentication Implementation ✅ **COMPLETED**

#### **Challenge-Response Authentication Flow**
- **Challenge Generation**: Cryptographically secure nonce with SHA256 hashing + timestamp
- **Message Signing**: EIP-191 compliant message encoding with `encode_defunct()`
- **Signature Verification**: eth-account recovery with address validation
- **JWT Integration**: Seamless token generation with existing security infrastructure

#### **Security Architecture**
```python
# Authentication Flow
1. POST /auth/challenge → Generate unique nonce (5min expiry)
2. Client signs message with MetaMask
3. POST /auth/verify → Verify signature + issue JWT
4. GET /auth/me → Protected endpoints with Bearer token
```

#### **Security Features**
- **Rate Limiting**: Max 5 challenges/minute per wallet (Redis-based)
- **Nonce Management**: Redis storage with automatic expiration
- **Address Validation**: Checksum validation and normalization  
- **Replay Protection**: Time-limited nonces prevent replay attacks
- **Comprehensive Logging**: Structured security event logging
- **Error Handling**: Security-conscious error messages

#### **API Endpoints**
- `POST /auth/challenge` - Generate authentication challenge
- `POST /auth/verify` - Verify signature and authenticate
- `GET /auth/me` - Get current user info (JWT protected)
- `GET /auth/wallet/{address}/info` - Validate wallet address
- `POST /auth/logout` - User logout with audit logging

#### **Database Integration**
- **User Auto-Creation**: First-time authentication creates user record
- **Wallet Linking**: Users identified by wallet address (unique)
- **Session Management**: JWT tokens with configurable expiration
- **CRUD Operations**: Full user management with wallet-based queries

### Frontend Layer ✅ **COMPLETED - Wallet Integration Working**
- **Next.js 14**: Full application with App Router, TypeScript, and 8 complete pages ✅
- **UI Framework**: Tailwind CSS + shadcn/ui with custom GeoGift theme and dark mode ✅
- **Web3 Integration**: wagmi + RainbowKit configured for Ethereum Sepolia connectivity ✅
- **Component Architecture**: Modern React patterns with hooks, Suspense, and error boundaries ✅
- **Forms & Validation**: React Hook Form + Zod with multi-step wizard flows ✅
- **Location Services**: GPS integration with geolocation API and distance calculation ✅
- **State Management**: Zustand setup with global state architecture ✅
- **Testing Framework**: Vitest + Playwright configured for unit and E2E testing ✅
- **✅ MetaMask Integration**: Wallet connection working, Web3 providers restored, memory issues resolved
- **Environment Config**: Sepolia testnet configured with temporary WalletConnect project ID

### 🔧 Technical Issues Resolved
#### **Memory Leak & Performance Issues**
- **Problem**: 3GB memory usage causing browser crashes and endless API requests
- **Root Cause**: Invalid WalletConnect project ID triggering 403 errors in continuous loop
- **Solution**: Implemented proper fallback project ID in providers.tsx
- **Result**: Normal memory usage, stable browser performance

#### **Service Management Issues**
- **Problem**: Backend and frontend services shutting down unexpectedly
- **Root Cause**: Terminal session timeouts and process management issues
- **Solution**: Created start-dev.sh script with separate Terminal windows
- **Result**: Stable service operation with proper process isolation

#### **Web3 Provider Issues**
- **Problem**: WagmiProviderNotFoundError causing frontend crashes
- **Root Cause**: Web3 providers were previously removed, breaking Wagmi hooks
- **Solution**: Restored complete provider configuration with proper chain setup
- **Result**: MetaMask wallet connection working successfully

---

**This document serves as the central memory for all AI agents working on the GeoGift project. Refer to this file for context, architecture decisions, and development priorities.**