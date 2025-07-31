// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title SimpleRelayEscrow
 * @dev Simple relay system for gasless gift claiming using multiple wallets
 * Uses your 3 wallets: Creator, Relay, Recipient
 */
contract SimpleRelayEscrow is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    // GGT Token contract address on Sepolia
    IERC20 public constant GGT_TOKEN = IERC20(0x1775997EE682CCab7c6443168d63D2605922C633);
    
    struct NewUserGift {
        address sender;             // Address of gift creator (Wallet 1)
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
        string unlockData;          // Additional unlock data
        uint256 nonce;              // Nonce for replay protection
    }
    
    // Mapping from gift ID to gift data
    mapping(bytes32 => NewUserGift) public gifts;
    
    // Mapping to track if a claim code has been used
    mapping(bytes32 => bool) public claimHashUsed;
    
    // Mapping to track nonces for each gift (prevent replay attacks)
    mapping(bytes32 => uint256) public giftNonces;
    
    // Authorized relay wallets (your Wallet 2, 3, etc.)
    mapping(address => bool) public authorizedRelays;
    
    // Gas sponsoring balances per gift
    mapping(bytes32 => uint256) public gasBalances;
    
    // Total gas pool
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
        address indexed relayer,
        uint256 ggtAmount
    );
    
    event RelayAuthorized(address indexed relay, bool authorized);
    
    event GasSponsored(
        bytes32 indexed giftId,
        address indexed relayer,
        uint256 gasUsed,
        uint256 gasCost
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Authorize a relay wallet (your Wallet 2, 3, etc.)
     */
    function setRelayAuthorization(address relay, bool authorized) external onlyOwner {
        authorizedRelays[relay] = authorized;
        emit RelayAuthorized(relay, authorized);
    }
    
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
            unlockData: unlockData,
            nonce: 0
        });
        
        // Mark claim hash as used
        claimHashUsed[claimHash] = true;
        
        // Allocate gas funds for this gift
        gasBalances[giftId] = gasAllowance;
        totalGasPool += gasAllowance;
        
        emit NewUserGiftCreated(giftId, sender, ggtAmount, gasAllowance, expiry, unlockType);
    }
    
    /**
     * @dev Create claim signature (called by frontend for recipient)
     * This creates the signature that the relay will use to claim on behalf of recipient
     */
    function createClaimSignature(
        bytes32 giftId,
        address recipient,
        string memory claimCode,
        string memory unlockAnswer,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            giftId,
            recipient,
            claimCode,
            unlockAnswer,
            nonce
        ));
    }
    
    /**
     * @dev Relay claim gift - called by authorized relay (your Wallet 2)
     * The relay pays the gas, recipient gets the tokens
     */
    function relayClaimGift(
        bytes32 giftId,
        address recipient,
        string memory claimCode,
        string memory unlockAnswer,
        uint256 nonce,
        bytes memory signature
    ) external nonReentrant whenNotPaused {
        require(authorizedRelays[msg.sender], "Not authorized relay");
        
        NewUserGift storage gift = gifts[giftId];
        
        require(gift.sender != address(0), "Gift does not exist");
        require(!gift.claimed, "Gift already claimed");
        require(!gift.refunded, "Gift already refunded");
        require(block.timestamp <= gift.expiry, "Gift has expired");
        require(nonce == gift.nonce, "Invalid nonce");
        
        // Verify recipient's signature
        bytes32 messageHash = createClaimSignature(giftId, recipient, claimCode, unlockAnswer, nonce);
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == recipient, "Invalid signature");
        
        // Verify claim code
        bytes32 providedClaimHash = keccak256(abi.encodePacked(claimCode));
        require(providedClaimHash == gift.claimHash, "Invalid claim code");
        
        // Verify unlock challenge if required
        if (keccak256(abi.encodePacked(gift.unlockType)) != keccak256(abi.encodePacked("simple"))) {
            bytes32 providedUnlockHash = keccak256(abi.encodePacked(unlockAnswer));
            require(providedUnlockHash == gift.unlockHash, "Invalid unlock answer");
        }
        
        // Mark as claimed and increment nonce
        gift.claimed = true;
        gift.nonce++;
        
        // Transfer GGT tokens to recipient
        GGT_TOKEN.safeTransfer(recipient, gift.ggtAmount);
        
        // Sponsor gas cost from gift's allowance
        uint256 gasUsed = gasleft();
        uint256 gasCost = gasUsed * tx.gasprice;
        
        if (gasBalances[giftId] >= gasCost) {
            gasBalances[giftId] -= gasCost;
            totalGasPool -= gasCost;
            
            // Refund gas cost to relay
            (bool success, ) = payable(msg.sender).call{value: gasCost}("");
            if (success) {
                emit GasSponsored(giftId, msg.sender, gasUsed, gasCost);
            }
        }
        
        emit GiftClaimed(giftId, recipient, msg.sender, gift.ggtAmount);
    }
    
    /**
     * @dev Regular claim gift (fallback - recipient pays own gas)
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
        
        emit GiftClaimed(giftId, recipient, address(0), gift.ggtAmount);
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
     * @dev Get current nonce for a gift
     */
    function getGiftNonce(bytes32 giftId) external view returns (uint256) {
        return gifts[giftId].nonce;
    }
    
    /**
     * @dev Emergency functions
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 ggtBalance = GGT_TOKEN.balanceOf(address(this));
        if (ggtBalance > 0) {
            GGT_TOKEN.safeTransfer(owner(), ggtBalance);
        }
        
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            (bool success, ) = payable(owner()).call{value: ethBalance}("");
            require(success, "ETH withdrawal failed");
        }
    }
    
    receive() external payable {
        totalGasPool += msg.value;
    }
}