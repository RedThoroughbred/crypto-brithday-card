// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title LocationEscrow
 * @dev Smart contract for location-verified crypto gifts
 * @author GeoGift Team
 * @notice This contract holds funds in escrow until location verification
 */
contract LocationEscrow is ReentrancyGuard, Pausable, AccessControl {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    // Role definitions
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Constants
    uint256 public constant PRECISION_MULTIPLIER = 1_000_000; // 6 decimal places
    uint256 public constant MAX_RADIUS = 1000; // 1km max radius
    uint256 public constant MIN_RADIUS = 5; // 5m min radius
    uint256 public constant MAX_EXPIRY = 365 days;
    uint256 public constant MIN_EXPIRY = 1 hours;
    
    // State variables
    uint256 public nextGiftId = 1;
    uint256 public platformFeeRate = 250; // 2.5% in basis points
    address payable public feeRecipient;
    uint256 public totalGiftsCreated;
    uint256 public totalValueLocked;
    
    // Gift structure
    struct Gift {
        address payable giver;           // Gift creator
        address payable recipient;       // Gift recipient
        uint256 amount;                  // Gift amount in wei
        int256 targetLatitude;          // Target latitude * PRECISION_MULTIPLIER
        int256 targetLongitude;         // Target longitude * PRECISION_MULTIPLIER
        uint256 verificationRadius;     // Verification radius in meters
        bytes32 clueHash;               // Hash of location clues
        uint256 createdAt;              // Creation timestamp
        uint256 expiryTime;             // Expiration timestamp
        bool claimed;                   // Claim status
        bool exists;                    // Existence flag
        uint256 claimAttempts;          // Number of claim attempts
        bytes32 metadata;               // IPFS hash for additional data
    }
    
    // Storage mappings
    mapping(uint256 => Gift) public gifts;
    mapping(address => uint256[]) public userGifts;
    mapping(address => uint256[]) public recipientGifts;
    mapping(uint256 => address[]) public giftAttempts;
    mapping(address => uint256) public userNonces;
    
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
        address indexed recipient,
        uint256 amount,
        uint256 fee
    );
    
    event GiftExpired(
        uint256 indexed giftId,
        address indexed giver,
        uint256 amount
    );
    
    event ClaimAttempt(
        uint256 indexed giftId,
        address indexed claimer,
        bool successful,
        uint256 distance
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    
    // Custom errors for gas efficiency
    error GiftNotFound();
    error GiftAlreadyClaimed();
    error GiftExpiredError();
    error UnauthorizedClaimer();
    error LocationVerificationFailed();
    error InvalidParameters();
    error InsufficientAmount();
    error TransferFailed();
    
    constructor(address payable _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        feeRecipient = _feeRecipient;
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new location-verified gift
     * @param recipient Address that can claim the gift
     * @param latitude Target latitude (multiplied by PRECISION_MULTIPLIER)
     * @param longitude Target longitude (multiplied by PRECISION_MULTIPLIER)
     * @param radius Verification radius in meters
     * @param clueHash Hash of location clues
     * @param expiryTime Timestamp when gift expires
     * @param metadata IPFS hash for additional gift data
     */
    function createGift(
        address payable recipient,
        int256 latitude,
        int256 longitude,
        uint256 radius,
        bytes32 clueHash,
        uint256 expiryTime,
        bytes32 metadata
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        // Input validation
        if (msg.value == 0) revert InsufficientAmount();
        if (recipient == address(0) || recipient == msg.sender) revert InvalidParameters();
        if (latitude < -90_000000 || latitude > 90_000000) revert InvalidParameters();
        if (longitude < -180_000000 || longitude > 180_000000) revert InvalidParameters();
        if (radius < MIN_RADIUS || radius > MAX_RADIUS) revert InvalidParameters();
        if (expiryTime <= block.timestamp || expiryTime > block.timestamp + MAX_EXPIRY) {
            revert InvalidParameters();
        }
        if (clueHash == bytes32(0)) revert InvalidParameters();
        
        uint256 giftId = nextGiftId++;
        
        // Create gift
        gifts[giftId] = Gift({
            giver: payable(msg.sender),
            recipient: recipient,
            amount: msg.value,
            targetLatitude: latitude,
            targetLongitude: longitude,
            verificationRadius: radius,
            clueHash: clueHash,
            createdAt: block.timestamp,
            expiryTime: expiryTime,
            claimed: false,
            exists: true,
            claimAttempts: 0,
            metadata: metadata
        });
        
        // Update mappings
        userGifts[msg.sender].push(giftId);
        recipientGifts[recipient].push(giftId);
        
        // Update statistics
        totalGiftsCreated++;
        totalValueLocked += msg.value;
        
        emit GiftCreated(giftId, msg.sender, recipient, msg.value, expiryTime);
        
        return giftId;
    }
    
    /**
     * @dev Claim a gift by verifying location
     * @param giftId ID of the gift to claim
     * @param userLatitude User's current latitude
     * @param userLongitude User's current longitude
     * @param locationProof Optional cryptographic proof of location
     */
    function claimGift(
        uint256 giftId,
        int256 userLatitude,
        int256 userLongitude,
        bytes calldata locationProof
    ) external whenNotPaused nonReentrant {
        Gift storage gift = gifts[giftId];
        
        // Validation checks
        if (!gift.exists) revert GiftNotFound();
        if (gift.claimed) revert GiftAlreadyClaimed();
        if (block.timestamp > gift.expiryTime) revert GiftExpiredError();
        if (gift.recipient != msg.sender) revert UnauthorizedClaimer();
        
        // Increment attempt counter
        gift.claimAttempts++;
        giftAttempts[giftId].push(msg.sender);
        
        // Verify location
        uint256 distance = _calculateDistance(
            gift.targetLatitude,
            gift.targetLongitude,
            userLatitude,
            userLongitude
        );
        
        bool locationValid = distance <= gift.verificationRadius;
        
        // Additional verification with proof if provided
        if (locationProof.length > 0) {
            locationValid = locationValid && _verifyLocationProof(
                giftId,
                userLatitude,
                userLongitude,
                locationProof
            );
        }
        
        emit ClaimAttempt(giftId, msg.sender, locationValid, distance);
        
        if (!locationValid) {
            revert LocationVerificationFailed();
        }
        
        // Mark as claimed
        gift.claimed = true;
        
        // Calculate fees
        uint256 fee = (gift.amount * platformFeeRate) / 10000;
        uint256 recipientAmount = gift.amount - fee;
        
        // Update total value locked
        totalValueLocked -= gift.amount;
        
        // Transfer funds
        if (fee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
            if (!feeSuccess) revert TransferFailed();
        }
        
        (bool success, ) = gift.recipient.call{value: recipientAmount}("");
        if (!success) revert TransferFailed();
        
        emit GiftClaimed(giftId, gift.recipient, recipientAmount, fee);
    }
    
    /**
     * @dev Emergency withdrawal after expiry
     * @param giftId ID of the expired gift
     */
    function emergencyWithdraw(uint256 giftId) external nonReentrant {
        Gift storage gift = gifts[giftId];
        
        if (!gift.exists) revert GiftNotFound();
        if (gift.claimed) revert GiftAlreadyClaimed();
        if (gift.giver != msg.sender) revert UnauthorizedClaimer();
        if (block.timestamp <= gift.expiryTime) revert InvalidParameters();
        
        // Mark as claimed to prevent re-entry
        gift.claimed = true;
        
        // Update total value locked
        totalValueLocked -= gift.amount;
        
        // Return funds to giver
        (bool success, ) = gift.giver.call{value: gift.amount}("");
        if (!success) revert TransferFailed();
        
        emit GiftExpired(giftId, gift.giver, gift.amount);
    }
    
    /**
     * @dev Calculate distance between two coordinates using simplified formula
     * @param lat1 First latitude (scaled by PRECISION_MULTIPLIER)
     * @param lon1 First longitude (scaled by PRECISION_MULTIPLIER)
     * @param lat2 Second latitude (scaled by PRECISION_MULTIPLIER)
     * @param lon2 Second longitude (scaled by PRECISION_MULTIPLIER)
     * @return distance Distance in meters
     */
    function _calculateDistance(
        int256 lat1,
        int256 lon1,
        int256 lat2,
        int256 lon2
    ) internal pure returns (uint256 distance) {
        // Earth's radius in meters
        uint256 R = 6371000;

        // Convert degrees to radians and scale by PRECISION_MULTIPLIER
        // (lat/lon are already scaled by PRECISION_MULTIPLIER, so we need to convert them to radians)
        // 1 degree = PI / 180 radians
        // So, (lat_scaled / PRECISION_MULTIPLIER) * (PI / 180)
        // We can approximate PI / 180 as 0.0174532925, scaled by PRECISION_MULTIPLIER
        // PI_OVER_180_SCALED = 17453
        uint256 PI_OVER_180_SCALED = 17453; // PI * PRECISION_MULTIPLIER / 180

        int256 lat1Rad = (lat1 * int256(PI_OVER_180_SCALED)) / int256(PRECISION_MULTIPLIER);
        int256 lat2Rad = (lat2 * int256(PI_OVER_180_SCALED)) / int256(PRECISION_MULTIPLIER);
        int256 dLatRad = ((lat2 - lat1) * int256(PI_OVER_180_SCALED)) / int256(PRECISION_MULTIPLIER);
        int256 dLonRad = ((lon2 - lon1) * int256(PI_OVER_180_SCALED)) / int256(PRECISION_MULTIPLIER);

        // a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
        int256 sin_dLat_div_2 = _sin(dLatRad / 2);
        int256 sin_dLon_div_2 = _sin(dLonRad / 2);
        int256 cos_lat1 = _cos(lat1Rad);
        int256 cos_lat2 = _cos(lat2Rad);

        // All intermediate products need to be scaled correctly
        // (sin_dLat_div_2 * sin_dLat_div_2) is (scaled * scaled) / scaled = scaled
        int256 term1 = (sin_dLat_div_2 * sin_dLat_div_2) / int256(PRECISION_MULTIPLIER);
        int256 term2_cos_product = (cos_lat1 * cos_lat2) / int256(PRECISION_MULTIPLIER);
        int256 term2_sin_product = (sin_dLon_div_2 * sin_dLon_div_2) / int256(PRECISION_MULTIPLIER);
        int256 term2 = (term2_cos_product * term2_sin_product) / int256(PRECISION_MULTIPLIER);

        int256 a_scaled = term1 + term2;

        // Clamp a_scaled to [0, PRECISION_MULTIPLIER]
        if (a_scaled < 0) {
            a_scaled = 0;
        }
        if (a_scaled > int256(PRECISION_MULTIPLIER)) {
            a_scaled = int256(PRECISION_MULTIPLIER);
        }

        // c = 2 ⋅ atan2( √a, √(1−a) )
        // _sqrt returns uint256, so we need to cast a_scaled to uint256
        uint256 sqrt_a = _sqrt(uint256(a_scaled));
        uint256 sqrt_1_minus_a = _sqrt(uint256(int256(PRECISION_MULTIPLIER) - a_scaled));

        int256 c_scaled = 2 * _atan2(sqrt_a, sqrt_1_minus_a);

        // d = R ⋅ c
        // R is uint256, c_scaled is int256 (scaled by PRECISION_MULTIPLIER)
        // (R * c_scaled) / PRECISION_MULTIPLIER
        distance = uint256((R * uint256(c_scaled)) / PRECISION_MULTIPLIER);
    }

    // Helper functions need to be re-evaluated for scaling and accuracy.
    // The current _sin, _cos, _atan2 are Taylor series approximations.
    // These might be the source of inaccuracy.
    // For better accuracy, we might need to use lookup tables or more iterations for Taylor series.
    // However, for now, let's ensure the scaling is correct.

    // Let's simplify the _sin and _cos to avoid repeated division by PRECISION_MULTIPLIER
    // and ensure the return value is also scaled by PRECISION_MULTIPLIER.

    function _sin(int256 x) internal pure returns (int256) {
        // x is in radians * PRECISION_MULTIPLIER
        // Taylor series: x - x^3/3! + x^5/5! - ...
        // All terms need to be scaled by PRECISION_MULTIPLIER
        // x^3 / 3! = (x * x * x) / (PRECISION_MULTIPLIER^2 * 6)
        int256 x_scaled = x;
        int256 x2_scaled = (x_scaled * x_scaled) / int256(PRECISION_MULTIPLIER);
        int256 x3_scaled = (x2_scaled * x_scaled) / int256(PRECISION_MULTIPLIER);
        int256 x5_scaled = (x3_scaled * x2_scaled) / int256(PRECISION_MULTIPLIER);

        return x_scaled - (x3_scaled / 6) + (x5_scaled / 120);
    }

    function _cos(int256 x) internal pure returns (int256) {
        // x is in radians * PRECISION_MULTIPLIER
        // Taylor series: 1 - x^2/2! + x^4/4! - ...
        // All terms need to be scaled by PRECISION_MULTIPLIER
        int256 x_scaled = x;
        int256 x2_scaled = (x_scaled * x_scaled) / int256(PRECISION_MULTIPLIER);
        int256 x4_scaled = (x2_scaled * x2_scaled) / int256(PRECISION_MULTIPLIER);

        return int256(PRECISION_MULTIPLIER) - (x2_scaled / 2) + (x4_scaled / 24);
    }

    function _atan2(uint256 y, uint256 x) internal pure returns (int256) {
        // CORDIC algorithm approximation for atan2(y, x)
        // y and x are scaled by PRECISION_MULTIPLIER
        // Returns radians scaled by PRECISION_MULTIPLIER

        if (x == 0) {
            if (y > 0) return int256(1570796); // PI/2 * PRECISION_MULTIPLIER
            if (y < 0) return int256(-1570796); // -PI/2 * PRECISION_MULTIPLIER
            return 0;
        }

        // Ensure x is positive for the approximation
        bool x_is_negative = x < 0;
        if (x_is_negative) {
            x = uint256(-int256(x));
        }

        int256 z = int256((y * PRECISION_MULTIPLIER) / x); // This z is scaled by PRECISION_MULTIPLIER
        int256 z2 = (z * z) / int256(PRECISION_MULTIPLIER); // z^2 scaled by PRECISION_MULTIPLIER

        int256 result = z - (z * z2) / (3 * int256(PRECISION_MULTIPLIER)) + (z * z2 * z2) / (5 * int256(PRECISION_MULTIPLIER * PRECISION_MULTIPLIER));

        if (x_is_negative) {
            if (y >= 0) {
                result = int256(3141592) - result; // PI * PRECISION_MULTIPLIER - result
            } else {
                result = int256(-3141592) - result; // -PI * PRECISION_MULTIPLIER - result
            }
        }
        return result;
    }
    
    /**
     * @dev Verify cryptographic proof of location (optional)
     * @param giftId Gift ID for context
     * @param latitude User's latitude
     * @param longitude User's longitude
     * @param proof Cryptographic proof
     * @return valid True if proof is valid
     */
    function _verifyLocationProof(
        uint256 giftId,
        int256 latitude,
        int256 longitude,
        bytes calldata proof
    ) internal view returns (bool valid) {
        // Implementation depends on chosen proof system
        // Could use zk-SNARKs, commit-reveal schemes, or oracle signatures
        
        if (proof.length == 65) {
            // ECDSA signature verification example
            bytes32 message = keccak256(abi.encodePacked(
                giftId,
                latitude,
                longitude,
                block.timestamp
            ));
            
            address signer = message.toEthSignedMessageHash().recover(proof);
            return hasRole(VERIFIER_ROLE, signer);
        }
        
        return true; // Default to true if no proof system implemented
    }
    
    /**
     * @dev Integer square root using Newton's method
     * @param x Input value
     * @return y Square root of x
     */
    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
    
    // View functions
    function getGift(uint256 giftId) external view returns (Gift memory) {
        if (!gifts[giftId].exists) revert GiftNotFound();
        return gifts[giftId];
    }
    
    function getUserGifts(address user) external view returns (uint256[] memory) {
        return userGifts[user];
    }
    
    function getRecipientGifts(address recipient) external view returns (uint256[] memory) {
        return recipientGifts[recipient];
    }
    
    function getGiftAttempts(uint256 giftId) external view returns (address[] memory) {
        return giftAttempts[giftId];
    }
    
    // Admin functions
    function updatePlatformFee(uint256 newFeeRate) external onlyRole(OPERATOR_ROLE) {
        require(newFeeRate <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = platformFeeRate;
        platformFeeRate = newFeeRate;
        emit PlatformFeeUpdated(oldFee, newFeeRate);
    }
    
    function updateFeeRecipient(address payable newRecipient) external onlyRole(OPERATOR_ROLE) {
        require(newRecipient != address(0), "Invalid recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }
    
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }
    
    // Emergency functions
    function emergencyRecovery(uint256 giftId) external onlyRole(EMERGENCY_ROLE) {
        Gift storage gift = gifts[giftId];
        require(gift.exists && !gift.claimed, "Invalid gift state");
        
        gift.claimed = true;
        totalValueLocked -= gift.amount;
        
        (bool success, ) = gift.giver.call{value: gift.amount}("");
        require(success, "Recovery failed");
        
        emit GiftExpired(giftId, gift.giver, gift.amount);
    }
}