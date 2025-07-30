/**
 * Authentication Hook for Web3 Wallet-Based Authentication
 * 
 * Handles authentication flow with the GeoGift backend using wallet signatures.
 * Provides automatic token management and API client authentication.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { chainAPI, dashboardAPI } from '@/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  walletAddress: string | null;
  token: string | null;
}

// In-memory token storage (you might want to use localStorage in production)
let authToken: string | null = null;

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    walletAddress: null,
    token: null,
  });

  // Authentication function
  const authenticate = useCallback(async () => {
    if (!address || !isConnected) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        error: 'Wallet not connected',
      }));
      return false;
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Step 1: Request challenge from backend
      console.log('Requesting authentication challenge for:', address);
      const challengeResponse = await fetch('http://localhost:8000/api/v1/auth/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: address,
        }),
      });

      if (!challengeResponse.ok) {
        throw new Error(`Challenge request failed: ${challengeResponse.status}`);
      }

      const challengeData = await challengeResponse.json();
      console.log('Received challenge:', challengeData);

      // Step 2: Sign the challenge message
      console.log('Signing challenge message...');
      const rawSignature = await signMessageAsync({
        message: challengeData.message,
      });
      
      // Ensure signature has 0x prefix (backend validation requires it)
      const signature = rawSignature.startsWith('0x') ? rawSignature : `0x${rawSignature}`;

      console.log('Message signed:', signature);

      // Step 3: Verify signature with backend
      const verifyResponse = await fetch('http://localhost:8000/api/v1/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: address,
          signature: signature,
          nonce: challengeData.nonce,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error(`Verification failed: ${verifyResponse.status}`);
      }

      const authData = await verifyResponse.json();
      console.log('Authentication successful:', authData);

      // Store token and update state
      authToken = authData.access_token;
      chainAPI.setAuthToken(authToken);
      dashboardAPI.setAuthToken(authToken);

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
        walletAddress: address,
        token: authToken,
      });

      return true;

    } catch (error) {
      console.error('Authentication failed:', error);
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
      return false;
    }
  }, [address, isConnected, signMessageAsync]);

  // Auto-authenticate when wallet connects (with retry prevention)
  useEffect(() => {
    // Don't auto-authenticate if there's an error (prevents infinite loop)
    if (isConnected && address && !authState.isAuthenticated && !authState.isLoading && !authState.error) {
      console.log('Wallet connected, starting authentication...');
      authenticate();
    } else if (!isConnected) {
      // Clear auth state when wallet disconnects
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        walletAddress: null,
        token: null,
      });
      authToken = null;
      chainAPI.setAuthToken(null);
      dashboardAPI.setAuthToken(null);
    }
  }, [isConnected, address, authState.isAuthenticated, authState.isLoading]); // Remove authState.error and authenticate from deps to prevent loops

  // Manual logout
  const logout = useCallback(() => {
    authToken = null;
    chainAPI.setAuthToken(null);
    dashboardAPI.setAuthToken(null);
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      walletAddress: null,
      token: null,
    });
  }, []);

  // Check if we need to authenticate (for API calls)
  const ensureAuthenticated = useCallback(async (): Promise<boolean> => {
    if (authState.isAuthenticated && authToken) {
      return true;
    }
    
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    return await authenticate();
  }, [authState.isAuthenticated, isConnected, address, authenticate]);

  return {
    ...authState,
    authenticate,
    logout,
    ensureAuthenticated,
  };
}

// Utility function to ensure authentication before API calls
export async function withAuth<T>(
  apiCall: () => Promise<T>,
  authHook?: ReturnType<typeof useAuth>
): Promise<T> {
  if (authHook) {
    const isAuthenticated = await authHook.ensureAuthenticated();
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }
  }
  
  return apiCall();
}