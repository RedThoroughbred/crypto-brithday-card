// Custom hook for LocationEscrow contract interactions
import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, Hash } from 'viem';
import { 
  LOCATION_ESCROW_ADDRESS, 
  LOCATION_ESCROW_ABI,
  createClueHash,
  createMetadataHash,
  coordinateToContract,
  calculateExpiryTime
} from '@/lib/contracts';

export interface CreateGiftParams {
  recipientAddress: string;
  amount: string; // ETH amount as string
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
      const giftAmount = parseEther(params.amount);

      console.log('Creating gift with params:', {
        recipient: params.recipientAddress,
        latitude: contractLat.toString(),
        longitude: contractLon.toString(),
        radius: params.radius,
        clueHash,
        expiryTime: expiryTime.toString(),
        metadata,
        value: giftAmount.toString(),
      });

      // Call the smart contract
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

      console.log('Gift creation transaction sent');
    } catch (error: any) {
      console.error('Error creating gift:', error);
      setCreateError(error.message || 'Failed to create gift');
      setIsCreating(false);
    }
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
    useGiftDetails,
    
    // Reset functions
    resetCreateState: () => {
      setCreateError(null);
      setCreatedGiftId(null);
    },
  };
}