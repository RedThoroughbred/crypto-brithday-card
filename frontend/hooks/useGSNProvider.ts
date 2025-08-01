import { useState, useEffect, useCallback, useMemo } from 'react';
import { RelayProvider } from '@opengsn/provider';
import { ethers } from 'ethers';
import { useAccount, useChainId } from 'wagmi';
import { createGSNConfig, isGSNAvailable, GSN_ENV } from '@/lib/gsn-config';
import { useToast } from '@/hooks/use-toast';

export interface GSNProviderState {
  gsnProvider: ethers.BrowserProvider | null;
  isGSNEnabled: boolean;
  isGSNAvailable: boolean;
  isInitializing: boolean;
  error: string | null;
}

export interface UseGSNProviderReturn extends GSNProviderState {
  initializeGSN: () => Promise<void>;
  switchToGSN: () => Promise<void>;
  switchToNormal: () => void;
  refreshGSNProvider: () => Promise<void>;
}

/**
 * Hook for managing GSN (Gas Station Network) provider
 * Enables gasless transactions for gift claiming
 */
export function useGSNProvider(): UseGSNProviderReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();
  
  const [gsnProvider, setGsnProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isGSNEnabled, setIsGSNEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if GSN is available for current network
  const gsnAvailable = useMemo(() => {
    return GSN_ENV.enableGSN && isGSNAvailable(chainId);
  }, [chainId]);
  
  // Initialize GSN provider
  const initializeGSN = useCallback(async () => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }
    
    if (!gsnAvailable) {
      setError('GSN not available for current network');
      return;
    }
    
    try {
      setIsInitializing(true);
      setError(null);
      
      console.log('🚀 Initializing GSN provider...');
      
      // Get current provider from window.ethereum
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not available');
      }
      
      // Create GSN configuration
      const gsnConfig = createGSNConfig(chainId);
      console.log('GSN Config:', gsnConfig);
      
      // Initialize GSN RelayProvider
      const gsnRelayProvider = await RelayProvider.newWeb3Provider({
        provider: window.ethereum,
        config: gsnConfig
      });
      
      // Create ethers provider wrapper
      const ethersGSNProvider = new ethers.BrowserProvider(gsnRelayProvider.provider);
      
      // Test the provider by getting network info
      const network = await ethersGSNProvider.getNetwork();
      console.log('✅ GSN Provider initialized for network:', network.name);
      
      setGsnProvider(ethersGSNProvider);
      setIsGSNEnabled(true);
      
      toast({
        title: 'GSN Provider Ready',
        description: 'Gasless transactions are now available!',
      });
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize GSN';
      console.error('❌ GSN initialization error:', err);
      setError(errorMsg);
      
      toast({
        title: 'GSN Initialization Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  }, [isConnected, address, chainId, gsnAvailable, toast]);
  
  // Switch to GSN provider
  const switchToGSN = useCallback(async () => {
    if (gsnProvider) {
      setIsGSNEnabled(true);
      console.log('🔄 Switched to GSN provider');
    } else {
      await initializeGSN();
    }
  }, [gsnProvider, initializeGSN]);
  
  // Switch back to normal provider
  const switchToNormal = useCallback(() => {
    setIsGSNEnabled(false);
    console.log('🔄 Switched to normal provider');
  }, []);
  
  // Refresh GSN provider (useful for network changes)
  const refreshGSNProvider = useCallback(async () => {
    setGsnProvider(null);
    setIsGSNEnabled(false);
    setError(null);
    
    if (gsnAvailable) {
      await initializeGSN();
    }
  }, [gsnAvailable, initializeGSN]);
  
  // Auto-initialize GSN when wallet connects and GSN is available
  useEffect(() => {
    // Temporarily disabled GSN to fix performance issues
    console.log('🚫 GSN temporarily disabled for performance');
    // if (typeof window !== 'undefined' && isConnected && gsnAvailable && !gsnProvider && !isInitializing) {
    //   console.log('🔄 Auto-initializing GSN provider...');
    //   initializeGSN();
    // }
  }, [isConnected, gsnAvailable, gsnProvider, isInitializing, initializeGSN]);
  
  // Clean up when network changes
  useEffect(() => {
    if (gsnProvider) {
      console.log('🔄 Network changed, refreshing GSN provider...');
      refreshGSNProvider();
    }
  }, [chainId]); // Don't include refreshGSNProvider to avoid infinite loop
  
  // Clean up when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setGsnProvider(null);
      setIsGSNEnabled(false);
      setError(null);
    }
  }, [isConnected]);
  
  return {
    gsnProvider,
    isGSNEnabled,
    isGSNAvailable: gsnAvailable,
    isInitializing,
    error,
    initializeGSN,
    switchToGSN,
    switchToNormal,
    refreshGSNProvider,
  };
}

/**
 * Utility hook for GSN-aware contract interactions
 * Returns the appropriate provider (GSN or normal) and signer
 */
export function useGSNAwareProvider() {
  const { gsnProvider, isGSNEnabled } = useGSNProvider();
  
  const getProvider = useCallback((): ethers.BrowserProvider | null => {
    if (isGSNEnabled && gsnProvider) {
      return gsnProvider;
    }
    
    // Fallback to normal provider (only in browser environment)
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    
    return null;
  }, [isGSNEnabled, gsnProvider]);
  
  const getSigner = useCallback(async (): Promise<ethers.Signer | null> => {
    const provider = getProvider();
    if (!provider) return null;
    
    try {
      return await provider.getSigner();
    } catch (error) {
      console.error('Failed to get signer:', error);
      return null;
    }
  }, [getProvider]);
  
  return {
    provider: getProvider(),
    getSigner,
    isUsingGSN: isGSNEnabled && !!gsnProvider,
  };
}