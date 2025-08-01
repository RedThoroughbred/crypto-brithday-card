'use client';

import { useState } from 'react';
import { useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { formatEther, parseEther, keccak256, encodePacked } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { generateClaimCode, cleanClaimCodeInput } from '@/lib/newuser-gift';

// SimpleRelayEscrow contract ABI (proper relay contract for gasless)
const SIMPLE_RELAY_ESCROW_ABI = [
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
    "inputs": [
      {"name": "giftId", "type": "bytes32"},
      {"name": "recipient", "type": "address"},
      {"name": "claimCode", "type": "string"},
      {"name": "unlockAnswer", "type": "string"},
      {"name": "nonce", "type": "uint256"},
      {"name": "signature", "type": "bytes"}
    ],
    "name": "relayClaimGift",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "recipient", "type": "address"},
      {"name": "ggtAmount", "type": "uint256"},
      {"name": "gasAllowance", "type": "uint256"},
      {"name": "expiryDays", "type": "uint256"},
      {"name": "message", "type": "string"},
      {"name": "unlockType", "type": "string"},
      {"name": "unlockHash", "type": "bytes32"},
      {"name": "unlockData", "type": "string"}
    ],
    "name": "createDirectGift",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "giftId", "type": "bytes32"}
    ],
    "name": "getDirectGift",
    "outputs": [
      {"name": "sender", "type": "address"},
      {"name": "recipient", "type": "address"},
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
    "inputs": [
      {"name": "giftId", "type": "bytes32"},
      {"name": "recipient", "type": "address"},
      {"name": "unlockAnswer", "type": "string"},
      {"name": "nonce", "type": "uint256"}
    ],
    "name": "createDirectClaimSignature",
    "outputs": [{"name": "", "type": "bytes32"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "giftId", "type": "bytes32"},
      {"name": "recipient", "type": "address"},
      {"name": "unlockAnswer", "type": "string"},
      {"name": "nonce", "type": "uint256"},
      {"name": "signature", "type": "bytes"}
    ],
    "name": "relayClaimDirectGift",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "giftId", "type": "bytes32"}
    ],
    "name": "isDirectGiftClaimable",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "giftId", "type": "bytes32"}
    ],
    "name": "getDirectGiftNonce",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const SIMPLE_RELAY_ESCROW_ADDRESS = '0x0cbEf2Ceac48e08bc88D53f5Fe221E4448D95858' as const;

