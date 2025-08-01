// Token configurations for GeoGift platform

export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}

// Your custom GGT token on Sepolia
export const GGT_TOKEN: TokenConfig = {
  address: '0x1775997EE682CCab7c6443168d63D2605922C633', // GeoGiftTestToken deployed contract
  symbol: 'GGT',
  name: 'GeoGiftTestToken',
  decimals: 18,
  icon: '🎁'
  // Note: Deployed by wallet 0x2Fa710B2A99Cdd9e314080B78B0F7bF78c126234
};

// Native ETH configuration
export const ETH_TOKEN: TokenConfig = {
  address: '0x0000000000000000000000000000000000000000', // Native ETH uses zero address
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  icon: 'Ξ'
};

// Supported tokens by network
export const SUPPORTED_TOKENS = {
  // Sepolia testnet
  11155111: {
    ETH: ETH_TOKEN,
    GGT: GGT_TOKEN
  },
  // Ethereum mainnet (future)
  1: {
    ETH: ETH_TOKEN,
    // Add mainnet GGT when deployed
  }
};

// ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol", 
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view", 
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;