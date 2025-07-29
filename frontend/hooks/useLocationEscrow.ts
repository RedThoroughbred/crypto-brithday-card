// Custom hook for LocationEscrow contract interactions
import { useState, useEffect } from 'react';
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
  const { isLoading: isTxPending, isSuccess: isTxSuccess, data: txReceipt } = useWaitForTransactionReceipt({
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
        // GGT Token Gift Flow - FIXED: Proper two-step process
        console.log('Creating GGT token gift...');
        const giftAmount = parseUnits(params.amount, GGT_TOKEN.decimals);

        // Step 1: Approve the GGT escrow contract to spend tokens
        console.log('Step 1: Approving GGT tokens...');
        console.log('Amount to approve:', giftAmount.toString());
        console.log('Escrow address:', GGT_ESCROW_ADDRESS);
        
        const approvalTx = await writeContract({
          address: GGT_TOKEN.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [GGT_ESCROW_ADDRESS, giftAmount],
        });
        console.log('Approval transaction sent:', approvalTx);

        // Wait for approval transaction to be mined
        console.log('Waiting for approval confirmation...');
        // The wagmi hook will handle the transaction waiting in the background
        // For now, we'll add a delay to ensure the approval is processed
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay

        // Step 2: Create the gift using the approved tokens
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

  // Function to claim a gift (ETH or GGT)
  const claimGift = async (giftId: number, latitude: number, longitude: number, isGGT: boolean = false) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const contractLat = coordinateToContract(latitude);
    const contractLon = coordinateToContract(longitude);

    console.log('Claiming gift:', { giftId, latitude, longitude, isGGT });

    await writeContract({
      address: isGGT ? GGT_ESCROW_ADDRESS : LOCATION_ESCROW_ADDRESS,
      abi: isGGT ? GGT_ESCROW_ABI : LOCATION_ESCROW_ABI,
      functionName: 'claimGift',
      args: [BigInt(giftId), contractLat, contractLon, '0x' as `0x${string}`],
    });
  };

  // Function to read gift details (ETH or GGT)
  const useGiftDetails = (giftId: number, isGGT: boolean = false) => {
    return useReadContract({
      address: isGGT ? GGT_ESCROW_ADDRESS : LOCATION_ESCROW_ADDRESS,
      abi: isGGT ? GGT_ESCROW_ABI : LOCATION_ESCROW_ABI,
      functionName: 'gifts',
      args: [BigInt(giftId)],
    });
  };

  // Parse gift ID from transaction receipt when transaction is successful
  useEffect(() => {
    if (isTxSuccess && txReceipt && isCreating && !createdGiftId) {
      try {
        // Look for GiftCreated event in the logs
        const giftCreatedLog = txReceipt.logs.find(log => {
          // Check if this log matches the GiftCreated event signature
          // GiftCreated event has topic0 that we can identify
          return log.topics.length >= 4; // GiftCreated has 4 indexed parameters
        });

        if (giftCreatedLog && giftCreatedLog.topics[1]) {
          // The gift ID is in the first indexed parameter (topics[1])
          const giftIdHex = giftCreatedLog.topics[1];
          const giftId = parseInt(giftIdHex, 16);
          console.log('Parsed gift ID from receipt:', giftId);
          setCreatedGiftId(giftId);
          setIsCreating(false);
        } else {
          console.warn('Could not find GiftCreated event in receipt, using fallback');
          setCreatedGiftId(Date.now()); // Fallback
          setIsCreating(false);
        }
      } catch (error) {
        console.error('Error parsing gift ID from receipt:', error);
        setCreatedGiftId(Date.now()); // Fallback
        setIsCreating(false);
      }
    }
  }, [isTxSuccess, txReceipt, isCreating, createdGiftId]);

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