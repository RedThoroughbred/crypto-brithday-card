'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { MapPin, Clock, Gift, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import { useChainData, useClaimChainStep } from '@/hooks/useLocationChainEscrow';
import { useToast } from '@/hooks/use-toast';
import { coordinateFromContract } from '@/lib/contracts';

export default function ClaimChainPage() {
  const searchParams = useSearchParams();
  const chainId = searchParams.get('id');
  const { address, isConnected } = useAccount();
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const { toast } = useToast();
  
  const { data: chainData, isLoading, error } = useChainData(chainId ? parseInt(chainId) : undefined);
  const { 
    claimStep, 
    isPending: isClaimPending, 
    isConfirming: isClaimConfirming,
    isConfirmed: isClaimConfirmed,
    error: claimError,
    hash: claimHash
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
    if (isClaimConfirmed && claimHash) {
      toast({
        title: 'Step Claimed!',
        description: 'You successfully claimed this step of the chain.',
      });
      console.log('Step claimed! Transaction hash:', claimHash);
      // Refresh chain data after successful claim
      window.location.reload();
    }
  }, [isClaimConfirmed, claimHash, toast]);

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

      await claimStep(
        parseInt(chainId),
        stepIndex,
        currentLocation.lat,
        currentLocation.lng
      );
    } catch (error) {
      console.error('Error claiming step:', error);
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
                <span className="ml-3">Loading chain...</span>
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
              <CardDescription>This gift chain could not be found or has expired.</CardDescription>
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

  const formatEth = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(4);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-geogift-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🎁 {chainTitle}
              </h1>
              <p className="text-lg text-gray-600">
                A {totalSteps}-step adventure worth {formatEth(totalValue)} ETH
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
              {Array.from({ length: totalSteps }, (_, index) => {
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
                            disabled={!currentLocation || isClaimPending || isClaimConfirming}
                            className="flex items-center space-x-2"
                          >
                            {isClaimPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Waiting for wallet...</span>
                              </>
                            ) : isClaimConfirming ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Confirming...</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="h-4 w-4" />
                                <span>Claim Here</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* TODO: Add individual step claiming functionality */}
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">🚧 Step Claiming Coming Soon</h3>
                <p className="text-gray-600">
                  Individual step claiming with GPS verification is being developed.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}