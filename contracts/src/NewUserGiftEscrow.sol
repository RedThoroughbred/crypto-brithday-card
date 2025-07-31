// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title NewUserGiftEscrow
 * @dev Smart contract for crypto gifts that can be claimed by new users with claim codes
 */
contract NewUserGiftEscrow is ReentrancyGuard, Ownable, Pausable {
    
    struct NewUserGift {
        address sender;
        uint256 amount;
        bytes32 claimHash;          // Hash of the claim code
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
     * @dev Create a new user gift with claim code
     * @param claimHash Hash of the claim code (keccak256 of claim code)
     * @param expiryDays Number of days until gift expires
     * @param message Personal message from sender
     * @param unlockType Type of unlock mechanism ("simple", "gps", "password", "quiz")
     * @param unlockHash Hash for unlock verification (if needed)
     * @param unlockData Additional unlock data (location, question, etc.)
     */
    function createNewUserGift(
        bytes32 claimHash,
        uint256 expiryDays,
        string memory message,
        string memory unlockType,
        bytes32 unlockHash,
        string memory unlockData
    ) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Gift amount must be greater than 0");
        require(expiryDays > 0 && expiryDays <= 365, "Invalid expiry days");
        require(!claimHashUsed[claimHash], "Claim code already used");
        
        // Generate unique gift ID
        bytes32 giftId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            block.prevrandao,
            claimHash
        ));
        
        // Mark claim hash as used
        claimHashUsed[claimHash] = true;
        
        // Create gift
        gifts[giftId] = NewUserGift({
            sender: msg.sender,
            amount: msg.value,
            claimHash: claimHash,
            expiry: block.timestamp + (expiryDays * 1 days),
            claimed: false,
            refunded: false,
            message: message,
            unlockType: unlockType,
            unlockHash: unlockHash,
            unlockData: unlockData
        });
        
        emit NewUserGiftCreated(giftId, msg.sender, msg.value, gifts[giftId].expiry, unlockType);
    }
    
    /**
     * @dev Claim a gift with claim code and optional unlock verification
     * @param giftId The gift ID
     * @param claimCode The claim code
     * @param unlockAnswer Answer for unlock verification (if needed)
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
        
        // Verify unlock mechanism if needed
        if (keccak256(abi.encodePacked(gift.unlockType)) == keccak256(abi.encodePacked("password")) ||
            keccak256(abi.encodePacked(gift.unlockType)) == keccak256(abi.encodePacked("quiz"))) {
            bytes32 providedUnlockHash = keccak256(abi.encodePacked(unlockAnswer));
            require(providedUnlockHash == gift.unlockHash, "Invalid unlock answer");
        }
        
        // Mark as claimed
        gift.claimed = true;
        
        // Transfer funds to claimer
        (bool success, ) = payable(msg.sender).call{value: gift.amount}("");
        require(success, "Transfer failed");
        
        emit GiftClaimed(giftId, msg.sender, gift.amount);
    }
    
    /**
     * @dev Refund an expired gift to the sender
     * @param giftId The gift ID
     */
    function refundExpiredGift(bytes32 giftId) external nonReentrant {
        NewUserGift storage gift = gifts[giftId];
        
        require(gift.sender != address(0), "Gift does not exist");
        require(!gift.claimed, "Gift already claimed");
        require(!gift.refunded, "Gift already refunded");
        require(block.timestamp > gift.expiry, "Gift has not expired yet");
        require(msg.sender == gift.sender, "Only sender can refund");
        
        // Mark as refunded
        gift.refunded = true;
        
        // Transfer funds back to sender
        (bool success, ) = payable(gift.sender).call{value: gift.amount}("");
        require(success, "Refund failed");
        
        emit GiftRefunded(giftId, gift.sender, gift.amount);
    }
    
    /**
     * @dev Get gift details
     * @param giftId The gift ID
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
        NewUserGift storage gift = gifts[giftId];
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
     * @dev Check if a gift exists and is claimable
     * @param giftId The gift ID
     */
    function isClaimable(bytes32 giftId) external view returns (bool) {
        NewUserGift storage gift = gifts[giftId];
        return gift.sender != address(0) && 
               !gift.claimed && 
               !gift.refunded && 
               block.timestamp <= gift.expiry;
    }
    
    /**
     * @dev Emergency pause function
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause function
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw function (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Emergency withdraw failed");
    }
}