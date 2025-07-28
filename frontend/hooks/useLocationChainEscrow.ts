import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { 
  LOCATION_CHAIN_ESCROW_ADDRESS, 
  LOCATION_CHAIN_ESCROW_ABI,
  coordinateToContract,
  calculateExpiryTime,
  createMetadataHash,
  createClueHash
} from '@/lib/contracts'

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

// Hook to read chain data
export function useChainData(chainId: number | undefined) {
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