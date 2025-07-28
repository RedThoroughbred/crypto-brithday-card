'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { 
  MapPin, 
  Gift, 
  Clock, 
  Target,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { formatDistance, calculateDistance } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLocationEscrow } from '@/hooks/useLocationEscrow';
import { LOCATION_ESCROW_ADDRESS, LOCATION_ESCROW_ABI, coordinateFromContract } from '@/lib/contracts';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

function ClaimGiftContent() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { claimGift } = useLocationEscrow();
  const giftId = searchParams.get('id');

  // Read gift data from smart contract
  const { data: contractGift, isLoading: isLoadingGift } = useReadContract({
    address: LOCATION_ESCROW_ADDRESS,
    abi: LOCATION_ESCROW_ABI,
    functionName: 'gifts',
    args: giftId ? [BigInt(giftId)] : undefined,
  });

  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  });

  const [distance, setDistance] = useState<number | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Parse gift data from contract
  const gift = contractGift ? {
    giver: contractGift[0],
    receiver: contractGift[1], 
    amount: formatEther(contractGift[2]),
    targetLat: coordinateFromContract(contractGift[3]),
    targetLng: coordinateFromContract(contractGift[4]),
    radius: Number(contractGift[5]),
    claimed: contractGift[6],
    createdAt: Number(contractGift[7]),
    expiryTime: Number(contractGift[8]),
    clueHash: contractGift[9],
    message: contractGift[10] || '',
    metadata: contractGift[11]
  } : null;

  useEffect(() => {
    if (location.latitude && location.longitude && gift) {
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        gift.targetLat,
        gift.targetLng
      );
      setDistance(dist);
      setCanClaim(dist <= gift.radius && !gift.claimed);
    }
  }, [location.latitude, location.longitude, gift]);

  const getCurrentLocation = () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by this browser.',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleClaim = async () => {
    if (!canClaim || !gift || !giftId || !location.latitude || !location.longitude) return;

    setClaiming(true);
    try {
      await claimGift(Number(giftId), location.latitude, location.longitude);
      
      toast({
        title: 'Gift Claimed Successfully!',
        description: `You've received ${gift.amount} ETH!`,
      });
      
      // Refresh after success
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      toast({
        title: 'Claim Failed',
        description: 'There was an error claiming your gift. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to claim your gift
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!giftId) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Invalid Gift Link</CardTitle>
              <CardDescription>
                The gift ID is missing or invalid. Please check your link.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (isLoadingGift) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-geogift-600" />
                <span className="ml-2">Loading gift details...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!gift) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Gift Not Found</CardTitle>
              <CardDescription>
                This gift does not exist or has been removed.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const isExpired = new Date().getTime() > gift.expiryTime * 1000;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-geogift-50 via-white to-green-50">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            {/* Gift Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-geogift-100 rounded-full flex items-center justify-center mb-4">
                <Gift className="h-8 w-8 text-geogift-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">You've Received a GeoGift!</h1>
              <p className="mt-2 text-gray-600">
                From {gift.giver} • {gift.amount} ETH
              </p>
            </div>

            {/* Status Check */}
            {isExpired ? (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-red-900 mb-2">Gift Expired</h3>
                  <p className="text-red-700">
                    This gift expired on {new Date(gift.expiryTime * 1000).toLocaleDateString()}.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Personal Message */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Gift className="mr-2 h-5 w-5" />
                      Personal Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 italic">"{gift.message || 'No message provided'}"</p>
                  </CardContent>
                </Card>

                {/* Treasure Clue */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="mr-2 h-5 w-5" />
                      Treasure Clue
                    </CardTitle>
                    <CardDescription>
                      Solve this riddle to find the treasure location
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-800 font-medium">Find the special location to unlock your gift!</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Status */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5" />
                      Location Verification
                    </CardTitle>
                    <CardDescription>
                      Get to the treasure location to claim your gift
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!location.latitude ? (
                      <div className="text-center">
                        <Button 
                          onClick={getCurrentLocation} 
                          disabled={location.loading}
                          size="lg"
                        >
                          {location.loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Getting Location...
                            </>
                          ) : (
                            <>
                              <Navigation className="mr-2 h-4 w-4" />
                              Share My Location
                            </>
                          )}
                        </Button>
                        <p className="mt-2 text-sm text-gray-600">
                          Allow location access to check if you're at the treasure location
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Current Location</p>
                            <p className="text-sm text-gray-600">
                              {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                            </p>
                            {location.accuracy && (
                              <p className="text-xs text-gray-500">
                                Accuracy: ±{Math.round(location.accuracy)}m
                              </p>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={getCurrentLocation}
                          >
                            Refresh
                          </Button>
                        </div>

                        {distance !== null && (
                          <div className={`p-4 rounded-lg border-2 ${
                            canClaim 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-yellow-50 border-yellow-200'
                          }`}>
                            <div className="flex items-center">
                              {canClaim ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              ) : (
                                <Target className="h-5 w-5 text-yellow-500 mr-2" />
                              )}
                              <div>
                                <p className={`font-medium ${
                                  canClaim ? 'text-green-900' : 'text-yellow-900'
                                }`}>
                                  {canClaim 
                                    ? 'You\'re at the treasure location!' 
                                    : `Distance to treasure: ${formatDistance(distance)}`
                                  }
                                </p>
                                <p className={`text-sm ${
                                  canClaim ? 'text-green-700' : 'text-yellow-700'
                                }`}>
                                  {canClaim 
                                    ? 'You can now claim your gift!' 
                                    : `You need to be within ${gift.radius}m to claim`
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {location.error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">{location.error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Claim Button */}
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Button
                        onClick={handleClaim}
                        disabled={!canClaim || claiming}
                        size="lg"
                        className="w-full"
                      >
                        {claiming ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Claiming Gift...
                          </>
                        ) : canClaim ? (
                          <>
                            <Gift className="mr-2 h-4 w-4" />
                            Claim {gift.amount} ETH
                          </>
                        ) : (
                          <>
                            <MapPin className="mr-2 h-4 w-4" />
                            Get to Location to Claim
                          </>
                        )}
                      </Button>
                      
                      {!canClaim && (
                        <p className="mt-2 text-sm text-gray-600">
                          Follow the clue to find the treasure location
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Expiry Info */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 flex items-center justify-center">
                    <Clock className="mr-1 h-4 w-4" />
                    Expires on {new Date(gift.expiryTime * 1000).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ClaimGiftPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClaimGiftContent />
    </Suspense>
  );
}