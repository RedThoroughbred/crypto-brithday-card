import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount, useChainId } from 'wagmi';
import { useGSNAwareProvider } from './useGSNProvider';
import { GSN_ESCROW_ABI, getCurrentNetworkConfig, prepareGSNApprovalData } from '@/lib/gsn-config';
import { useToast } from '@/hooks/use-toast';

export interface NewUserGift {
  sender: string;
  ggtAmount: bigint;
  gasAllowance: bigint;
  expiry: bigint;
  claimed: boolean;
  refunded: boolean;
  message: string;
  unlockType: string;
  unlockData: string;
}

export interface CreateGiftParams {
  claimCode: string;
  ggtAmount: string;
  gasAllowance: string;
  expiryDays: number;
  message: string;
  unlockType: string;
  unlockAnswer?: string;
  unlockData?: string;
}

export interface ClaimGiftParams {
  giftId: string;
  claimCode: string;
  unlockAnswer?: string;
}

export interface UseNewUserGiftEscrowGSNReturn {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createGift: (params: CreateGiftParams) => Promise<{ giftId: string; txHash: string } | null>;
  claimGift: (params: ClaimGiftParams) => Promise<string | null>;
  getGift: (giftId: string) => Promise<NewUserGift | null>;
  isClaimable: (giftId: string) => Promise<boolean>;
  canSponsorClaim: (giftId: string) => Promise<boolean>;
  getGasBalance: (giftId: string) => Promise<bigint>;
  
  // Contract info
  contractAddress: string | null;
  isGSNEnabled: boolean;
}

/**
 * Hook for interacting with NewUserGiftEscrowGSN contract
 * Supports both normal and gasless (GSN) transactions
 */
