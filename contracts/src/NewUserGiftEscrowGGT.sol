// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title NewUserGiftEscrowGGT
 * @dev Smart contract for creating crypto gifts for new users with GGT tokens
 * Uses claim codes instead of wallet addresses for recipients
 * Supports multiple unlock mechanisms: simple, password, quiz, GPS
 */
contract NewUserGiftEscrowGGT is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // GGT Token contract address on Sepolia
    IERC20 public constant GGT_TOKEN = IERC20(0x1775997EE682CCab7c6443168d63D2605922C633);
    
    struct NewUserGift {
        address sender;             // Address of gift creator
        uint256 amount;             // Amount of GGT tokens
        bytes32 claimHash;          // Hash of claim code
        uint256 expiry;             // Timestamp when gift expires
        bool claimed;
        bool refunded;
        string message;             // Personal message from sender
        // Unlock mechanism data
        string unlockType;          // "gps", "password", "quiz", "simple"
        bytes32 unlockHash;         // Hash for unlock verification (if needed)
        string unlockData;          // Additional unlock data (location, question, etc.)
    }
    
    // Mapping from gift ID to gift data
    mapping(bytes32 => NewUserGift) public gifts;
    
    // Mapping to track if a claim code has been used
    mapping(bytes32 => bool) public claimHashUsed;
    
    // Events
    event NewUserGiftCreated(
        bytes32 indexed giftId,
        address indexed sender,
        uint256 amount,
        uint256 expiry,
        string unlockType
    );
    
    event GiftClaimed(
        bytes32 indexed giftId,
        address indexed recipient,
        uint256 amount
    );
    
    event GiftRefunded(
        bytes32 indexed giftId,
        address indexed sender,
        uint256 amount
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new user gift with claim code using GGT tokens
     * @param claimHash Hash of the claim code (keccak256 of claim code)
     * @param amount Amount of GGT tokens to gift
     * @param expiryDays Number of days until gift expires
     * @param message Personal message from sender
     * @param unlockType Type of unlock mechanism ("simple", "gps", "password", "quiz")
     * @param unlockHash Hash for unlock verification (if needed)
     * @param unlockData Additional unlock data (location, question, etc.)
     */
    function createNewUserGift(
        bytes32 claimHash,
        uint256 amount,
        uint256 expiryDays,
        string memory message,
        string memory unlockType,
        bytes32 unlockHash,
        string memory unlockData
    ) external nonReentrant whenNotPaused {
        require(amount > 0, "Gift amount must be greater than 0");
        require(expiryDays > 0 && expiryDays <= 365, "Invalid expiry days");
        require(!claimHashUsed[claimHash], "Claim code already used");
        
        // Transfer GGT tokens from sender to this contract
        GGT_TOKEN.safeTransferFrom(msg.sender, address(this), amount);
        
        // Generate unique gift ID
        bytes32 giftId = keccak256(abi.encodePacked(
            msg.sender,
            claimHash,
            amount,
            block.timestamp,
            block.prevrandao
        ));
        
        // Calculate expiry timestamp
        uint256 expiry = block.timestamp + (expiryDays * 1 days);
        
        // Store gift data
        gifts[giftId] = NewUserGift({
            sender: msg.sender,
            amount: amount,
            claimHash: claimHash,
            expiry: expiry,
            claimed: false,
            refunded: false,
            message: message,
            unlockType: unlockType,
            unlockHash: unlockHash,
            unlockData: unlockData
        });
        
        // Mark claim hash as used
        claimHashUsed[claimHash] = true;
        
        emit NewUserGiftCreated(giftId, msg.sender, amount, expiry, unlockType);
    }
    
    /**
     * @dev Claim a gift using claim code and unlock answer
     * @param giftId ID of the gift to claim
     * @param claimCode Original claim code (will be hashed for verification)
     * @param unlockAnswer Answer/password for unlock challenge (if required)
     */
    function claimGift(
        bytes32 giftId,
        string memory claimCode,
        string memory unlockAnswer
    ) external nonReentrant whenNotPaused {
        NewUserGift storage gift = gifts[giftId];
        
        require(gift.sender != address(0), "Gift does not exist");
        require(!gift.claimed, "Gift already claimed");
        require(!gift.refunded, "Gift already refunded");
        require(block.timestamp <= gift.expiry, "Gift has expired");
        
        // Verify claim code
        bytes32 providedClaimHash = keccak256(abi.encodePacked(claimCode));
        require(providedClaimHash == gift.claimHash, "Invalid claim code");
        
        // Verify unlock challenge if required
        if (keccak256(abi.encodePacked(gift.unlockType)) != keccak256(abi.encodePacked("simple"))) {
            bytes32 providedUnlockHash = keccak256(abi.encodePacked(unlockAnswer));
            require(providedUnlockHash == gift.unlockHash, "Invalid unlock answer");
        }
        
        // Mark as claimed
        gift.claimed = true;
        
        // Transfer GGT tokens to recipient
        GGT_TOKEN.safeTransfer(msg.sender, gift.amount);
        
        emit GiftClaimed(giftId, msg.sender, gift.amount);
    }
    
    /**
     * @dev Refund an expired gift back to sender
     * @param giftId ID of the gift to refund
     */
    function refundExpiredGift(bytes32 giftId) external nonReentrant {
        NewUserGift storage gift = gifts[giftId];
        
        require(gift.sender != address(0), "Gift does not exist");
        require(!gift.claimed, "Gift already claimed");
        require(!gift.refunded, "Gift already refunded");
        require(block.timestamp > gift.expiry, "Gift has not expired yet");
        require(msg.sender == gift.sender || msg.sender == owner(), "Only sender or owner can refund");
        
        // Mark as refunded
        gift.refunded = true;
        
        // Transfer GGT tokens back to sender
        GGT_TOKEN.safeTransfer(gift.sender, gift.amount);
        
        emit GiftRefunded(giftId, gift.sender, gift.amount);
    }
    
    /**
     * @dev Get gift details
     * @param giftId ID of the gift
     * @return sender Address of gift creator
     * @return amount Amount of GGT tokens
     * @return expiry Timestamp when gift expires
     * @return claimed Whether gift has been claimed
     * @return refunded Whether gift has been refunded
     * @return message Personal message from sender
     * @return unlockType Type of unlock mechanism
     * @return unlockData Additional unlock data
     */
    function getGift(bytes32 giftId) external view returns (
        address sender,
        uint256 amount,
        uint256 expiry,
        bool claimed,
        bool refunded,
        string memory message,
        string memory unlockType,
        string memory unlockData
    ) {
        NewUserGift memory gift = gifts[giftId];
        return (
            gift.sender,
            gift.amount,
            gift.expiry,
            gift.claimed,
            gift.refunded,
            gift.message,
            gift.unlockType,
            gift.unlockData
        );
    }
    
    /**
     * @dev Check if a gift is claimable
     * @param giftId ID of the gift
     * @return True if gift can be claimed
     */
    function isClaimable(bytes32 giftId) external view returns (bool) {
        NewUserGift memory gift = gifts[giftId];
        return (
            gift.sender != address(0) &&
            !gift.claimed &&
            !gift.refunded &&
            block.timestamp <= gift.expiry
        );
    }
    
    /**
     * @dev Emergency pause function
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Emergency unpause function
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal function (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = GGT_TOKEN.balanceOf(address(this));
        if (balance > 0) {
            GGT_TOKEN.safeTransfer(owner(), balance);
        }
    }
}