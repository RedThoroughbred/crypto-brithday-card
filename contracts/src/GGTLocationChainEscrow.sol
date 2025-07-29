// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Simplified ERC20 interface
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title GGTLocationChainEscrow
 * @dev Multi-step location-verified gift chains using GGT tokens
 * Combines GGT token support with multi-step chain functionality
 */
contract GGTLocationChainEscrow {
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
    
    // Chain-specific constants
    uint256 public constant MAX_CHAIN_LENGTH = 10;
    uint256 public constant MIN_CHAIN_LENGTH = 2;
    
    // Unlock types for enhanced functionality
    enum UnlockType {
        GPS,        // Location-based (default)
        VIDEO,      // Upload video proof
        IMAGE,      // Upload image proof  
        MARKDOWN,   // Read content and answer question
        QUIZ,       // Multiple choice questions
        PASSWORD,   // Enter secret code
        URL         // Visit specific URL and get code
    }
    
    // Chain structure
    struct GiftChain {
        uint256 chainId;                // Unique chain identifier
        address payable giver;          // Chain creator
        address payable recipient;      // Chain recipient
        uint256 totalValue;             // Total GGT value across all steps
        uint256 currentStep;            // Current step index (0-based)
        uint256 totalSteps;             // Total number of steps
        uint256 createdAt;              // Creation timestamp
        uint256 chainExpiryTime;        // Chain expiration
        bool chainCompleted;            // True when all steps completed
        bool chainExpired;              // True if chain expired
        string chainTitle;              // Title for the chain
        bytes32 chainMetadata;          // Additional chain data hash
    }
    
    // Chain step structure
    struct ChainStep {
        uint256 chainId;                // Parent chain ID
        uint256 stepIndex;              // Step number in chain (0-based)
        uint256 stepValue;              // GGT value for this step
        int256 latitude;                // Target latitude (scaled by 1e6)
        int256 longitude;               // Target longitude (scaled by 1e6)
        uint256 radius;                 // Acceptable radius in meters
        UnlockType unlockType;          // How to unlock this step
        bytes32 unlockData;             // Type-specific unlock data
        bytes32 stepMessage;            // Message/clue for this step
        bytes32 stepMetadata;           // Additional step data hash
        uint256 unlockTime;             // When this step becomes available
        bool isUnlocked;                // True if step is available to claim
        bool isCompleted;               // True if step has been claimed
        string stepTitle;               // Title for this step
        uint256 claimAttempts;          // Number of claim attempts
    }

    // State variables
    uint256 public nextChainId = 1;
    uint256 public totalChainsCreated;
    uint256 public totalChainsCompleted;
    uint256 public totalValueLocked;

    // Mappings
    mapping(uint256 => GiftChain) public chains;
    mapping(uint256 => mapping(uint256 => ChainStep)) public chainSteps; // chainId => stepIndex => step
    mapping(uint256 => uint256[]) public chainStepIds; // chainId => stepIndex array

    // Events
    event ChainCreated(
        uint256 indexed chainId,
        address indexed giver,
        address indexed recipient,
        uint256 totalSteps,
        uint256 totalValue,
        string chainTitle
    );

    event StepUnlocked(
        uint256 indexed chainId,
        uint256 indexed stepIndex,
        address indexed recipient
    );

    event StepCompleted(
        uint256 indexed chainId,
        uint256 indexed stepIndex,
        address indexed claimer,
        uint256 stepValue
    );

    event ChainCompleted(
        uint256 indexed chainId,
        address indexed recipient,
        uint256 totalValue
    );

    // Errors
    error InvalidChainLength();
    error InvalidStepData();
    error ChainNotFound();
    error StepNotFound();
    error StepNotUnlocked();
    error StepAlreadyCompleted();
    error NotChainRecipient();
    error ChainExpired();
    error InsufficientAllowance();
    error TransferFailed();
    error LocationTooFarAway();

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
     * @dev Create a new multi-step gift chain
     * @param recipient Address that can claim the chain
     * @param stepValues Array of GGT values for each step
     * @param stepLocations Array of [lat, lon] coordinates (scaled by 1e6)
     * @param stepRadii Array of acceptable radii in meters
     * @param stepUnlockTypes Array of unlock types for each step
     * @param stepMessages Array of message hashes for each step
     * @param stepTitles Array of titles for each step
     * @param chainTitle Title for the entire chain
     * @param chainExpiryTime Unix timestamp when chain expires
     * @param chainMetadata Additional chain metadata hash
     * @return chainId The ID of the created chain
     */
    function createGiftChain(
        address payable recipient,
        uint256[] memory stepValues,
        int256[2][] memory stepLocations,
        uint256[] memory stepRadii,
        UnlockType[] memory stepUnlockTypes,
        bytes32[] memory stepMessages,
        string[] memory stepTitles,
        string memory chainTitle,
        uint256 chainExpiryTime,
        bytes32 chainMetadata
    ) external nonReentrant whenNotPaused returns (uint256 chainId) {
        require(recipient != address(0), "Invalid recipient");
        require(stepValues.length >= MIN_CHAIN_LENGTH, "Chain too short");
        require(stepValues.length <= MAX_CHAIN_LENGTH, "Chain too long");
        require(stepValues.length == stepLocations.length, "Array length mismatch");
        require(stepValues.length == stepRadii.length, "Array length mismatch");
        require(stepValues.length == stepUnlockTypes.length, "Array length mismatch");
        require(stepValues.length == stepMessages.length, "Array length mismatch");
        require(stepValues.length == stepTitles.length, "Array length mismatch");
        require(chainExpiryTime > block.timestamp, "Expiry time must be in future");

        // Calculate total value
        uint256 totalValue = 0;
        for (uint256 i = 0; i < stepValues.length; i++) {
            require(stepValues[i] > 0, "Step value must be greater than 0");
            require(stepRadii[i] > 0 && stepRadii[i] <= 10000, "Invalid radius");
            totalValue += stepValues[i];
        }

        // Check allowance and transfer tokens
        uint256 allowance = ggtToken.allowance(msg.sender, address(this));
        require(allowance >= totalValue, "Insufficient allowance");
        require(ggtToken.transferFrom(msg.sender, address(this), totalValue), "Transfer failed");

        // Create the chain
        chainId = nextChainId++;
        chains[chainId] = GiftChain({
            chainId: chainId,
            giver: payable(msg.sender),
            recipient: recipient,
            totalValue: totalValue,
            currentStep: 0,
            totalSteps: stepValues.length,
            createdAt: block.timestamp,
            chainExpiryTime: chainExpiryTime,
            chainCompleted: false,
            chainExpired: false,
            chainTitle: chainTitle,
            chainMetadata: chainMetadata
        });

        // Create chain steps
        for (uint256 i = 0; i < stepValues.length; i++) {
            chainSteps[chainId][i] = ChainStep({
                chainId: chainId,
                stepIndex: i,
                stepValue: stepValues[i],
                latitude: stepLocations[i][0],
                longitude: stepLocations[i][1],
                radius: stepRadii[i],
                unlockType: stepUnlockTypes[i],
                unlockData: bytes32(0), // For future use
                stepMessage: stepMessages[i],
                stepMetadata: bytes32(0), // For future use
                unlockTime: block.timestamp,
                isUnlocked: i == 0, // First step is always unlocked
                isCompleted: false,
                stepTitle: stepTitles[i],
                claimAttempts: 0
            });
        }

        // Update stats
        totalChainsCreated++;
        totalValueLocked += totalValue;

        emit ChainCreated(chainId, msg.sender, recipient, stepValues.length, totalValue, chainTitle);
    }

    /**
     * @dev Claim a step in the gift chain
     * @param chainId ID of the chain
     * @param stepIndex Index of the step to claim
     * @param userLatitude User's current latitude (scaled by 1e6)
     * @param userLongitude User's current longitude (scaled by 1e6)
     * @param unlockProof Additional proof data for non-GPS unlock types
     */
    function claimStep(
        uint256 chainId,
        uint256 stepIndex,
        int256 userLatitude,
        int256 userLongitude,
        bytes memory unlockProof
    ) external nonReentrant whenNotPaused {
        GiftChain storage chain = chains[chainId];
        require(chain.chainId != 0, "Chain not found");
        require(!chain.chainCompleted, "Chain already completed");
        require(!chain.chainExpired, "Chain has expired");
        require(block.timestamp <= chain.chainExpiryTime, "Chain has expired");
        require(msg.sender == chain.recipient, "Not chain recipient");
        require(stepIndex < chain.totalSteps, "Invalid step index");

        ChainStep storage step = chainSteps[chainId][stepIndex];
        require(step.isUnlocked, "Step not unlocked");
        require(!step.isCompleted, "Step already completed");
        require(stepIndex == chain.currentStep, "Must complete steps in order");

        // Increment claim attempts
        step.claimAttempts++;

        // Verify unlock condition based on type
        if (step.unlockType == UnlockType.GPS) {
            // GPS verification (existing logic)
            uint256 distance = calculateDistance(
                step.latitude,
                step.longitude,
                userLatitude,
                userLongitude
            );
            require(distance <= step.radius, "Location too far away");
        }
        // Other unlock types will be implemented later
        // For now, GPS is the only supported type

        // Mark step as completed
        step.isCompleted = true;
        chain.currentStep++;

        // Transfer step value to recipient
        require(ggtToken.transfer(chain.recipient, step.stepValue), "Transfer failed");
        totalValueLocked -= step.stepValue;

        emit StepCompleted(chainId, stepIndex, msg.sender, step.stepValue);

        // Check if chain is complete
        if (chain.currentStep >= chain.totalSteps) {
            chain.chainCompleted = true;
            totalChainsCompleted++;
            emit ChainCompleted(chainId, chain.recipient, chain.totalValue);
        } else {
            // Unlock next step
            chainSteps[chainId][chain.currentStep].isUnlocked = true;
            emit StepUnlocked(chainId, chain.currentStep, chain.recipient);
        }
    }

    /**
     * @dev Calculate distance between two coordinates (simplified)
     * Same as GGTLocationEscrow for consistency
     */
    function calculateDistance(
        int256 lat1,
        int256 lon1,
        int256 lat2,
        int256 lon2
    ) public pure returns (uint256 distance) {
        int256 deltaLat = lat1 - lat2;
        int256 deltaLon = lon1 - lon2;
        
        uint256 latDiffMeters = uint256(deltaLat < 0 ? -deltaLat : deltaLat) * 111;
        uint256 lonDiffMeters = uint256(deltaLon < 0 ? -deltaLon : deltaLon) * 111;
        
        distance = sqrt(latDiffMeters * latDiffMeters + lonDiffMeters * lonDiffMeters) / 1000;
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
     * @dev Get chain details
     */
    function getChain(uint256 chainId) external view returns (GiftChain memory) {
        require(chains[chainId].chainId != 0, "Chain not found");
        return chains[chainId];
    }

    /**
     * @dev Get step details
     */
    function getStep(uint256 chainId, uint256 stepIndex) external view returns (ChainStep memory) {
        require(chains[chainId].chainId != 0, "Chain not found");
        require(stepIndex < chains[chainId].totalSteps, "Invalid step index");
        return chainSteps[chainId][stepIndex];
    }

    /**
     * @dev Get all steps for a chain
     */
    function getChainSteps(uint256 chainId) external view returns (ChainStep[] memory) {
        require(chains[chainId].chainId != 0, "Chain not found");
        uint256 totalSteps = chains[chainId].totalSteps;
        ChainStep[] memory steps = new ChainStep[](totalSteps);
        
        for (uint256 i = 0; i < totalSteps; i++) {
            steps[i] = chainSteps[chainId][i];
        }
        
        return steps;
    }

    /**
     * @dev Emergency withdrawal after chain expiry (only chain giver)
     */
    function emergencyWithdrawChain(uint256 chainId) external nonReentrant {
        GiftChain storage chain = chains[chainId];
        require(chain.chainId != 0, "Chain not found");
        require(!chain.chainCompleted, "Chain already completed");
        require(msg.sender == chain.giver, "Not chain giver");
        require(block.timestamp > chain.chainExpiryTime, "Chain not expired");

        // Calculate remaining value
        uint256 remainingValue = 0;
        for (uint256 i = chain.currentStep; i < chain.totalSteps; i++) {
            if (!chainSteps[chainId][i].isCompleted) {
                remainingValue += chainSteps[chainId][i].stepValue;
            }
        }

        if (remainingValue > 0) {
            chain.chainExpired = true;
            totalValueLocked -= remainingValue;
            require(ggtToken.transfer(chain.giver, remainingValue), "Transfer failed");
        }
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
        uint256 chainsCreated,
        uint256 chainsCompleted,
        uint256 valueLocked,
        uint256 nextId
    ) {
        return (totalChainsCreated, totalChainsCompleted, totalValueLocked, nextChainId);
    }
}