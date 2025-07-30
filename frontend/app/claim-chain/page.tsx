'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { motion } from 'framer-motion';
import { MapPin, Clock, Gift, CheckCircle, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import { useChainData, useClaimChainStep } from '@/hooks/useLocationChainEscrow';
import { useToast } from '@/hooks/use-toast';
import { coordinateFromContract, GGT_CHAIN_ESCROW_ADDRESS, GGT_CHAIN_ESCROW_ABI } from '@/lib/contracts';
import { chainAPI } from '@/lib/api';
import { Confetti, FloatingGifts } from '@/components/ui/confetti';
import { StepUnlockDisplay } from '@/components/chain/step-unlock-display';

export default function ClaimChainPage() {
  const searchParams = useSearchParams();
  const chainId = searchParams.get('id');
  const { address, isConnected } = useAccount();
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimedStepIndex, setClaimedStepIndex] = useState<number | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardContent, setRewardContent] = useState<{content: string, type: string} | null>(null);
  const [backendChainData, setBackendChainData] = useState<any>(null);
  const [locallyCompletedSteps, setLocallyCompletedSteps] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  
  const { data: chainData, isLoading, error } = useChainData(chainId ? parseInt(chainId) : undefined);
  
  // Also read chain steps for detailed information
  const { data: stepsData } = useReadContract({
    address: GGT_CHAIN_ESCROW_ADDRESS,
    abi: GGT_CHAIN_ESCROW_ABI,
    functionName: 'getChainSteps',
    args: chainId ? [BigInt(chainId)] : undefined,
  });
  
  // Debug steps data and fetch backend data
  useEffect(() => {
    console.log('Chain ID:', chainId);
    console.log('Steps data from contract:', stepsData);
    if (stepsData) {
      console.log('Steps count:', stepsData.length);
      stepsData.forEach((step: any, index: number) => {
        console.log(`Step ${index}:`, step);
      });
    }
    
    // Also fetch backend data for step messages and rewards
    if (chainId) {
      const fetchBackendData = async () => {
        try {
          console.log('Fetching backend data for chainId:', chainId);
          const backendChain = await chainAPI.getChainByBlockchainId(parseInt(chainId));
          console.log('Backend chain data loaded:', backendChain);
          console.log('Backend steps:', backendChain?.steps);
          console.log('Steps length:', backendChain?.steps?.length);
          setBackendChainData(backendChain);
        } catch (error) {
          console.error('Failed to fetch backend chain data:', error);
          console.error('Error details:', error);
        }
      };
      fetchBackendData();
    }
  }, [chainId, stepsData]);
  const { 
    claimStep, 
    isPending: isClaimPending, 
    isConfirming,
    isConfirmed,
    error: claimError,
    hash
  } = useClaimChainStep();

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
    console.log('Claim status effect triggered:', {
      isConfirmed,
      hash,
      claimedStepIndex,
      chainId
    });
    
    if (isConfirmed && hash && claimedStepIndex !== null) {
      setClaimSuccess(true);
      setShowConfetti(true);
      
      // Mark this step as locally completed
      setLocallyCompletedSteps(prev => new Set(prev).add(claimedStepIndex));
      
      toast({
        title: '🎉 Step Claimed!',
        description: 'You successfully claimed this step of the chain.',
      });
      
      // Try to fetch reward content and step data from backend
      const fetchRewardContent = async () => {
        try {
          if (!chainId) return;
          
          console.log('Fetching reward content for chain:', chainId, 'step:', claimedStepIndex);
          const backendChain = await chainAPI.getChainByBlockchainId(parseInt(chainId));
          console.log('Backend chain data:', backendChain);
          console.log('Chain steps:', backendChain.steps);
          console.log('Looking for step with index:', claimedStepIndex);
          
          if (backendChain.steps) {
            console.log('All steps:', backendChain.steps.map((s: any) => ({
              index: s.step_index,
              title: s.step_title,
              reward_content: s.reward_content,
              reward_content_type: s.reward_content_type
            })));
          }
          
          const claimedStep = backendChain.steps?.find((step: any) => step.step_index === claimedStepIndex);
          console.log('Found claimed step:', claimedStep);
          
          if (claimedStep?.reward_content && claimedStep?.reward_content_type) {
            console.log('Setting reward content:', claimedStep.reward_content, claimedStep.reward_content_type);
            setRewardContent({
              content: claimedStep.reward_content,
              type: claimedStep.reward_content_type
            });
            setShowRewardModal(true);
            // Don't reload immediately - wait for user to close modal
          } else {
            console.log('No reward content found for this step');
            // No reload needed - UI will naturally update
          }
        } catch (error) {
          console.error('Failed to fetch reward content:', error);
          // No reload needed - UI will naturally update
        }
      };
      
      fetchRewardContent();
    }
  }, [isConfirmed, hash, claimedStepIndex, chainId, toast]);

  useEffect(() => {
    if (claimError) {
      toast({
        title: 'Claim Failed',
        description: claimError.message || 'Failed to claim step.',
        variant: 'destructive',
      });
    }
  }, [claimError, toast]);

  const handleClaimStep = async (stepIndex: number) => {
    if (!currentLocation) {
      toast({
        title: 'Location Required',
        description: 'Please allow location access to claim this step.',
        variant: 'destructive',
      });
      return;
    }

    if (!chainId) return;

    try {
      toast({
        title: 'Claiming Step...',
        description: 'Please confirm the transaction in your wallet.',
      });

      // Track which step is being claimed
      setClaimedStepIndex(stepIndex);

      await claimStep(
        parseInt(chainId),
        stepIndex,
        currentLocation.lat,
        currentLocation.lng
      );
    } catch (error) {
      console.error('Error claiming step:', error);
      setClaimedStepIndex(null); // Reset on error
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
        <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
          <Card className="w-full max-w-md card-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                <span className="ml-3 text-white">Loading chain...</span>
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
        <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
          <Card className="w-full max-w-md card-glow">
            <CardHeader>
              <CardTitle className="text-red-400">Chain Not Found</CardTitle>
              <CardDescription className="text-gray-400">This gift chain could not be found or has expired.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const isExpired = chainData[9]; // chainExpired boolean
  const isCompleted = chainData[8]; // chainCompleted boolean
  const currentStep = Number(chainData[4]); // currentStep
  const totalSteps = Number(chainData[5]); // totalSteps
  const chainTitle = chainData[11]; // chainTitle
  const totalValue = chainData[3]; // totalValue
  const recipient = chainData[2]; // recipient
  const isRecipient = isConnected && address?.toLowerCase() === recipient.toLowerCase();

  // Debug current step and completion state
  console.log('🔍 CHAIN STATE DEBUG:', {
    currentStep,
    totalSteps,
    isCompleted,
    locallyCompletedSteps: Array.from(locallyCompletedSteps),
    hasBackendData: !!backendChainData,
    hasStepsData: !!stepsData
  });

  const formatEth = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(4);
  };

  console.log('🚨 MAIN RENDER - currentStep:', currentStep, 'locallyCompletedSteps:', Array.from(locallyCompletedSteps));

  return (
    <MainLayout>
      <div className="min-h-screen gradient-dark-bg relative overflow-hidden">
        {/* Celebration Effects */}
        <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
        {claimSuccess && <FloatingGifts />}
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl font-bold text-glow-white mb-4">
                🎁 {chainTitle}
              </h1>
              <p className="text-lg text-gray-400">
                A {totalSteps}-step adventure worth {formatEth(totalValue)} ETH
              </p>
            </motion.div>

            {/* Status Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="mb-8 card-glow hover:glow-cyan-intense transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isCompleted ? (
                        <CheckCircle className="h-8 w-8 text-green-500 glow-pulse" />
                      ) : isExpired ? (
                        <Clock className="h-8 w-8 text-red-500" />
                      ) : (
                        <Gift className="h-8 w-8 text-cyan-500 float-animation" />
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {isCompleted ? 'Adventure Complete!' : 
                           isExpired ? 'Adventure Expired' : 
                           `Step ${currentStep + 1} of ${totalSteps}`}
                        </h3>
                        <p className="text-gray-400">
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
            </motion.div>

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
                      <p className="text-orange-700">Connect your wallet to claim this gift chain.</p>
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
                      <p className="text-red-700">This gift chain is for a different wallet address.</p>
                      <p className="text-sm text-red-600 mt-1">Expected: {recipient}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Steps */}
            <div className="space-y-4 mb-8">
              {(stepsData || backendChainData?.steps) ? (
                // Use contract step data first, fallback to backend
                (stepsData || backendChainData?.steps || []).map((step: any, index: number) => {
                  console.log(`RENDERING Step ${index} - currentStep: ${currentStep}, locallyCompletedSteps:`, Array.from(locallyCompletedSteps));
                  // Get backend step data for completion status
                  const backendStep = backendChainData?.steps?.find((s: any) => s.step_index === index);
                  
                  // Use multiple sources to determine completion status
                  const isCompletedFromContract = index < currentStep;
                  const isCompletedFromBackend = backendStep?.is_completed || false;
                  const isCompletedLocally = locallyCompletedSteps.has(index);
                  const isCompletedStep = isCompletedFromContract || isCompletedFromBackend || isCompletedLocally;
                  
                  const isCurrentStep = index === currentStep && !isCompletedStep;
                  const isUnlocked = index <= currentStep || isCompletedStep;
                  
                  console.log(`Step ${index} states:`, {
                    isCurrentStep,
                    isCompletedStep,
                    isCompletedFromContract,
                    isCompletedFromBackend,
                    isCompletedLocally,
                    isUnlocked,
                    currentStep,
                    backendStepCompleted: backendStep?.is_completed,
                    hasRewardContent: backendStep?.reward_content ? true : false
                  });
                  
                  if (!isUnlocked) {
                    // Show locked card for future steps
                    return (
                      <Card key={index} className="border-gray-700 opacity-50">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center">
                              <Lock className="h-5 w-5" />
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
                  
                  // Use StepUnlockDisplay for unlocked steps
                  return (
                    <StepUnlockDisplay
                      key={index}
                      step={step}
                      stepIndex={index}
                      isUnlocked={true} // Always show content for unlocked steps
                      isCompleted={isCompletedStep}
                      rewardContent={backendStep?.reward_content}
                      rewardContentType={backendStep?.reward_content_type}
                      onUnlock={(unlockData) => {
                        // Only allow claiming for current step
                        if (isCurrentStep && isRecipient) {
                          handleClaimStep(index);
                        }
                      }}
                      isUnlocking={isClaimPending || isConfirming}
                      currentLocation={currentLocation || undefined}
                    />
                  );
                })
              ) : (
                // Fallback to simple step display if no detailed data
                Array.from({ length: totalSteps }, (_, index) => {
                const stepNumber = index + 1;
                const isCurrentStep = index === currentStep;
                const isCompletedStep = index < currentStep;
                const isUnlocked = index <= currentStep;
                
                return (
                  <Card key={index} className={`${
                    isCurrentStep ? 'border-geogift-300 bg-geogift-50' : 
                    isCompletedStep ? 'border-green-300 bg-green-50' : 
                    'border-gray-200'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                            isCompletedStep ? 'bg-green-500 text-white' :
                            isCurrentStep ? 'bg-geogift-500 text-white' :
                            'bg-gray-200 text-gray-500'
                          }`}>
                            {isCompletedStep ? <CheckCircle className="h-5 w-5" /> : stepNumber}
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              Step {stepNumber}
                              {isCompletedStep && ' ✓'}
                              {!isUnlocked && ' 🔒'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {isCompletedStep ? 'Completed!' :
                               isCurrentStep ? 'Find this location to unlock' :
                               'Locked until previous steps are complete'}
                            </p>
                          </div>
                        </div>
                        
                        {isCurrentStep && isRecipient && (
                          <Button 
                            onClick={() => handleClaimStep(index)}
                            disabled={!currentLocation || isClaimPending || isConfirming}
                            className="flex items-center space-x-2"
                          >
                            {isClaimPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Waiting for wallet...</span>
                              </>
                            ) : isConfirming ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Confirming...</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="h-4 w-4" />
                                <span>Claim with GPS</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
                })
              )}
            </div>

            {/* Loading state for step data */}
            {!stepsData && !backendChainData && chainId && (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-400">Loading step details...</p>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* Bonus Reward Modal */}
      {showRewardModal && rewardContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <CardTitle className="text-green-800 flex items-center justify-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  🎉 Bonus Reward Unlocked!
                  <Sparkles className="h-6 w-6" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rewardContent.type === 'message' && (
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Secret Message:</h4>
                    <p className="text-gray-700">{rewardContent.content}</p>
                  </div>
                )}
                
                {rewardContent.type === 'url' && (
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Special Link:</h4>
                    <a 
                      href={rewardContent.content} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {rewardContent.content}
                    </a>
                  </div>
                )}
                
                {rewardContent.type === 'file' && (
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">File Download:</h4>
                    <a 
                      href={rewardContent.content} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      📎 Download File
                    </a>
                  </div>
                )}
                
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={() => {
                      setShowRewardModal(false);
                      // Don't reload - let the UI naturally reflect the updated state
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Awesome! ✨
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
}