import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { useState, useEffect } from 'react'
import { 
  LOCATION_CHAIN_ESCROW_ADDRESS, 
  LOCATION_CHAIN_ESCROW_ABI,
  coordinateToContract,
  calculateExpiryTime,
  createMetadataHash,
  createClueHash
} from '@/lib/contracts'
import { chainAPI } from '@/lib/api'

export interface ChainStep {
  id: string;
  title: string;
  message: string;
  latitude: number | null;
  longitude: number | null;
  radius: number;
  order: number;
}

export interface CreateChainParams {
  recipientAddress: string;
  chainTitle: string;
  chainDescription?: string;
  totalAmount: string;
  expiryDays: number;
  steps: ChainStep[];
}

export function useLocationChainEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash,
    })

  const createGiftChain = async (params: CreateChainParams) => {
    if (!params.steps.every(step => step.latitude && step.longitude)) {
      throw new Error('All steps must have valid locations')
    }

    // Prepare step locations as int256[2][] array
    const stepLocations = params.steps.map(step => [
      coordinateToContract(step.latitude!),
      coordinateToContract(step.longitude!)
    ])

    // Prepare step radii
    const stepRadii = params.steps.map(step => BigInt(step.radius))

    // Prepare step message hashes
    const stepMessages = params.steps.map(step => createClueHash(step.message))

    // Prepare step titles
    const stepTitles = params.steps.map(step => step.title)

    // Calculate expiry time
    const chainExpiryTime = calculateExpiryTime(params.expiryDays)

    // Create chain metadata
    const chainMetadata = createMetadataHash(params.chainDescription || '')

    const value = parseEther(params.totalAmount)

    return writeContract({
      address: LOCATION_CHAIN_ESCROW_ADDRESS,
      abi: LOCATION_CHAIN_ESCROW_ABI,
      functionName: 'createGiftChain',
      args: [
        params.recipientAddress as `0x${string}`,
        stepLocations,
        stepRadii,
        stepMessages,
        stepTitles,
        params.chainTitle,
        chainExpiryTime,
        chainMetadata
      ],
      value
    })
  }

  return {
    createGiftChain,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

// Hook to read chain data from smart contract only (legacy)
export function useChainDataFromContract(chainId: number | undefined) {
  return useReadContract({
    address: LOCATION_CHAIN_ESCROW_ADDRESS,
    abi: LOCATION_CHAIN_ESCROW_ABI,
    functionName: 'chains',
    args: chainId !== undefined ? [BigInt(chainId)] : undefined,
    query: {
      enabled: chainId !== undefined
    }
  })
}

// Enhanced hook to read chain data from backend API (includes reward content)
export function useChainData(chainId: number | undefined) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!chainId) return;

    const fetchChainData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to fetch from backend API first (includes reward content)
        const backendChain = await chainAPI.getChainByBlockchainId(chainId);
        setData(backendChain);
      } catch (backendError) {
        console.warn('Failed to fetch from backend, falling back to contract:', backendError);
        
        // Fallback to contract-only data if backend fails
        try {
          // This would need to be implemented properly, but for now just set error
          setError(new Error('Chain not found in backend'));
        } catch (contractError) {
          setError(contractError as Error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChainData();
  }, [chainId]);

  return { data, isLoading, error };
}

// Hook for claiming chain steps
export function useClaimChainStep() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash,
    })

  const claimStep = async (chainId: number, stepIndex: number, userLat: number, userLng: number) => {
    // For now, we'll use empty bytes for locationProof (signature parameter)
    const locationProof = '0x' as `0x${string}`;

    return writeContract({
      address: LOCATION_CHAIN_ESCROW_ADDRESS,
      abi: [
        {
          "inputs": [
            { "internalType": "uint256", "name": "chainId", "type": "uint256" },
            { "internalType": "uint256", "name": "stepIndex", "type": "uint256" },
            { "internalType": "int256", "name": "userLatitude", "type": "int256" },
            { "internalType": "int256", "name": "userLongitude", "type": "int256" },
            { "internalType": "bytes", "name": "signature", "type": "bytes" }
          ],
          "name": "claimChainStep",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      functionName: 'claimChainStep',
      args: [
        BigInt(chainId),
        BigInt(stepIndex),
        coordinateToContract(userLat),
        coordinateToContract(userLng),
        locationProof
      ]
    })
  }

  return {
    claimStep,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}