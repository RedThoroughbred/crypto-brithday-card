// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./NewUserGiftEscrowSimple.sol";

// Minimal GSN interfaces for our use case
interface IRelayHub {
    function balanceOf(address paymaster) external view returns (uint256);
    function depositFor(address paymaster) external payable;
    function withdraw(address payable recipient, uint256 amount) external;
}

// Simplified GSN types
struct RelayRequest {
    address from;
    address to;
    uint256 value;
    uint256 gas;
    uint256 gasPrice;
    bytes data;
    uint256 nonce;
    uint256 validUntilTime;
}

struct RelayData {
    uint256 gasPrice;
    uint256 pctRelayFee;
    uint256 baseRelayFee;
    address relayWorker;
    address paymaster;
    address forwarder;
    bytes paymasterData;
    uint256 clientId;
}

/**
 * @title SimpleGSNPaymaster
 * @dev Simplified paymaster for GeoGift that sponsors gas fees for gift claiming
 * This is a basic implementation that doesn't depend on external GSN libraries
 */
contract SimpleGSNPaymaster is Ownable {
    
    // GSN RelayHub contract
    IRelayHub public immutable relayHub;
    
    // Trusted forwarder address
    address public immutable trustedForwarder;
    
    // Reference to the GeoGift escrow contract
    NewUserGiftEscrowSimple public immutable geoGiftEscrow;
    
    // Maximum gas cost we're willing to sponsor per transaction
    uint256 public maxSponsoredGas = 300000;
    
    // Mapping to track sponsored transactions
    mapping(bytes32 => uint256) public sponsoredGas;
    
    // Events
    event TransactionSponsored(
        bytes32 indexed giftId,
        address indexed recipient,
        uint256 gasUsed,
        uint256 gasCost
    );
    
    event PaymasterFunded(
        address indexed funder,
        uint256 amount
    );
    
    modifier onlyRelayHub() {
        require(msg.sender == address(relayHub), "Only RelayHub can call this");
        _;
    }
    
    constructor(
        IRelayHub _relayHub,
        address _trustedForwarder,
        NewUserGiftEscrowSimple _geoGiftEscrow
    ) Ownable(msg.sender) {
        relayHub = _relayHub;
        trustedForwarder = _trustedForwarder;
        geoGiftEscrow = _geoGiftEscrow;
    }
    
    /**
     * @dev Called by RelayHub to validate if we want to sponsor this transaction
     */
    function preRelayedCall(
        RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    ) external onlyRelayHub returns (bytes memory context, bool revertOnRecipientRevert) {
        
        // Ensure transaction is going to our GeoGift contract
        require(relayRequest.to == address(geoGiftEscrow), "Only GeoGift transactions supported");
        
        // Check gas limit
        require(maxPossibleGas <= maxSponsoredGas, "Gas limit too high");
        
        // Extract gift ID from approval data
        require(approvalData.length == 32, "Invalid approval data");
        bytes32 giftId = abi.decode(approvalData, (bytes32));
        
        // Verify the gift exists and can be sponsored
        require(geoGiftEscrow.canSponsorClaim(giftId), "Gift cannot be sponsored");
        
        // Verify the gift is claimable
        require(geoGiftEscrow.isClaimable(giftId), "Gift is not claimable");
        
        // Check if we have enough balance in RelayHub
        require(
            relayHub.balanceOf(address(this)) >= maxPossibleGas * relayRequest.gasPrice,
            "Paymaster balance too low"
        );
        
        // Return context with gift ID for postRelayedCall
        return (abi.encode(giftId, relayRequest.from), false);
    }
    
    /**
     * @dev Called after the relayed transaction completes
     */
    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        RelayData calldata relayData
    ) external onlyRelayHub {
        
        // Decode context
        (bytes32 giftId, address recipient) = abi.decode(context, (bytes32, address));
        
        if (success) {
            // Calculate actual gas cost
            uint256 gasCost = (gasUseWithoutPost + 50000) * relayData.gasPrice; // Add buffer for postRelayedCall
            
            // Record sponsored transaction
            sponsoredGas[giftId] = gasCost;
            
            // Deduct gas cost from gift's allowance in the escrow contract
            try geoGiftEscrow.deductGasCost(giftId, gasCost) {
                emit TransactionSponsored(giftId, recipient, gasUseWithoutPost, gasCost);
            } catch {
                // If deduction fails, we've still sponsored the transaction
                emit TransactionSponsored(giftId, recipient, gasUseWithoutPost, gasCost);
            }
        }
    }
    
    /**
     * @dev Fund the paymaster with ETH for sponsoring transactions
     */
    function fundPaymaster() external payable {
        require(msg.value > 0, "Must send ETH to fund");
        
        // Deposit into RelayHub
        relayHub.depositFor{value: msg.value}(address(this));
        
        emit PaymasterFunded(msg.sender, msg.value);
    }
    
    /**
     * @dev Update maximum sponsored gas limit
     */
    function setMaxSponsoredGas(uint256 newMaxGas) external onlyOwner {
        require(newMaxGas > 100000 && newMaxGas <= 1000000, "Invalid gas limit");
        maxSponsoredGas = newMaxGas;
    }
    
    /**
     * @dev Get paymaster balance in RelayHub
     */
    function getPaymasterBalance() external view returns (uint256) {
        return relayHub.balanceOf(address(this));
    }
    
    /**
     * @dev Withdraw funds from RelayHub (owner only)
     */
    function withdrawFromRelayHub(uint256 amount, address payable recipient) external onlyOwner {
        relayHub.withdraw(recipient, amount);
    }
    
    /**
     * @dev Emergency withdrawal of all funds from RelayHub
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = relayHub.balanceOf(address(this));
        if (balance > 0) {
            relayHub.withdraw(payable(owner()), balance);
        }
    }
    
    /**
     * @dev Check if paymaster can sponsor a transaction with given gas cost
     */
    function canSponsorTransaction(uint256 maxGas, uint256 gasPrice) external view returns (bool) {
        uint256 requiredBalance = maxGas * gasPrice;
        return relayHub.balanceOf(address(this)) >= requiredBalance;
    }
    
    /**
     * @dev Receive function to accept ETH deposits
     */
    receive() external payable {
        if (msg.value > 0) {
            relayHub.depositFor{value: msg.value}(address(this));
            emit PaymasterFunded(msg.sender, msg.value);
        }
    }
    
    /**
     * @dev Return the version of the paymaster
     */
    function versionPaymaster() external pure returns (string memory) {
        return "3.0.0-beta.6+geogift.simple.paymaster";
    }
}