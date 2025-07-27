// Application configuration for GeoGift

export const APP_CONFIG = {
  name: 'GeoGift',
  description: 'Location-verified crypto gift card platform',
  version: '0.1.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    timeout: 10000,
    retries: 3,
  },

  // WebSocket Configuration
  websocket: {
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
    reconnectAttempts: 5,
    reconnectInterval: 5000,
  },

  // Blockchain Configuration
  blockchain: {
    defaultChainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111'),
    supportedChains: [11155111, 1], // Sepolia Testnet and Ethereum Mainnet
    contracts: {
      locationEscrow: {
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        abi: [], // Will be populated from artifacts
      },
    },
    rpcUrls: {
      1: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || '',
      11155111: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '',
    },
  },

  // Map Configuration
  maps: {
    mapbox: {
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
      style: 'mapbox://styles/mapbox/streets-v11',
      defaultCenter: {
        lat: 40.7831,
        lng: -73.9712,
      },
      defaultZoom: 12,
    },
    google: {
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    },
  },

  // Feature Flags
  features: {
    enableTestnet: process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true',
    enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
    enableAnalytics: process.env.NODE_ENV === 'production',
    enablePushNotifications: true,
    enableEmailNotifications: true,
  },

  // Location Configuration
  location: {
    defaultRadius: 50, // meters
    maxRadius: 1000, // meters
    minRadius: 1, // meters
    highAccuracyThreshold: 10, // meters
    locationTimeout: 10000, // milliseconds
    enableHighAccuracy: true,
  },

  // Gift Configuration
  gift: {
    minAmount: '0.001', // ETH
    maxAmount: '100', // ETH
    defaultExpiry: 30, // days
    maxExpiry: 365, // days
    minExpiry: 1, // days
    supportedCurrencies: ['ETH', 'MATIC', 'USDC'],
    defaultCurrency: 'ETH',
  },

  // UI Configuration
  ui: {
    theme: {
      default: 'light',
      storageKey: 'geogift-theme',
    },
    animations: {
      duration: 300,
      easing: 'ease-out',
      reducedMotion: false,
    },
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    },
  },

  // Storage Configuration
  storage: {
    keys: {
      userSettings: 'geogift-user-settings',
      walletConnection: 'geogift-wallet-connection',
      locationPermission: 'geogift-location-permission',
      theme: 'geogift-theme',
    },
  },

  // Security Configuration
  security: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    csrfProtection: true,
  },

  // Analytics Configuration
  analytics: {
    googleAnalytics: {
      measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
    },
    mixpanel: {
      token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '',
    },
  },

  // Error Handling
  errors: {
    retryAttempts: 3,
    retryDelay: 1000,
    reportErrors: process.env.NODE_ENV === 'production',
    logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  },

  // Performance
  performance: {
    enableServiceWorker: process.env.NODE_ENV === 'production',
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    imageOptimization: true,
    lazyLoading: true,
  },
};

// Environment-specific configurations
export const ENVIRONMENT = process.env.NODE_ENV || 'development';

export const isDevelopment = ENVIRONMENT === 'development';
export const isProduction = ENVIRONMENT === 'production';
export const isTest = ENVIRONMENT === 'test';

// Validation functions
export const validateConfig = () => {
  const requiredKeys = [
    'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN',
    'NEXT_PUBLIC_CONTRACT_ADDRESS',
  ];

  const missing = requiredKeys.filter(key => !process.env[key]);
  
  if (missing.length > 0 && isProduction) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return true;
};

// Helper functions
export const getChainConfig = (chainId: number) => {
  const { blockchain } = APP_CONFIG;
  return {
    chainId,
    rpcUrl: blockchain.rpcUrls[chainId as keyof typeof blockchain.rpcUrls],
    isTestnet: chainId === 11155111,
  };
};

export const getApiUrl = (endpoint: string) => {
  return `${APP_CONFIG.api.baseUrl}${endpoint}`;
};

export const getMapConfig = () => {
  return APP_CONFIG.maps.mapbox;
};

export const getContractConfig = (name: string) => {
  return APP_CONFIG.blockchain.contracts[name as keyof typeof APP_CONFIG.blockchain.contracts];
};

// Export type for configuration
export type AppConfig = typeof APP_CONFIG;