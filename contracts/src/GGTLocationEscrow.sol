// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Simplified ERC20 interface - no external dependencies
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title GGTLocationEscrow
 * @dev Location-verified escrow contract specifically for GGT tokens
 * Recipients must be within a specified GPS radius to claim their gifts
 */
contract GGTLocationEscrow {
    // Simple reentrancy guard
    uint256 private _status = 1;
    modifier nonReentrant() {
        require(_status == 1, "ReentrancyGuard: reentrant call");
        _status = 2;
        _;
        _status = 1;
    }
    
    // Simple ownership
    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // Simple pause functionality
    bool public paused = false;
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // GGT Token contract
    IERC20 public immutable ggtToken;
    
    // Gift structure
    struct Gift {
        address payable giver;        // Who created the gift
        address payable recipient;    // Who can claim the gift
        uint256 amount;              // Amount of GGT tokens
        int256 latitude;             // Target latitude (scaled by 1e6)
        int256 longitude;            // Target longitude (scaled by 1e6)
        uint256 radius;              // Acceptable radius in meters
        bytes32 clueHash;            // Hash of the clue
        uint256 expiryTime;          // When the gift expires
        bytes32 metadata;            // Additional metadata hash
        bool claimed;                // Whether the gift has been claimed
        bool exists;                 // Whether the gift exists
        uint256 claimAttempts;       // Number of claim attempts
        uint256 createdAt;           // Timestamp when created
    }

    // State variables
    mapping(uint256 => Gift) public gifts;
    uint256 public nextGiftId = 1;
    uint256 public totalGiftsCreated;
    uint256 public totalGiftsClaimed;
    uint256 public totalValueLocked;

    // Events
    event GiftCreated(
        uint256 indexed giftId,
        address indexed giver,
        address indexed recipient,
        uint256 amount,
        uint256 expiryTime
    );

    event GiftClaimed(
        uint256 indexed giftId,
        address indexed claimer,
        uint256 amount
    );

    event GiftExpired(
        uint256 indexed giftId,
        address indexed giver,
        uint256 amount
    );

    event EmergencyWithdrawal(
        uint256 indexed giftId,
        address indexed giver,
        uint256 amount
    );

    // Errors
    error GiftNotFound();
    error GiftAlreadyClaimed();
    error GiftHasExpired();
    error NotGiftRecipient();
    error LocationTooFarAway();
    error InsufficientAllowance();
    error TransferFailed();
    error GiftNotExpired();
    error NotGiftGiver();

    /**
     * @dev Constructor sets the GGT token address
     * @param _ggtToken Address of the GGT token contract
     */
    constructor(address _ggtToken) {
        require(_ggtToken != address(0), "Invalid token address");
        ggtToken = IERC20(_ggtToken);
        owner = msg.sender;
    }

    /**
     * @dev Create a new location-verified gift using GGT tokens
     * @param recipient Address that can claim the gift
     * @param latitude Target latitude (scaled by 1e6)
     * @param longitude Target longitude (scaled by 1e6)
     * @param radius Acceptable claiming radius in meters
     * @param clueHash Hash of the location clue
     * @param expiryTime Unix timestamp when gift expires
     * @param metadata Additional metadata hash
     * @param amount Amount of GGT tokens to lock
     * @return giftId The ID of the created gift
     */
    function createGift(
        address payable recipient,
        int256 latitude,
        int256 longitude,
        uint256 radius,
        bytes32 clueHash,
        uint256 expiryTime,
        bytes32 metadata,
        uint256 amount
    ) external nonReentrant whenNotPaused returns (uint256 giftId) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(expiryTime > block.timestamp, "Expiry time must be in future");
        require(radius > 0 && radius <= 10000, "Invalid radius"); // Max 10km

        // Check allowance and transfer tokens
        uint256 allowance = ggtToken.allowance(msg.sender, address(this));
        if (allowance < amount) {
            revert InsufficientAllowance();
        }

        // Transfer GGT tokens to this contract
        require(ggtToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Create the gift
        giftId = nextGiftId++;
        gifts[giftId] = Gift({
            giver: payable(msg.sender),
            recipient: recipient,
            amount: amount,
            latitude: latitude,
            longitude: longitude,
            radius: radius,
            clueHash: clueHash,
            expiryTime: expiryTime,
            metadata: metadata,
            claimed: false,
            exists: true,
            claimAttempts: 0,
            createdAt: block.timestamp
        });

        // Update stats
        totalGiftsCreated++;
        totalValueLocked += amount;

        emit GiftCreated(giftId, msg.sender, recipient, amount, expiryTime);
    }

    /**
     * @dev Claim a gift by providing GPS coordinates
     * @param giftId ID of the gift to claim
     * @param userLatitude User's current latitude (scaled by 1e6)
     * @param userLongitude User's current longitude (scaled by 1e6)
     * @param locationProof Additional location proof (future use)
     */
    function claimGift(
        uint256 giftId,
        int256 userLatitude,
        int256 userLongitude,
        bytes memory locationProof
    ) external nonReentrant whenNotPaused {
        Gift storage gift = gifts[giftId];
        
        if (!gift.exists) revert GiftNotFound();
        if (gift.claimed) revert GiftAlreadyClaimed();
        if (block.timestamp > gift.expiryTime) revert GiftHasExpired();
        if (msg.sender != gift.recipient) revert NotGiftRecipient();

        // Increment claim attempts
        gift.claimAttempts++;

        // Verify location (simplified distance calculation)
        uint256 distance = calculateDistance(
            gift.latitude,
            gift.longitude,
            userLatitude,
            userLongitude
        );

        if (distance > gift.radius) {
            revert LocationTooFarAway();
        }

        // Mark as claimed and transfer tokens
        gift.claimed = true;
        totalGiftsClaimed++;
        totalValueLocked -= gift.amount;

        require(ggtToken.transfer(gift.recipient, gift.amount), "Transfer failed");

        emit GiftClaimed(giftId, msg.sender, gift.amount);
    }

    /**
     * @dev Emergency withdrawal after expiry (only gift giver)
     * @param giftId ID of the expired gift
     */
    function emergencyWithdraw(uint256 giftId) external nonReentrant {
        Gift storage gift = gifts[giftId];
        
        if (!gift.exists) revert GiftNotFound();
        if (gift.claimed) revert GiftAlreadyClaimed();
        if (msg.sender != gift.giver) revert NotGiftGiver();
        if (block.timestamp <= gift.expiryTime) revert GiftNotExpired();

        // Mark as claimed (emergency withdrawal) and transfer back to giver
        gift.claimed = true;
        totalValueLocked -= gift.amount;

        require(ggtToken.transfer(gift.giver, gift.amount), "Transfer failed");

        emit EmergencyWithdrawal(giftId, msg.sender, gift.amount);
    }

    /**
     * @dev Calculate distance between two coordinates (simplified)
     * @param lat1 First latitude (scaled by 1e6)
     * @param lon1 First longitude (scaled by 1e6)
     * @param lat2 Second latitude (scaled by 1e6)
     * @param lon2 Second longitude (scaled by 1e6)
     * @return distance Distance in meters (approximate)
     */
    function calculateDistance(
        int256 lat1,
        int256 lon1,
        int256 lat2,
        int256 lon2
    ) public pure returns (uint256 distance) {
        // Simplified distance calculation
        // In production, would use more accurate Haversine formula
        int256 deltaLat = lat1 - lat2;
        int256 deltaLon = lon1 - lon2;
        
        // Simple Euclidean distance approximation
        // Convert back from scaled coordinates and apply rough conversion
        uint256 latDiffMeters = uint256(deltaLat < 0 ? -deltaLat : deltaLat) * 111; // ~111m per degree latitude
        uint256 lonDiffMeters = uint256(deltaLon < 0 ? -deltaLon : deltaLon) * 111; // Simplified
        
        // Simple distance approximation
        distance = sqrt(latDiffMeters * latDiffMeters + lonDiffMeters * lonDiffMeters) / 1000; // Scale back down
    }

    /**
     * @dev Simple square root function
     */
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    /**
     * @dev Get gift details
     * @param giftId ID of the gift
     * @return All gift information
     */
    function getGift(uint256 giftId) external view returns (Gift memory) {
        if (!gifts[giftId].exists) revert GiftNotFound();
        return gifts[giftId];
    }

    /**
     * @dev Check if a gift exists and is claimable
     * @param giftId ID of the gift
     * @return claimable Whether the gift can be claimed
     */
    function isGiftClaimable(uint256 giftId) external view returns (bool claimable) {
        Gift storage gift = gifts[giftId];
        return gift.exists && !gift.claimed && block.timestamp <= gift.expiryTime;
    }

    // Admin functions
    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    /**
     * @dev Get contract statistics
     */
    function getStats() external view returns (
        uint256 giftsCreated,
        uint256 giftsClaimed,
        uint256 valueLocked,
        uint256 nextId
    ) {
        return (totalGiftsCreated, totalGiftsClaimed, totalValueLocked, nextGiftId);
    }
}