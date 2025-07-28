// Custom hook for LocationEscrow contract interactions
import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, parseUnits, Hash } from 'viem';
import { 
  LOCATION_ESCROW_ADDRESS, 
  LOCATION_ESCROW_ABI,
  GGT_ESCROW_ADDRESS,
  GGT_ESCROW_ABI,
  createClueHash,
  createMetadataHash,
  coordinateToContract,
  calculateExpiryTime
} from '@/lib/contracts';
import { GGT_TOKEN, ERC20_ABI } from '@/lib/tokens';

export interface CreateGiftParams {
  recipientAddress: string;
  amount: string; // Token amount as string
  currency?: 'ETH' | 'GGT'; // Default to ETH for backward compatibility
  latitude: number;
  longitude: number;
  radius: number;
  clue: string;
  message: string;
  expiryDays: number;
}

export interface Gift {
  giver: string;
  recipient: string;
  amount: bigint;
  latitude: bigint;
  longitude: bigint;
  radius: number;
  clueHash: string;
  expiryTime: bigint;
  metadata: string;
  claimed: boolean;
  exists: boolean;
  claimAttempts: number;
  createdAt: bigint;
}

export function useLocationEscrow() {
  const { address } = useAccount();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdGiftId, setCreatedGiftId] = useState<number | null>(null);

  // Write contract hook for creating gifts
  const { writeContract, data: createTxHash } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: createTxHash,
  });

  // Function to create a new gift
  const createGift = async (params: CreateGiftParams) => {
    console.log('createGift called with params:', params);
    console.log('Wallet address:', address);
    
    if (!address) {
      setCreateError('Wallet not connected');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      // Convert parameters to contract format
      const contractLat = coordinateToContract(params.latitude);
      const contractLon = coordinateToContract(params.longitude);
      const clueHash = createClueHash(params.clue);
      const metadata = createMetadataHash(params.message);
      const expiryTime = calculateExpiryTime(params.expiryDays);

      if (params.currency === 'GGT') {
        // GGT Token Gift Flow
        console.log('Creating GGT token gift...');
        const giftAmount = parseUnits(params.amount, GGT_TOKEN.decimals);

        // First approve the GGT escrow contract to spend tokens
        console.log('Step 1: Approving GGT tokens...');
        await writeContract({
          address: GGT_TOKEN.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [GGT_ESCROW_ADDRESS, giftAmount],
        });

        // Wait for approval to complete before creating gift
        // Note: In production, you'd wait for the approval transaction to confirm
        // For now, we'll proceed immediately
        console.log('Step 2: Creating GGT gift...');
        await writeContract({
          address: GGT_ESCROW_ADDRESS,
          abi: GGT_ESCROW_ABI,
          functionName: 'createGift',
          args: [
            params.recipientAddress as `0x${string}`,
            contractLat,
            contractLon,
            BigInt(params.radius),
            clueHash,
            expiryTime,
            metadata,
            giftAmount,
          ],
        });

      } else {
        // ETH Gift Flow (existing)
        console.log('Creating ETH gift...');
        const giftAmount = parseEther(params.amount);

        await writeContract({
          address: LOCATION_ESCROW_ADDRESS,
          abi: LOCATION_ESCROW_ABI,
          functionName: 'createGift',
          args: [
            params.recipientAddress as `0x${string}`,
            contractLat,
            contractLon,
            BigInt(params.radius),
            clueHash,
            expiryTime,
            metadata,
          ],
          value: giftAmount,
        });
      }

      console.log('Gift creation transaction sent');
    } catch (error: any) {
      console.error('Error creating gift:', error);
      setCreateError(error.message || 'Failed to create gift');
      setIsCreating(false);
    }
  };

  // Function to claim a gift
  const claimGift = async (giftId: number, latitude: number, longitude: number) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const contractLat = coordinateToContract(latitude);
    const contractLon = coordinateToContract(longitude);

    console.log('Claiming gift:', { giftId, latitude, longitude });

    await writeContract({
      address: LOCATION_ESCROW_ADDRESS,
      abi: LOCATION_ESCROW_ABI,
      functionName: 'claimGift',
      args: [BigInt(giftId), contractLat, contractLon, '0x' as `0x${string}`],
    });
  };

  // Function to read gift details
  const useGiftDetails = (giftId: number) => {
    return useReadContract({
      address: LOCATION_ESCROW_ADDRESS,
      abi: LOCATION_ESCROW_ABI,
      functionName: 'gifts',
      args: [BigInt(giftId)],
    });
  };

  // Reset state when transaction is confirmed
  if (isTxSuccess && isCreating) {
    setIsCreating(false);
    // You might want to parse the transaction receipt to get the gift ID
    // For now, we'll set it to a placeholder
    if (!createdGiftId) {
      setCreatedGiftId(Date.now()); // Temporary - should parse from events
    }
  }

  return {
    // State
    isCreating: isCreating || isTxPending,
    createError,
    createdGiftId,
    createTxHash,
    isTxSuccess,
    
    // Functions
    createGift,
    claimGift,
    useGiftDetails,
    
    // Reset functions
    resetCreateState: () => {
      setCreateError(null);
      setCreatedGiftId(null);
    },
  };
}