import { GSNConfig } from '@opengsn/provider';

// GSN Configuration for different networks
export const GSN_CONTRACTS = {
  sepolia: {
    escrowAddress: '0x8284ab51a3221c7b295f949512B43DA1EB0Cd44f', // SimpleRelayEscrow - GASLESS READY!
    paymasterAddress: '', // Using simple relay system instead
    trustedForwarder: '0xB2b5841DBeF766d4b521221732F9B618fCf34166', // GSN v3 Sepolia (placeholder)
    relayHubAddress: '0x3232f21A6E08312654270c78A773f00dd61d60f5', // GSN v3 Sepolia (placeholder)
  },
  mainnet: {
    escrowAddress: '', // Will be filled when ready for mainnet
    paymasterAddress: '', // Will be filled when ready for mainnet
    trustedForwarder: '0xAa3E82b4c4093b4bA13Cb5714382C99ADBf750cA', // GSN v3 Mainnet
    relayHubAddress: '0x40bE3f9D43DbdadE162F04CC97A29603D88F50E4', // GSN v3 Mainnet
  }
} as const;

// Current network configuration (will be set dynamically)
export const getCurrentNetworkConfig = (chainId: number) => {
  switch (chainId) {
    case 11155111: // Sepolia
      return GSN_CONTRACTS.sepolia;
    case 1: // Mainnet
      return GSN_CONTRACTS.mainnet;
    default:
      return GSN_CONTRACTS.sepolia; // Default to Sepolia for testing
  }
};

// GSN Provider Configuration
export const createGSNConfig = (chainId: number): Partial<GSNConfig> => {
  const networkConfig = getCurrentNetworkConfig(chainId);
  
  return {
    paymasterAddress: networkConfig.paymasterAddress,
    forwarderAddress: networkConfig.trustedForwarder,
    loggerConfiguration: {
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
    },
    relayLookupWindowBlocks: 60000,
    methodSuffix: '_v4',
    jsonStringifyRequest: true,
    chainId: chainId,
    relayHubAddress: networkConfig.relayHubAddress,
    // Optional: specify relay server URLs
    preferredRelays: [
      // Will use public GSN relayers by default
      // Can add custom relay URLs here if needed
    ],
    blacklistedRelays: [
      // Add any problematic relay URLs here
    ],
    relayTimeoutGrace: 1800, // 30 minutes
    sliceSize: 3, // Number of relays to query simultaneously
    gasPriceFactorPercent: 120, // Add 20% to gas price for reliability
    minGasPrice: 1e9, // 1 gwei minimum
    maxGasPrice: 100e9, // 100 gwei maximum
  };
};

// Contract ABI for GSN-enabled escrow (minimal for frontend use)
export const GSN_ESCROW_ABI = [
  {
    "inputs": [
      {"name": "claimHash", "type": "bytes32"},
      {"name": "ggtAmount", "type": "uint256"},
      {"name": "gasAllowance", "type": "uint256"},
      {"name": "expiryDays", "type": "uint256"},
      {"name": "message", "type": "string"},
      {"name": "unlockType", "type": "string"},
      {"name": "unlockHash", "type": "bytes32"},
      {"name": "unlockData", "type": "string"}
    ],
    "name": "createNewUserGift",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "giftId", "type": "bytes32"},
      {"name": "claimCode", "type": "string"},
      {"name": "unlockAnswer", "type": "string"}
    ],
    "name": "claimGift",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "giftId", "type": "bytes32"}],
    "name": "getGift",
    "outputs": [
      {"name": "sender", "type": "address"},
      {"name": "ggtAmount", "type": "uint256"},
      {"name": "gasAllowance", "type": "uint256"},
      {"name": "expiry", "type": "uint256"},
      {"name": "claimed", "type": "bool"},
      {"name": "refunded", "type": "bool"},
      {"name": "message", "type": "string"},
      {"name": "unlockType", "type": "string"},
      {"name": "unlockData", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "giftId", "type": "bytes32"}],
    "name": "isClaimable",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "giftId", "type": "bytes32"}],
    "name": "canSponsorClaim",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Helper function to check if GSN is available for current network
export const isGSNAvailable = (chainId: number): boolean => {
  const config = getCurrentNetworkConfig(chainId);
  // For now, GSN is "available" if we have an escrow address (simplified version)
  // In full GSN implementation, we'd also check for paymaster
  return !!config.escrowAddress;
};

// Helper function to format GSN transaction for approval data
export const prepareGSNApprovalData = (giftId: string): string => {
  // GSN approval data should contain the gift ID for paymaster validation
  return giftId;
};

// Relay wallet configuration
export const RELAY_WALLETS = {
  sepolia: {
    mainWallet: '0x2Fa710B2A99Cdd9e314080B78B0F7bF78c126234',      // Wallet 1 - Gift creator
    relayWallet: '0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F',      // Wallet 2 - Gas sponsor
    testRecipient: '0x34658EE37146f125C39D12b6f586efD363AA1002',   // Wallet 3 - No ETH test
  }
} as const;

// Environment variables for GSN configuration
export const GSN_ENV = {
  enableGSN: process.env.NEXT_PUBLIC_ENABLE_GSN === 'true' || true, // Enable for testing
  gsnDebug: process.env.NODE_ENV === 'development',
  customRelayUrl: process.env.NEXT_PUBLIC_CUSTOM_RELAY_URL,
  useSimpleRelay: true, // Use our simple relay system instead of full GSN
} as const;