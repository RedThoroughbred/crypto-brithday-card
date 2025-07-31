// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title NewUserGiftEscrowSimple
 * @dev Simplified smart contract for creating crypto gifts for new users
 * This version doesn't use GSN but is compatible with meta-transaction systems
 */
contract NewUserGiftEscrowSimple is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // GGT Token contract address on Sepolia
    IERC20 public constant GGT_TOKEN = IERC20(0x1775997EE682CCab7c6443168d63D2605922C633);
    
    struct NewUserGift {
        address sender;             // Address of gift creator
        uint256 ggtAmount;          // Amount of GGT tokens
        uint256 gasAllowance;       // ETH allocated for gas sponsoring
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
    
    // Gas sponsoring balances per gift
    mapping(bytes32 => uint256) public gasBalances;
    
    // Total gas pool for emergency management
    uint256 public totalGasPool;
    
    // Events
    event NewUserGiftCreated(
        bytes32 indexed giftId,
        address indexed sender,
        uint256 ggtAmount,
        uint256 gasAllowance,
        uint256 expiry,
        string unlockType
    );
    
    event GiftClaimed(
        bytes32 indexed giftId,
        address indexed recipient,
        uint256 ggtAmount
    );
    
    event GiftRefunded(
        bytes32 indexed giftId,
        address indexed sender,
        uint256 ggtAmount,
        uint256 gasRefund
    );
    
    event GasPoolFunded(
        bytes32 indexed giftId,
        uint256 amount
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new user gift with claim code and gas sponsoring
     */
    function createNewUserGift(
        bytes32 claimHash,
        uint256 ggtAmount,
        uint256 gasAllowance,
        uint256 expiryDays,
        string memory message,
        string memory unlockType,
        bytes32 unlockHash,
        string memory unlockData
    ) external payable nonReentrant whenNotPaused {
        require(ggtAmount > 0, "GGT amount must be greater than 0");
        require(msg.value == gasAllowance, "ETH sent must match gasAllowance");
        require(gasAllowance >= 0.001 ether, "Gas allowance must be at least 0.001 ETH");
        require(expiryDays > 0 && expiryDays <= 365, "Invalid expiry days");
        require(!claimHashUsed[claimHash], "Claim code already used");
        
        address sender = msg.sender;
        
        // Transfer GGT tokens from sender to this contract
        GGT_TOKEN.safeTransferFrom(sender, address(this), ggtAmount);
        
        // Generate unique gift ID
        bytes32 giftId = keccak256(abi.encodePacked(
            sender,
            claimHash,
            ggtAmount,
            gasAllowance,
            block.timestamp,
            block.prevrandao
        ));
        
        // Calculate expiry timestamp
        uint256 expiry = block.timestamp + (expiryDays * 1 days);
        
        // Store gift data
        gifts[giftId] = NewUserGift({
            sender: sender,
            ggtAmount: ggtAmount,
            gasAllowance: gasAllowance,
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
        
        // Allocate gas funds for this gift
        gasBalances[giftId] = gasAllowance;
        totalGasPool += gasAllowance;
        
        emit NewUserGiftCreated(giftId, sender, ggtAmount, gasAllowance, expiry, unlockType);
        emit GasPoolFunded(giftId, gasAllowance);
    }
    
    /**
     * @dev Claim a gift using claim code and unlock answer
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
        
        address recipient = msg.sender;
        
        // Transfer GGT tokens to recipient
        GGT_TOKEN.safeTransfer(recipient, gift.ggtAmount);
        
        emit GiftClaimed(giftId, recipient, gift.ggtAmount);
    }
    
    /**
     * @dev Refund an expired gift back to sender
     */
    function refundExpiredGift(bytes32 giftId) external nonReentrant {
        NewUserGift storage gift = gifts[giftId];
        
        require(gift.sender != address(0), "Gift does not exist");
        require(!gift.claimed, "Gift already claimed");
        require(!gift.refunded, "Gift already refunded");
        require(block.timestamp > gift.expiry, "Gift has not expired yet");
        
        address sender = msg.sender;
        require(sender == gift.sender || sender == owner(), "Only sender or owner can refund");
        
        // Mark as refunded
        gift.refunded = true;
        
        // Refund GGT tokens to sender
        GGT_TOKEN.safeTransfer(gift.sender, gift.ggtAmount);
        
        // Refund unused gas allowance
        uint256 gasRefund = gasBalances[giftId];
        if (gasRefund > 0) {
            gasBalances[giftId] = 0;
            totalGasPool -= gasRefund;
            (bool success, ) = payable(gift.sender).call{value: gasRefund}("");
            require(success, "Gas refund failed");
        }
        
        emit GiftRefunded(giftId, gift.sender, gift.ggtAmount, gasRefund);
    }
    
    /**
     * @dev Check if a gift claim can be sponsored (has gas allowance)
     */
    function canSponsorClaim(bytes32 giftId) external view returns (bool) {
        return gasBalances[giftId] >= 0.0005 ether; // Minimum for a claim transaction
    }
    
    /**
     * @dev Deduct gas costs from gift's gas balance (called by paymaster or owner)
     */
    function deductGasCost(bytes32 giftId, uint256 gasCost) external onlyOwner {
        require(gasBalances[giftId] >= gasCost, "Insufficient gas balance");
        gasBalances[giftId] -= gasCost;
        totalGasPool -= gasCost;
    }
    
    /**
     * @dev Get gift details
     */
    function getGift(bytes32 giftId) external view returns (
        address sender,
        uint256 ggtAmount,
        uint256 gasAllowance,
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
            gift.ggtAmount,
            gift.gasAllowance,
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
     * @dev Get gas balance for a specific gift
     */
    function getGasBalance(bytes32 giftId) external view returns (uint256) {
        return gasBalances[giftId];
    }
    
    /**
     * @dev Get total gas pool balance
     */
    function getTotalGasPool() external view returns (uint256) {
        return totalGasPool;
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
        // Withdraw GGT tokens
        uint256 ggtBalance = GGT_TOKEN.balanceOf(address(this));
        if (ggtBalance > 0) {
            GGT_TOKEN.safeTransfer(owner(), ggtBalance);
        }
        
        // Withdraw ETH (gas pool)
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            (bool success, ) = payable(owner()).call{value: ethBalance}("");
            require(success, "ETH withdrawal failed");
        }
    }
    
    /**
     * @dev Receive function to accept ETH for gas pool
     */
    receive() external payable {
        totalGasPool += msg.value;
    }
}