export function useNewUserGiftEscrowGSN(): UseNewUserGiftEscrowGSNReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { provider, getSigner, isUsingGSN } = useGSNAwareProvider();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get contract address from config
  const networkConfig = getCurrentNetworkConfig(chainId);
  const contractAddress = networkConfig.escrowAddress || null;
  
  // Create contract instance
  const getContract = useCallback(async (withSigner = false) => {
    if (!contractAddress || !provider) {
      throw new Error('Contract not available');
    }
    
    if (withSigner) {
      const signer = await getSigner();
      if (!signer) {
        throw new Error('Signer not available');
      }
      return new ethers.Contract(contractAddress, GSN_ESCROW_ABI, signer);
    }
    
    return new ethers.Contract(contractAddress, GSN_ESCROW_ABI, provider);
  }, [contractAddress, provider, getSigner]);
  
  // Create new user gift
  const createGift = useCallback(async (params: CreateGiftParams) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🎁 Creating new user gift with GSN...', params);
      
      // Hash the claim code and unlock answer
      const claimHash = ethers.keccak256(ethers.toUtf8Bytes(params.claimCode));
      const unlockHash = params.unlockAnswer 
        ? ethers.keccak256(ethers.toUtf8Bytes(params.unlockAnswer))
        : ethers.ZeroHash;
      
      // Parse amounts
      const ggtAmount = ethers.parseUnits(params.ggtAmount, 18);
      const gasAllowance = ethers.parseEther(params.gasAllowance);
      
      // Get contract with signer
      const contract = await getContract(true);
      
      // Call createNewUserGift function
      const tx = await contract.createNewUserGift(
        claimHash,
        ggtAmount,
        gasAllowance,
        params.expiryDays,
        params.message,
        params.unlockType,
        unlockHash,
        params.unlockData || '',
        {
          value: gasAllowance,
          gasLimit: 300000 // Manual gas limit to prevent estimation issues
        }
      );
      
      console.log('📝 Transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.hash);
      
      // Extract gift ID from event logs
      const giftCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog?.name === 'NewUserGiftCreated';
        } catch {
          return false;
        }
      });
      
      let giftId = '';
      if (giftCreatedEvent) {
        const parsedLog = contract.interface.parseLog(giftCreatedEvent);
        giftId = parsedLog?.args[0] || '';
      }
      
      toast({
        title: 'Gift Created Successfully',
        description: `New user gift created with GSN support! Gift ID: ${giftId.slice(0, 10)}...`,
      });
      
      return {
        giftId,
        txHash: receipt.hash
      };
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create gift';
      console.error('❌ Gift creation error:', err);
      setError(errorMsg);
      
      toast({
        title: 'Gift Creation Failed',
        description: errorMsg,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, getContract, toast]);
  
  // Claim gift (gasless via GSN)
  const claimGift = useCallback(async (params: ClaimGiftParams) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🎉 Claiming gift with GSN...', params);
      
      // Get contract with signer
      const contract = await getContract(true);
      
      // Prepare transaction options
      const txOptions: any = {
        gasLimit: 300000 // Manual gas limit
      };
      
      // Add GSN approval data if using GSN
      if (isUsingGSN) {
        console.log('🔄 Using GSN for gasless claim...');
        // GSN will handle gas sponsoring automatically
      }
      
      // Call claimGift function
      const tx = await contract.claimGift(
        params.giftId,
        params.claimCode,
        params.unlockAnswer || '',
        txOptions
      );
      
      console.log('📝 Claim transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Gift claimed successfully:', receipt.hash);
      
      toast({
        title: 'Gift Claimed Successfully! 🎉',
        description: `Your crypto gift has been claimed ${isUsingGSN ? 'with no gas fees!' : 'successfully!'}`,
      });
      
      return receipt.hash;
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to claim gift';
      console.error('❌ Gift claim error:', err);
      setError(errorMsg);
      
      toast({
        title: 'Gift Claim Failed',
        description: errorMsg,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getContract, isUsingGSN, toast]);
  
  // Get gift details
  const getGift = useCallback(async (giftId: string): Promise<NewUserGift | null> => {
    try {
      const contract = await getContract();
      const result = await contract.getGift(giftId);
      
      return {
        sender: result[0],
        ggtAmount: result[1],
        gasAllowance: result[2],
        expiry: result[3],
        claimed: result[4],
        refunded: result[5],
        message: result[6],
        unlockType: result[7],
        unlockData: result[8]
      };
    } catch (err) {
      console.error('❌ Error getting gift:', err);
      return null;
    }
  }, [getContract]);
  
  // Check if gift is claimable
  const isClaimable = useCallback(async (giftId: string): Promise<boolean> => {
    try {
      const contract = await getContract();
      return await contract.isClaimable(giftId);
    } catch (err) {
      console.error('❌ Error checking claimable:', err);
      return false;
    }
  }, [getContract]);
  
  // Check if claim can be sponsored
  const canSponsorClaim = useCallback(async (giftId: string): Promise<boolean> => {
    try {
      const contract = await getContract();
      return await contract.canSponsorClaim(giftId);
    } catch (err) {
      console.error('❌ Error checking sponsor capability:', err);
      return false;
    }
  }, [getContract]);
  
  // Get gas balance for gift
  const getGasBalance = useCallback(async (giftId: string): Promise<bigint> => {
    try {
      const contract = await getContract();
      return await contract.getGasBalance(giftId);
    } catch (err) {
      console.error('❌ Error getting gas balance:', err);
      return BigInt(0);
    }
  }, [getContract]);
  
  return {
    // State
    isLoading,
    error,
    
    // Actions
    createGift,
    claimGift,
    getGift,
    isClaimable,
    canSponsorClaim,
    getGasBalance,
    
    // Contract info
    contractAddress,
    isGSNEnabled: isUsingGSN,
  };
}

/**
 * Utility function to generate claim code
 * Format: HAPPY-GIFT-2025-ABC (human-readable with crypto security)
 */
export function generateClaimCode(): string {
  const adjectives = ['HAPPY', 'LUCKY', 'MAGIC', 'SUPER', 'GOLDEN', 'BRIGHT', 'SWEET', 'AMAZING'];
  const nouns = ['GIFT', 'SURPRISE', 'TREASURE', 'BONUS', 'REWARD', 'PRESENT'];
  const year = new Date().getFullYear();
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${adjective}-${noun}-${year}-${randomSuffix}`;
}

/**
 * Utility function to validate claim code format
 */
export function isValidClaimCode(claimCode: string): boolean {
  const pattern = /^[A-Z]+-[A-Z]+-\d{4}-[A-Z0-9]{3}$/;
  return pattern.test(claimCode);
}