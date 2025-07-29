'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Clock, Gift, CheckCircle, Lock, Coins } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import { useToast } from '@/hooks/use-toast';
import { GGT_CHAIN_ESCROW_ADDRESS, GGT_CHAIN_ESCROW_ABI, coordinateToContract } from '@/lib/contracts';
import { StepUnlockDisplay } from '@/components/chain/step-unlock-display';
import { prepareUnlockData, verifyUnlock } from '@/lib/unlock-types';

export default function GGTChainPage() {
  const params = useParams();
  const chainId = params.id as string;
  const { address, isConnected } = useAccount();
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const { toast } = useToast();
  
  // Read chain data
  const { data: chainData, isLoading, error, refetch } = useReadContract({
    address: GGT_CHAIN_ESCROW_ADDRESS,
    abi: GGT_CHAIN_ESCROW_ABI,
    functionName: 'getChain',
    args: chainId ? [BigInt(chainId)] : undefined,
  });

  // Read chain steps
  const { data: stepsData } = useReadContract({
    address: GGT_CHAIN_ESCROW_ADDRESS,
    abi: GGT_CHAIN_ESCROW_ABI,
    functionName: 'getChainSteps',
    args: chainId ? [BigInt(chainId)] : undefined,
  });

  // Debug steps data when it loads
  useEffect(() => {
    if (stepsData) {
      console.log('Steps data loaded:', stepsData);
      stepsData.forEach((step, index) => {
        console.log(`Step ${index}:`, {
          stepIndex: step.stepIndex,
          stepType: step.stepType,
          unlockType: step.unlockType,
          stepTitle: step.stepTitle,
          keys: Object.keys(step)
        });
      });
    }
  }, [stepsData]);

  // Claim step transaction
  const { 
    writeContract: claimStep,
    isPending: isClaimPending,
    data: claimHash,
    error: claimError
  } = useWriteContract();

  const { isSuccess: isClaimConfirmed, isLoading: isClaimConfirming } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Handle claim transaction status
  useEffect(() => {
    if (isClaimConfirmed && claimHash) {
      toast({
        title: 'Step Claimed!',
        description: 'You successfully claimed this step of the chain.',
      });
      console.log('Step claimed! Transaction hash:', claimHash);
      // Refresh chain data after successful claim
      refetch();
    }
  }, [isClaimConfirmed, claimHash, toast, refetch]);

  useEffect(() => {
    if (claimError) {
      toast({
        title: 'Claim Failed',
        description: claimError.message || 'Failed to claim step.',
        variant: 'destructive',
      });
    }
  }, [claimError, toast]);

  const handleClaimStep = async (stepIndex: number, unlockData?: any) => {
    console.log('handleClaimStep called:', { stepIndex, unlockData });
    if (!chainId || !stepsData) return;

    const step = stepsData[stepIndex];
    console.log('Step data from contract:', step);
    console.log('Step keys:', Object.keys(step));
    
    // Try different possible field names for unlock type
    const stepType = Number(step.stepType || step.unlockType || 0);
    console.log('Parsed step type:', stepType);
    
    const unlockTypeMap = ['gps', 'video', 'image', 'markdown', 'quiz', 'password', 'url'] as const;
    const unlockType = unlockTypeMap[stepType] || 'gps';
    console.log('Resolved unlock type:', unlockType);
    
    // Add current location to unlock data for GPS type
    if (unlockType === 'gps' && currentLocation) {
      unlockData = { ...unlockData, lat: currentLocation.lat, lng: currentLocation.lng };
    }
    
    // Verify unlock data
    const verification = verifyUnlock(unlockType, step, unlockData);
    if (!verification.valid) {
      toast({
        title: 'Invalid Input',
        description: verification.error || 'Please check your input and try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Claiming Step...',
        description: 'Please confirm the transaction in your wallet.',
      });

      // Prepare unlock data for contract
      const { lat, lng, unlockBytes } = prepareUnlockData(unlockType, step, unlockData);

      claimStep({
        address: GGT_CHAIN_ESCROW_ADDRESS,
        abi: GGT_CHAIN_ESCROW_ABI,
        functionName: 'claimStep',
        args: [
          BigInt(chainId),
          BigInt(stepIndex),
          coordinateToContract(lat),
          coordinateToContract(lng),
          unlockBytes
        ],
      });
    } catch (error) {
      console.error('Error claiming step:', error);
      toast({
        title: 'Transaction Failed',
        description: 'Failed to claim step. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!chainId) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-geogift-50 via-white to-purple-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Invalid Chain</CardTitle>
              <CardDescription>No chain ID provided in URL</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-geogift-50 via-white to-purple-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-geogift-600"></div>
                <span className="ml-3">Loading GGT chain...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error || !chainData) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-geogift-50 via-white to-purple-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Chain Not Found</CardTitle>
              <CardDescription>This GGT gift chain could not be found or has expired.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const isExpired = chainData.chainExpired;
  const isCompleted = chainData.chainCompleted;
  const currentStep = Number(chainData.currentStep);
  const totalSteps = Number(chainData.totalSteps);
  const chainTitle = chainData.chainTitle;
  const totalValue = chainData.totalValue;
  const recipient = chainData.recipient;
  const isRecipient = isConnected && address && recipient && 
    address.toLowerCase() === recipient.toLowerCase();

  const formatGGT = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(1);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-geogift-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🪙 {chainTitle}
              </h1>
              <p className="text-lg text-gray-600 flex items-center justify-center gap-2">
                <Coins className="h-5 w-5 text-geogift-600" />
                A {totalSteps}-step adventure worth {formatGGT(totalValue)} GGT
              </p>
            </div>

            {/* Status Banner */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isCompleted ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : isExpired ? (
                      <Clock className="h-8 w-8 text-red-500" />
                    ) : (
                      <Gift className="h-8 w-8 text-geogift-600" />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold">
                        {isCompleted ? 'Adventure Complete!' : 
                         isExpired ? 'Adventure Expired' : 
                         `Step ${currentStep + 1} of ${totalSteps}`}
                      </h3>
                      <p className="text-gray-600">
                        {isCompleted ? 'You have completed all steps!' :
                         isExpired ? 'This adventure has expired' :
                         'Ready for your next clue?'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={isCompleted ? 'default' : isExpired ? 'destructive' : 'secondary'}>
                    {isCompleted ? 'Complete' : isExpired ? 'Expired' : 'Active'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Connection Check */}
            {!isConnected && (
              <Card className="mb-8 border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-orange-800">Connect Your Wallet</h3>
                      <p className="text-orange-700">Connect your wallet to claim this GGT gift chain.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Wrong Recipient Warning */}
            {isConnected && !isRecipient && (
              <Card className="mb-8 border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800">Wrong Wallet</h3>
                      <p className="text-red-700">This GGT gift chain is for a different wallet address.</p>
                      <p className="text-sm text-red-600 mt-1">Expected: {recipient || 'Loading...'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Steps */}
            <div className="space-y-4 mb-8">
              {!stepsData ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-geogift-600"></div>
                      <span className="ml-3">Loading steps...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : Array.isArray(stepsData) && stepsData.map((step: any, index: number) => {
                const isCurrentStep = index === currentStep && !isCompleted;
                const isCompletedStep = step.completed;
                const isUnlocked = isCurrentStep || isCompletedStep;
                
                // Only show the current step or completed steps to recipients
                if (!isRecipient || (!isUnlocked && !isCompletedStep)) {
                  return (
                    <Card key={index} className="border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-gray-200 text-gray-500">
                            🔒
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-500">Step {index + 1}</h3>
                            <p className="text-sm text-gray-400">Locked until previous steps are complete</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                return (
                  <StepUnlockDisplay
                    key={index}
                    step={step}
                    stepIndex={index}
                    isUnlocked={isCompletedStep}
                    onUnlock={(unlockData) => handleClaimStep(index, unlockData)}
                    isUnlocking={isClaimPending || isClaimConfirming}
                    currentLocation={currentLocation || undefined}
                  />
                );
              })}
            </div>

            {/* Chain Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-geogift-600" />
                  GGT Chain Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Chain ID</p>
                    <p className="font-semibold">{chainId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Value</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      {formatGGT(totalValue)} GGT
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Progress</p>
                    <p className="font-semibold">{currentStep} / {totalSteps} steps</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}