import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { generateClaimCode, generateClaimHash, generateUnlockHash, prepareNewUserGiftParams, type NewUserGiftParams, type ClaimGiftParams } from '@/lib/newuser-gift';

// GGT Token contract address
const GGT_TOKEN_ADDRESS = '0x1775997EE682CCab7c6443168d63D2605922C633' as const;

// ERC20 ABI for GGT token approval
const ERC20_ABI = [
  {
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "owner", "type": "address"},
      {"name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract ABI for NewUserGiftEscrow
const NEW_USER_GIFT_ESCROW_ABI = [
  {
    "inputs": [
      {"name": "claimHash", "type": "bytes32"},
      {"name": "amount", "type": "uint256"},
      {"name": "expiryDays", "type": "uint256"},
      {"name": "message", "type": "string"},
      {"name": "unlockType", "type": "string"},
      {"name": "unlockHash", "type": "bytes32"},
      {"name": "unlockData", "type": "string"}
    ],
    "name": "createNewUserGift",
    "outputs": [],
    "stateMutability": "nonpayable",
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
      {"name": "amount", "type": "uint256"},
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
    "name": "refundExpiredGift",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "giftId", "type": "bytes32"},
      {"indexed": true, "name": "sender", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "expiry", "type": "uint256"},
      {"indexed": false, "name": "unlockType", "type": "string"}
    ],
    "name": "NewUserGiftCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "giftId", "type": "bytes32"},
      {"indexed": true, "name": "recipient", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "GiftClaimed",
    "type": "event"
  }
] as const;

const CONTRACT_ADDRESS = '0x9fAE6c354C7514d19Ad2029f7Adc534A31eac712' as const;

export function useNewUserGiftEscrow() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [createdGiftId, setCreatedGiftId] = useState<string | null>(null);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [giftCreationStep, setGiftCreationStep] = useState<'idle' | 'approving' | 'creating'>('idle');
  const [currentGiftParams, setCurrentGiftParams] = useState<any>(null);

  // Contract write operations for approval, gift creation, and claiming
  const { writeContract: writeApproval, data: approvalHash, isPending: isApprovalPending, error: approvalError } = useWriteContract();
  const { writeContract: writeGiftCreation, data: giftHash, isPending: isGiftPending, error: giftError } = useWriteContract();
  const { writeContract: writeClaim, data: claimHash, isPending: isClaimPending, error: claimError } = useWriteContract();
  
  // Transaction receipts
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess, data: approvalReceipt } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });
  const { isLoading: isGiftConfirming, isSuccess: isGiftSuccess, data: giftReceipt } = useWaitForTransactionReceipt({
    hash: giftHash,
  });
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess, data: claimReceipt } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  /**
   * Create a new user gift (with automatic GGT approval)
   */
  const createNewUserGift = async (params: Omit<NewUserGiftParams, 'claimCode'>) => {
    try {
      setIsCreating(true);
      setGiftCreationStep('approving');
      
      // Generate claim code
      const generatedClaimCode = generateClaimCode();
      setClaimCode(generatedClaimCode);
      
      // Prepare contract parameters
      const contractParams = prepareNewUserGiftParams({
        ...params,
        claimCode: generatedClaimCode
      });
      
      // Store params for use after approval
      setCurrentGiftParams(contractParams);
      
      console.log('Step 1: Approving GGT tokens...');
      console.log('Amount to approve:', contractParams.amount.toString());
      
      toast({
        title: 'Approving GGT tokens...',
        description: 'Please confirm the token approval in your wallet',
      });
      
      // Step 1: Approve GGT tokens
      await writeApproval({
        address: GGT_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, contractParams.amount],
      });
      
    } catch (error) {
      console.error('Failed to start gift creation:', error);
      toast({
        title: 'Failed to create gift',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      setIsCreating(false);
      setGiftCreationStep('idle');
    }
  };

  /**
   * Claim a gift with claim code
   */
  const claimGift = async (params: ClaimGiftParams) => {
    try {
      setIsClaiming(true);
      
      console.log('Claiming gift with params:', params);
      
      await writeClaim({
        address: CONTRACT_ADDRESS,
        abi: NEW_USER_GIFT_ESCROW_ABI,
        functionName: 'claimGift',
        args: [
          params.giftId as `0x${string}`,
          params.claimCode,
          params.unlockAnswer || ''
        ],
        gas: 300000n, // Set reasonable gas limit to prevent over-estimation
      });
      
    } catch (error) {
      console.error('Failed to claim gift:', error);
      toast({
        title: 'Failed to claim gift',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      setIsClaiming(false);
    }
  };

  /**
   * Get gift details
   */
  const useGiftDetails = (giftId: string | null) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: NEW_USER_GIFT_ESCROW_ABI,
      functionName: 'getGift',
      args: giftId ? [giftId as `0x${string}`] : undefined,
      query: {
        enabled: !!giftId,
      },
    });
  };

  /**
   * Check if gift is claimable
   */
  const useIsClaimable = (giftId: string | null) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: NEW_USER_GIFT_ESCROW_ABI,
      functionName: 'isClaimable',
      args: giftId ? [giftId as `0x${string}`] : undefined,
      query: {
        enabled: !!giftId,
      },
    });
  };

  // Handle GGT approval completion and proceed to gift creation
  React.useEffect(() => {
    if (isApprovalSuccess && giftCreationStep === 'approving' && currentGiftParams) {
      const proceedWithGiftCreation = async () => {
        try {
          console.log('✅ GGT approval confirmed! Creating gift...');
          setGiftCreationStep('creating');
          
          toast({
            title: 'Approval confirmed!',
            description: 'Now creating your gift...',
          });

          await writeGiftCreation({
            address: CONTRACT_ADDRESS,
            abi: NEW_USER_GIFT_ESCROW_ABI,
            functionName: 'createNewUserGift',
            args: [
              currentGiftParams.claimHash,
              currentGiftParams.amount,
              BigInt(currentGiftParams.expiryDays),
              currentGiftParams.message,
              currentGiftParams.unlockType,
              currentGiftParams.unlockHash,
              currentGiftParams.unlockData
            ],
          });
        } catch (error) {
          console.error('Failed to create gift after approval:', error);
          toast({
            title: 'Failed to create gift',
            description: 'Approval succeeded but gift creation failed',
            variant: 'destructive',
          });
          setIsCreating(false);
          setGiftCreationStep('idle');
        }
      };

      proceedWithGiftCreation();
    }
  }, [isApprovalSuccess, giftCreationStep, currentGiftParams, writeGiftCreation, toast]);

  // Handle gift creation success
  React.useEffect(() => {
    if (isGiftSuccess && giftCreationStep === 'creating' && giftReceipt) {
      console.log('✅ Gift creation confirmed! Setting success state...');
      console.log('Transaction receipt:', giftReceipt);
      console.log('Transaction logs:', giftReceipt.logs);
      
      setIsCreating(false);
      setGiftCreationStep('idle');
      
      // Try to extract the real gift ID from transaction logs
      let extractedGiftId = null;
      
      try {
        // Look for NewUserGiftCreated event
        const giftCreatedLog = giftReceipt.logs.find(log => 
          log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() &&
          log.topics.length > 0
        );
        
        if (giftCreatedLog && giftCreatedLog.topics[1]) {
          extractedGiftId = giftCreatedLog.topics[1]; // Gift ID is first indexed parameter
          console.log('📍 Extracted real gift ID:', extractedGiftId);
        }
      } catch (error) {
        console.warn('Failed to extract gift ID from logs:', error);
      }
      
      // Use extracted ID if available, otherwise use a temporary one
      const giftId = extractedGiftId || `0x${Date.now().toString(16).padStart(64, '0')}`;
      setCreatedGiftId(giftId);
      
      toast({
        title: 'New User Gift Created!',
        description: 'Your gift has been created and is ready to share.',
      });
    }
  }, [isGiftSuccess, giftCreationStep, giftReceipt, toast]);

  // Handle errors
  React.useEffect(() => {
    if (approvalError && giftCreationStep === 'approving') {
      console.error('❌ Approval error:', approvalError);
      setIsCreating(false);
      setGiftCreationStep('idle');
    }
    
    if (giftError && giftCreationStep === 'creating') {
      console.error('❌ Gift creation error:', giftError);
      setIsCreating(false);
      setGiftCreationStep('idle');
    }
    
    if (claimError && isClaiming) {
      console.error('❌ Claim error:', claimError);
      setIsClaiming(false);
    }
  }, [approvalError, giftError, claimError, giftCreationStep, isClaiming]);

  // Handle claiming success
  React.useEffect(() => {
    if (isClaimSuccess && isClaiming) {
      console.log('✅ Gift claimed successfully!');
      setIsClaiming(false);
      
      toast({
        title: 'Gift Claimed Successfully!',
        description: 'The GGT tokens have been transferred to your wallet.',
      });
    }
  }, [isClaimSuccess, isClaiming, toast]);

  return {
    // Actions
    createNewUserGift,
    claimGift,
    
    // State
    isCreating: isCreating || isApprovalPending || isApprovalConfirming || isGiftPending || isGiftConfirming,
    isClaiming: isClaiming || isClaimPending || isClaimConfirming,
    createdGiftId,
    claimCode,
    giftCreationStep,
    
    // Transaction data
    approvalHash,
    giftHash,
    claimHash,
    approvalReceipt,
    giftReceipt,
    claimReceipt,
    createError: approvalError || giftError,
    claimError,
    
    // Queries
    useGiftDetails,
    useIsClaimable,
    
    // Contract info
    contractAddress: CONTRACT_ADDRESS,
  };
}