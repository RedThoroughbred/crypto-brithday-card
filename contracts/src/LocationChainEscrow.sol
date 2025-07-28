// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LocationEscrow.sol";

/**
 * @title LocationChainEscrow
 * @dev Extension of LocationEscrow for multi-step gift chains
 * @author GeoGift Team
 * @notice Supports sequential location-based gift chains (e.g., proposals, treasure hunts)
 */
contract LocationChainEscrow is LocationEscrow {
    
    constructor(address payable _feeRecipient) LocationEscrow(_feeRecipient) {}
    
    // Chain-specific constants
    uint256 public constant MAX_CHAIN_LENGTH = 10; // Maximum steps in a chain
    uint256 public constant MIN_CHAIN_LENGTH = 2; // Minimum steps for a chain
    
    // Chain structure
    struct GiftChain {
        uint256 chainId;                // Unique chain identifier
        address payable giver;          // Chain creator
        address payable recipient;      // Chain recipient
        uint256 totalValue;             // Total value across all steps
        uint256 currentStep;            // Current step index (0-based)
        uint256 totalSteps;             // Total number of steps
        uint256 createdAt;              // Creation timestamp
        uint256 chainExpiryTime;        // Chain expiration (overrides individual steps)
        bool chainCompleted;            // True when all steps completed
        bool chainExpired;              // True if chain expired
        bytes32 chainMetadata;          // IPFS hash for chain story/theme
        string chainTitle;              // Title for the chain (e.g., "Proposal Journey")
    }
    
    // Chain step structure (extends Gift with chain context)
    struct ChainStep {
        uint256 chainId;                // Parent chain ID
        uint256 stepIndex;              // Step number in chain (0-based)
        uint256 giftId;                 // Reference to the Gift struct
        bytes32 stepMessage;            // Message/story for this step
        bytes32 stepMetadata;           // IPFS hash for step media (photos/videos)
        uint256 unlockTime;             // When this step becomes available
        bool isUnlocked;                // True if step is available to claim
        bool isCompleted;               // True if step has been claimed
        string stepTitle;               // Title for this step
    }
    
    // State variables
    uint256 public nextChainId = 1;
    uint256 public totalChainsCreated;
    
    // Storage mappings
    mapping(uint256 => GiftChain) public chains;
    mapping(uint256 => ChainStep[]) public chainSteps; // chainId => steps array
    mapping(address => uint256[]) public userChains;
    mapping(address => uint256[]) public recipientChains;
    mapping(uint256 => uint256) public giftToChain; // giftId => chainId
    
    // Events
    event ChainCreated(
        uint256 indexed chainId,
        address indexed giver,
        address indexed recipient,
        uint256 totalSteps,
        uint256 totalValue,
        string chainTitle
    );
    
    event ChainStepUnlocked(
        uint256 indexed chainId,
        uint256 indexed stepIndex,
        uint256 indexed giftId,
        string stepTitle
    );
    
    event ChainStepCompleted(
        uint256 indexed chainId,
        uint256 indexed stepIndex,
        uint256 indexed giftId,
        address recipient
    );
    
    event ChainCompleted(
        uint256 indexed chainId,
        address indexed recipient,
        uint256 totalValue,
        uint256 completedAt
    );
    
    event ChainExpired(
        uint256 indexed chainId,
        address indexed giver,
        uint256 refundedValue
    );
    
    // Errors (additional to parent contract)
    error ChainNotFound();
    error ChainAlreadyCompleted();
    error ChainExpiredError();
    error InvalidChainLength();
    error StepNotUnlocked();
    error StepAlreadyCompleted();
    error OnlyChainParticipant();
    error InvalidStepSequence();
    error InvalidExpiry();
    error InsufficientValue();
    
    /**
     * @dev Create a new gift chain with multiple location-based steps
     * @param recipient Address of the chain recipient
     * @param stepLocations Array of [latitude, longitude] pairs for each step
     * @param stepRadii Array of verification radii for each step
     * @param stepMessages Array of message hashes for each step
     * @param stepTitles Array of titles for each step
     * @param chainTitle Overall title for the chain
     * @param chainExpiryTime Expiration time for the entire chain
     * @param chainMetadata IPFS hash for chain story/media
     * @return chainId The created chain ID
     */
    function createGiftChain(
        address payable recipient,
        int256[2][] memory stepLocations,
        uint256[] memory stepRadii,
        bytes32[] memory stepMessages,
        string[] memory stepTitles,
        string memory chainTitle,
        uint256 chainExpiryTime,
        bytes32 chainMetadata
    ) external payable whenNotPaused nonReentrant returns (uint256 chainId) {
        
        uint256 stepCount = stepLocations.length;
        
        // Validation
        if (stepCount < MIN_CHAIN_LENGTH || stepCount > MAX_CHAIN_LENGTH) {
            revert InvalidChainLength();
        }
        
        if (stepRadii.length != stepCount || 
            stepMessages.length != stepCount || 
            stepTitles.length != stepCount) {
            revert InvalidStepSequence();
        }
        
        if (chainExpiryTime <= block.timestamp + MIN_EXPIRY || 
            chainExpiryTime > block.timestamp + MAX_EXPIRY) {
            revert InvalidExpiry();
        }
        
        if (msg.value == 0) {
            revert InsufficientValue();
        }
        
        // Create the chain
        chainId = nextChainId++;
        
        chains[chainId] = GiftChain({
            chainId: chainId,
            giver: payable(msg.sender),
            recipient: recipient,
            totalValue: msg.value,
            currentStep: 0,
            totalSteps: stepCount,
            createdAt: block.timestamp,
            chainExpiryTime: chainExpiryTime,
            chainCompleted: false,
            chainExpired: false,
            chainMetadata: chainMetadata,
            chainTitle: chainTitle
        });
        
        // Create individual gifts for each step
        uint256 valuePerStep = msg.value / stepCount;
        
        for (uint256 i = 0; i < stepCount; i++) {
            // Create the underlying gift
            uint256 giftId = _createStepGift(
                recipient,
                stepLocations[i][0], // latitude
                stepLocations[i][1], // longitude
                stepRadii[i],
                stepMessages[i],
                chainExpiryTime,
                valuePerStep
            );
            
            // Create the chain step
            ChainStep memory step = ChainStep({
                chainId: chainId,
                stepIndex: i,
                giftId: giftId,
                stepMessage: stepMessages[i],
                stepMetadata: bytes32(0), // Can be set later
                unlockTime: block.timestamp,
                isUnlocked: (i == 0), // Only first step unlocked initially
                isCompleted: false,
                stepTitle: stepTitles[i]
            });
            
            chainSteps[chainId].push(step);
            giftToChain[giftId] = chainId;
        }
        
        // Update state
        totalChainsCreated++;
        totalValueLocked += msg.value;
        userChains[msg.sender].push(chainId);
        recipientChains[recipient].push(chainId);
        
        emit ChainCreated(chainId, msg.sender, recipient, stepCount, msg.value, chainTitle);
        
        // Unlock first step
        emit ChainStepUnlocked(chainId, 0, chainSteps[chainId][0].giftId, stepTitles[0]);
    }
    
    /**
     * @dev Claim a step in a gift chain
     * @param chainId The chain ID
     * @param stepIndex The step index to claim
     * @param userLatitude User's current latitude
     * @param userLongitude User's current longitude
     * @param signature Optional signature for additional verification
     */
    function claimChainStep(
        uint256 chainId,
        uint256 stepIndex,
        int256 userLatitude,
        int256 userLongitude,
        bytes memory signature
    ) external whenNotPaused nonReentrant {
        
        GiftChain storage chain = chains[chainId];
        
        // Validation
        if (chain.giver == address(0)) {
            revert ChainNotFound();
        }
        
        if (chain.chainCompleted) {
            revert ChainAlreadyCompleted();
        }
        
        if (block.timestamp > chain.chainExpiryTime) {
            revert ChainExpiredError();
        }
        
        if (msg.sender != chain.recipient) {
            revert OnlyChainParticipant();
        }
        
        if (stepIndex >= chain.totalSteps) {
            revert InvalidStepSequence();
        }
        
        ChainStep storage step = chainSteps[chainId][stepIndex];
        
        if (!step.isUnlocked) {
            revert StepNotUnlocked();
        }
        
        if (step.isCompleted) {
            revert StepAlreadyCompleted();
        }
        
        // Manually claim the underlying gift (since parent function is external)
        uint256 giftId = step.giftId;
        Gift storage gift = gifts[giftId];
        
        // Basic validation (parent would do this too)
        if (!gift.exists) revert GiftNotFound();
        if (gift.claimed) revert GiftAlreadyClaimed();
        if (block.timestamp > gift.expiryTime) revert GiftExpiredError();
        if (gift.recipient != msg.sender) revert UnauthorizedClaimer();
        
        // Location verification
        uint256 distance = _calculateDistance(
            gift.targetLatitude,
            gift.targetLongitude,
            userLatitude,
            userLongitude
        );
        
        if (distance > gift.verificationRadius) {
            revert LocationVerificationFailed();
        }
        
        // Mark as claimed and transfer funds
        gift.claimed = true;
        gift.claimAttempts++;
        
        // Calculate amounts
        uint256 platformFee = (gift.amount * platformFeeRate) / 10000;
        uint256 recipientAmount = gift.amount - platformFee;
        
        // Transfer funds
        if (platformFee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: platformFee}("");
            if (!feeSuccess) revert TransferFailed();
        }
        
        (bool success, ) = gift.recipient.call{value: recipientAmount}("");
        if (!success) revert TransferFailed();
        
        // Update chain step
        step.isCompleted = true;
        chain.currentStep = stepIndex + 1;
        
        emit ChainStepCompleted(chainId, stepIndex, giftId, msg.sender);
        
        // Unlock next step if available
        if (stepIndex + 1 < chain.totalSteps) {
            ChainStep storage nextStep = chainSteps[chainId][stepIndex + 1];
            nextStep.isUnlocked = true;
            nextStep.unlockTime = block.timestamp;
            
            emit ChainStepUnlocked(
                chainId, 
                stepIndex + 1, 
                nextStep.giftId, 
                nextStep.stepTitle
            );
        }
        
        // Check if chain is completed
        if (chain.currentStep == chain.totalSteps) {
            chain.chainCompleted = true;
            emit ChainCompleted(chainId, msg.sender, chain.totalValue, block.timestamp);
        }
    }
    
    /**
     * @dev Get chain details
     */
    function getChain(uint256 chainId) external view returns (GiftChain memory) {
        return chains[chainId];
    }
    
    /**
     * @dev Get all steps for a chain
     */
    function getChainSteps(uint256 chainId) external view returns (ChainStep[] memory) {
        return chainSteps[chainId];
    }
    
    /**
     * @dev Get current unlocked step for a chain
     */
    function getCurrentStep(uint256 chainId) external view returns (ChainStep memory) {
        GiftChain memory chain = chains[chainId];
        if (chain.currentStep >= chain.totalSteps) {
            revert InvalidStepSequence();
        }
        return chainSteps[chainId][chain.currentStep];
    }
    
    /**
     * @dev Internal function to create a gift for a chain step
     */
    function _createStepGift(
        address payable recipient,
        int256 latitude,
        int256 longitude,
        uint256 radius,
        bytes32 clueHash,
        uint256 expiryTime,
        uint256 value
    ) internal returns (uint256 giftId) {
        
        giftId = nextGiftId++;
        
        gifts[giftId] = Gift({
            giver: payable(msg.sender),
            recipient: recipient,
            amount: value,
            targetLatitude: latitude,
            targetLongitude: longitude,
            verificationRadius: radius,
            clueHash: clueHash,
            createdAt: block.timestamp,
            expiryTime: expiryTime,
            claimed: false,
            exists: true,
            claimAttempts: 0,
            metadata: bytes32(0)
        });
        
        userGifts[msg.sender].push(giftId);
        recipientGifts[recipient].push(giftId);
        totalGiftsCreated++;
        
        emit GiftCreated(giftId, msg.sender, recipient, value, expiryTime);
        
        return giftId;
    }
}