// GGT Token ABI (for approval)
const GGT_TOKEN_ABI = [
  {
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const GGT_TOKEN_ADDRESS = '0x1775997EE682CCab7c6443168d63D2605922C633' as const;

interface CreateGiftParams {
  amount: string;
  ethAmount: string;
  message: string;
  expiryDays: number;
  unlockType: string;
  unlockAnswer?: string;
  unlockData?: string;
}

interface CreateDirectGiftParams {
  recipientAddress: string;
  amount: string;
  ethAmount: string;
  message: string;
  expiryDays: number;
  unlockType: string;
  unlockAnswer?: string;
  unlockData?: string;
}

export function useSimpleRelayEscrow() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createdGiftId, setCreatedGiftId] = useState<string | null>(null);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Write contract hooks
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const createGift = async (params: CreateGiftParams) => {
    try {
      setIsCreating(true);
      setCreateError(null);
      setCreatedGiftId(null);
      setClaimCode(null);

      console.log('🎁 Creating gasless-compatible gift with SimpleRelayEscrow:', params);

      // Generate claim code
      const generatedClaimCode = generateClaimCode();
      console.log('📝 Generated claim code:', generatedClaimCode);

      // Create hashes using the same pattern as the working contract
      const claimHash = keccak256(encodePacked(['string'], [generatedClaimCode]));
      
      let unlockHash = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
      if (params.unlockAnswer && params.unlockAnswer.trim()) {
        unlockHash = keccak256(encodePacked(['string'], [params.unlockAnswer.trim()]));
      }

      const ggtAmount = parseEther(params.amount);
      const ethAmount = parseEther(params.ethAmount);

      console.log('🔑 Hashes created:', { claimHash, unlockHash });

      // Step 1: Approve GGT tokens
      toast({
        title: 'Step 1/2: Token Approval',
        description: 'Please approve GGT tokens in your wallet',
      });

      const approvalHash = await writeContractAsync({
        address: GGT_TOKEN_ADDRESS,
        abi: GGT_TOKEN_ABI,
        functionName: 'approve',
        args: [SIMPLE_RELAY_ESCROW_ADDRESS, ggtAmount],
        gas: BigInt(100000),
      });

      console.log('✅ Token approval transaction submitted:', approvalHash);

      // Step 2: Create gift
      toast({
        title: 'Step 2/2: Creating Gift',
        description: 'Please confirm gift creation in your wallet',
      });

      const giftCreationHash = await writeContractAsync({
        address: SIMPLE_RELAY_ESCROW_ADDRESS,
        abi: SIMPLE_RELAY_ESCROW_ABI,
        functionName: 'createNewUserGift',
        args: [
          claimHash,
          ggtAmount,
          ethAmount,
          BigInt(params.expiryDays),
          params.message,
          params.unlockType,
          unlockHash,
          params.unlockData || '',
        ],
        value: ethAmount, // Send ETH along with the transaction
        gas: BigInt(500000),
      });

      console.log('✅ Gift creation transaction submitted:', giftCreationHash);

      // Wait for transaction receipt to get the actual gift ID from contract logs
      console.log('⏳ Waiting for transaction receipt to extract gift ID...');
      const receipt = await publicClient?.waitForTransactionReceipt({ 
        hash: giftCreationHash 
      });
      
      // Check if transaction was successful
      if (receipt?.status === 'reverted') {
        throw new Error(`Gift creation transaction failed (reverted): ${giftCreationHash}`);
      }
      
      console.log('📋 Transaction receipt:', receipt);
      
      // Extract gift ID from NewUserGiftCreated event logs
      let actualGiftId = giftCreationHash; // Fallback to transaction hash
      
      if (receipt?.logs && receipt.logs.length > 0) {
        // Look for NewUserGiftCreated event logs from our contract
        for (const log of receipt.logs) {
          if (log.address?.toLowerCase() === SIMPLE_RELAY_ESCROW_ADDRESS.toLowerCase() && 
              log.topics && log.topics.length >= 2) {
            // The gift ID is likely the first indexed parameter (topics[1])
            // This is a common pattern for gift created events
            actualGiftId = log.topics[1] as `0x${string}`;
            console.log('🎯 Extracted actual gift ID from contract logs:', actualGiftId);
            break;
          }
        }
        
        if (actualGiftId === giftCreationHash) {
          console.log('⚠️ Could not find gift ID in logs, using transaction hash as fallback');
        }
      }
      
      const giftId = actualGiftId;
      console.log('🎉 Gift created successfully:', { giftId, claimCode: generatedClaimCode, transactionHash: giftCreationHash });

      setCreatedGiftId(giftId);
      setClaimCode(generatedClaimCode);

      toast({
        title: '🎉 Gasless Gift Created!',
        description: 'Your gasless-compatible gift has been created successfully',
      });

      return {
        giftId,
        claimCode: generatedClaimCode,
        transactionHash: giftCreationHash,
      };

    } catch (error: any) {
      console.error('❌ Gift creation failed:', error);
      const errorMessage = error?.reason || error?.message || 'Gift creation failed';
      setCreateError(errorMessage);
      
      toast({
        title: 'Gift Creation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const createDirectGift = async (params: CreateDirectGiftParams) => {
    try {
      setIsCreating(true);
      setCreateError(null);
      setCreatedGiftId(null);
      setClaimCode(null);

      console.log('🎁 Creating gasless direct gift with SimpleRelayEscrow:', params);

      // Create hashes using the same pattern as the working contract
      let unlockHash = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
      if (params.unlockAnswer && params.unlockAnswer.trim()) {
        unlockHash = keccak256(encodePacked(['string'], [params.unlockAnswer.trim()]));
      }

      const ggtAmount = parseEther(params.amount);
      const ethAmount = parseEther(params.ethAmount);

      console.log('🔑 Direct gift parameters:', { 
        recipient: params.recipientAddress,
        ggtAmount: ggtAmount.toString(),
        ethAmount: ethAmount.toString(),
        unlockHash 
      });

      // Step 1: Approve GGT tokens
      toast({
        title: 'Step 1/2: Token Approval',
        description: 'Please approve GGT tokens in your wallet',
      });

      const approvalHash = await writeContractAsync({
        address: GGT_TOKEN_ADDRESS,
        abi: GGT_TOKEN_ABI,
        functionName: 'approve',
        args: [SIMPLE_RELAY_ESCROW_ADDRESS, ggtAmount],
        gas: BigInt(100000),
      });

      console.log('✅ Token approval transaction submitted:', approvalHash);

      // Step 2: Create direct gift
      toast({
        title: 'Step 2/2: Creating Direct Gift',
        description: 'Please confirm gasless direct gift creation in your wallet',
      });

      const giftCreationHash = await writeContractAsync({
        address: SIMPLE_RELAY_ESCROW_ADDRESS,
        abi: SIMPLE_RELAY_ESCROW_ABI,
        functionName: 'createDirectGift',
        args: [
          params.recipientAddress as `0x${string}`,
          ggtAmount,
          ethAmount,
          BigInt(params.expiryDays),
          params.message,
          params.unlockType,
          unlockHash,
          params.unlockData || '',
        ],
        value: ethAmount, // Send ETH along with the transaction for gas allowance
        gas: BigInt(500000),
      });

      console.log('✅ Direct gift creation transaction submitted:', giftCreationHash);

      // Wait for transaction receipt to get the actual gift ID from contract logs
      console.log('⏳ Waiting for transaction receipt to extract gift ID...');
      const receipt = await publicClient?.waitForTransactionReceipt({ 
        hash: giftCreationHash 
      });
      
      // Check if transaction was successful
      if (receipt?.status === 'reverted') {
        throw new Error(`Direct gift creation transaction failed (reverted): ${giftCreationHash}`);
      }
      
      console.log('📋 Transaction receipt:', receipt);
      
      // Extract gift ID from DirectGiftCreated event logs
      let actualGiftId = giftCreationHash; // Fallback to transaction hash
      
      if (receipt?.logs && receipt.logs.length > 0) {
        // Look for DirectGiftCreated event logs from our contract
        for (const log of receipt.logs) {
          if (log.address?.toLowerCase() === SIMPLE_RELAY_ESCROW_ADDRESS.toLowerCase() && 
              log.topics && log.topics.length >= 2) {
            // The gift ID is likely the first indexed parameter (topics[1])
            actualGiftId = log.topics[1];
            console.log('🎯 Extracted actual gift ID from contract logs:', actualGiftId);
            break;
          }
        }
        
        if (actualGiftId === giftCreationHash) {
          console.log('⚠️ Could not find gift ID in logs, using transaction hash as fallback');
        }
      }
      
      const giftId = actualGiftId;
      console.log('🎉 Direct gift created successfully:', { giftId, recipient: params.recipientAddress, transactionHash: giftCreationHash });

      setCreatedGiftId(giftId);
      // Direct gifts don't have claim codes, so we set it to the recipient address for reference
      setClaimCode(params.recipientAddress);

      toast({
        title: '🎉 Gasless Direct Gift Created!',
        description: `Your gasless gift has been sent to ${params.recipientAddress}`,
      });

      return {
        giftId,
        recipient: params.recipientAddress,
        transactionHash: giftCreationHash,
      };

    } catch (error: any) {
      console.error('❌ Direct gift creation failed:', error);
      const errorMessage = error?.reason || error?.message || 'Direct gift creation failed';
      setCreateError(errorMessage);
      
      toast({
        title: 'Direct Gift Creation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // Hook to get gift details
  const useGiftDetails = (giftId: string | null) => {
    return useReadContract({
      address: SIMPLE_RELAY_ESCROW_ADDRESS,
      abi: SIMPLE_RELAY_ESCROW_ABI,
      functionName: 'getGift',
      args: giftId ? [giftId as `0x${string}`] : undefined,
      query: {
        enabled: !!giftId,
        staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      },
    });
  };

  // Hook to get direct gift details
  const useDirectGiftDetails = (giftId: string | null) => {
    return useReadContract({
      address: SIMPLE_RELAY_ESCROW_ADDRESS,
      abi: SIMPLE_RELAY_ESCROW_ABI,
      functionName: 'getDirectGift',
      args: giftId ? [giftId as `0x${string}`] : undefined,
      query: {
        enabled: !!giftId,
        staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      },
    });
  };

  return {
    createGift,
    createDirectGift,
    isCreating,
    createdGiftId,
    claimCode,
    createError,
    useGiftDetails,
    useDirectGiftDetails,
    contractAddress: SIMPLE_RELAY_ESCROW_ADDRESS,
  };
}