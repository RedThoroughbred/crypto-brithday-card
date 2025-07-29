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
import { giftAPI, GiftCreate } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

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
  const auth = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdGiftId, setCreatedGiftId] = useState<number | null>(null);
  const [currentGiftParams, setCurrentGiftParams] = useState<CreateGiftParams | null>(null);
  const [giftCreationStep, setGiftCreationStep] = useState<'idle' | 'approving' | 'creating' | 'complete'>('idle');

  // Approval transaction hook
  const { writeContract: writeApproval, data: approvalTxHash } = useWriteContract();
  
  // Gift creation transaction hook  
  const { writeContract: writeGiftCreation, data: createTxHash } = useWriteContract();

  // Wait for approval transaction confirmation
  const { isLoading: isApprovalPending, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });

  // Wait for gift creation transaction confirmation
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
      setCurrentGiftParams(params); // Store for backend integration

      // Convert parameters to contract format
      const contractLat = coordinateToContract(params.latitude);
      const contractLon = coordinateToContract(params.longitude);
      const clueHash = createClueHash(params.clue);
      const metadata = createMetadataHash(params.message);
      const expiryTime = calculateExpiryTime(params.expiryDays);

      if (params.currency === 'GGT') {
        // GGT Token Gift Flow - Proper two-step process
        console.log('Creating GGT token gift...');
        const giftAmount = parseUnits(params.amount, GGT_TOKEN.decimals);

        // Step 1: Approve the GGT escrow contract to spend tokens
        console.log('Step 1: Approving GGT tokens...');
        console.log('Amount to approve:', giftAmount.toString());
        console.log('Escrow address:', GGT_ESCROW_ADDRESS);
        
        setGiftCreationStep('approving');
        
        try {
          await writeApproval({
            address: GGT_TOKEN.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [GGT_ESCROW_ADDRESS, giftAmount],
          });
          
          console.log('Approval transaction triggered, waiting for confirmation...');
        } catch (approvalError: any) {
          console.error('Approval transaction failed:', approvalError);
          setCreateError(`Approval failed: ${approvalError.message}`);
          setIsCreating(false);
          setGiftCreationStep('idle');
          return;
        }
        
        // The gift creation will be handled in the useEffect when approval completes

      } else {
        // ETH Gift Flow (existing)
        console.log('Creating ETH gift...');
        const giftAmount = parseEther(params.amount);

        await writeGiftCreation({
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

    await writeGiftCreation({
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

  // Handle GGT approval completion and proceed to gift creation
  useEffect(() => {
    if (isApprovalSuccess && giftCreationStep === 'approving' && currentGiftParams) {
      const proceedWithGiftCreation = async () => {
        try {
          console.log('Step 2: Approval confirmed, creating GGT gift...');
          setGiftCreationStep('creating');
          
          const contractLat = coordinateToContract(currentGiftParams.latitude);
          const contractLon = coordinateToContract(currentGiftParams.longitude);
          const clueHash = createClueHash(currentGiftParams.clue);
          const metadata = createMetadataHash(currentGiftParams.message);
          const expiryTime = calculateExpiryTime(currentGiftParams.expiryDays);
          const giftAmount = parseUnits(currentGiftParams.amount, GGT_TOKEN.decimals);

          await writeGiftCreation({
            address: GGT_ESCROW_ADDRESS,
            abi: GGT_ESCROW_ABI,
            functionName: 'createGift',
            args: [
              currentGiftParams.recipientAddress as `0x${string}`,
              contractLat,
              contractLon,
              BigInt(currentGiftParams.radius),
              clueHash,
              expiryTime,
              metadata,
              giftAmount,
            ],
          });
          
          console.log('Gift creation transaction sent');
        } catch (error: any) {
          console.error('Error in step 2 (gift creation):', error);
          setCreateError(error.message || 'Failed to create gift after approval');
          setIsCreating(false);
          setGiftCreationStep('idle');
        }
      };

      proceedWithGiftCreation();
    }
  }, [isApprovalSuccess, giftCreationStep, currentGiftParams, writeGiftCreation]);

  // Parse gift ID from transaction receipt and store in backend when transaction is successful
  useEffect(() => {
    if (isTxSuccess && txReceipt && isCreating && !createdGiftId && currentGiftParams) {
      const storeGiftInBackend = async () => {
        try {
          // Look for GiftCreated event in the logs
          const giftCreatedLog = txReceipt.logs.find(log => {
            // Check if this log matches the GiftCreated event signature
            // GiftCreated event has topic0 that we can identify
            return log.topics.length >= 4; // GiftCreated has 4 indexed parameters
          });

          let giftId: number;
          if (giftCreatedLog && giftCreatedLog.topics[1]) {
            // The gift ID is in the first indexed parameter (topics[1])
            const giftIdHex = giftCreatedLog.topics[1];
            giftId = parseInt(giftIdHex, 16);
            console.log('Parsed gift ID from receipt:', giftId);
          } else {
            console.warn('Could not find GiftCreated event in receipt, using fallback');
            giftId = Date.now(); // Fallback
          }

          setCreatedGiftId(giftId);

          // Try to authenticate and store in backend
          try {
            const isAuthenticated = await auth.ensureAuthenticated();
            if (isAuthenticated) {
              const giftData: GiftCreate = {
                recipient_address: currentGiftParams.recipientAddress,
                escrow_id: giftId.toString(),
                lat: currentGiftParams.latitude,
                lon: currentGiftParams.longitude,
                message: currentGiftParams.message,
              };

              await giftAPI.createGift(giftData);
              console.log('Single gift stored in backend successfully');
            } else {
              console.warn('Authentication failed, gift not stored in backend');
            }
          } catch (backendError) {
            console.warn('Failed to store gift in backend:', backendError);
            // Don't fail the entire flow if backend storage fails
          }

          setIsCreating(false);
          setCurrentGiftParams(null); // Clear stored params
          setGiftCreationStep('complete');
        } catch (error) {
          console.error('Error processing gift creation:', error);
          setCreatedGiftId(Date.now()); // Fallback
          setIsCreating(false);
          setCurrentGiftParams(null);
          setGiftCreationStep('complete');
        }
      };

      storeGiftInBackend();
    }
  }, [isTxSuccess, txReceipt, isCreating, createdGiftId, currentGiftParams, auth]);

  return {
    // State
    isCreating: isCreating || isApprovalPending || isTxPending,
    createError,
    createdGiftId,
    createTxHash,
    isTxSuccess,
    giftCreationStep,
    
    // Functions
    createGift,
    claimGift,
    useGiftDetails,
    
    // Reset functions
    resetCreateState: () => {
      setCreateError(null);
      setCreatedGiftId(null);
      setCurrentGiftParams(null);
      setGiftCreationStep('idle');
    },
  };
}