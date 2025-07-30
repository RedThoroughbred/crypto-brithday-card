'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Gift, 
  Clock, 
  Target,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Edit3,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Lock,
  HelpCircle,
  Video,
  Image,
  FileText,
  Link
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { formatDistance, calculateDistance } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLocationEscrow } from '@/hooks/useLocationEscrow';
import { LOCATION_ESCROW_ADDRESS, LOCATION_ESCROW_ABI, GGT_ESCROW_ADDRESS, GGT_ESCROW_ABI, coordinateFromContract } from '@/lib/contracts';
import { GGT_TOKEN } from '@/lib/constants';
import { Confetti, FloatingGifts } from '@/components/ui/confetti';
import { giftAPI } from '@/lib/api';

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
  const giftType = searchParams.get('type') || 'ggt'; // Default to GGT since that's the primary token
  const isGGT = giftType === 'ggt';

  // Read gift data from smart contract (ETH or GGT)
  const { data: contractGift, isLoading: isLoadingGift } = useReadContract({
    address: isGGT ? GGT_ESCROW_ADDRESS : LOCATION_ESCROW_ADDRESS,
    abi: isGGT ? GGT_ESCROW_ABI : LOCATION_ESCROW_ABI,
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
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [backendGift, setBackendGift] = useState<any>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [quizAnswer, setQuizAnswer] = useState('');
  const [hasViewedContent, setHasViewedContent] = useState(false);
  const [showRewardContent, setShowRewardContent] = useState(false);

  // Parse gift data from contract
  // Note: GGT and ETH contracts have same field order, so we can use same parsing
  const gift = contractGift ? {
    giver: contractGift[0],
    receiver: contractGift[1], 
    amount: formatEther(contractGift[2]),
    targetLat: coordinateFromContract(contractGift[3]),
    targetLng: coordinateFromContract(contractGift[4]),
    radius: Number(contractGift[5]),
    clueHash: contractGift[6],
    expiryTime: Number(contractGift[7]),
    metadata: contractGift[8],
    claimed: contractGift[9],
    exists: contractGift[10],
    claimAttempts: Number(contractGift[11]),
    createdAt: Number(contractGift[12]),
    message: backendGift?.message || '', // Get message from backend
    currency: isGGT ? 'GGT' : 'ETH',
    unlockType: backendGift?.unlock_type || 'GPS', // Get unlock type from backend
    unlockChallengeData: backendGift?.unlock_challenge_data || '', // Get unlock challenge data from backend
    rewardContent: backendGift?.reward_content || '', // Get reward content from backend
    rewardContentType: backendGift?.reward_content_type || '', // Get reward content type from backend
  } : null;

  // Fetch gift message from backend
  useEffect(() => {
    if (giftId) {
      giftAPI.getGiftByEscrowId(giftId)
        .then((backendData) => {
          setBackendGift(backendData);
        })
        .catch((error) => {
          console.warn('Could not fetch gift from backend:', error);
          // Don't fail the flow if backend is unavailable
        });
    }
  }, [giftId]);

  useEffect(() => {
    if (gift) {
      if (gift.unlockType === 'GPS') {
        // GPS-based claiming requires location verification
        if (location.latitude && location.longitude) {
          const dist = calculateDistance(
            location.latitude,
            location.longitude,
            gift.targetLat,
            gift.targetLng
          );
          setDistance(dist);
          setCanClaim(dist <= gift.radius && !gift.claimed);
          
          // DEBUG: Force enable claim button if distance is very small
          if (dist <= 1 && !gift.claimed) {
            console.log('🐛 DEBUG: Force enabling claim button - distance:', dist, 'radius:', gift.radius);
            setCanClaim(true);
          }
        } else {
          setCanClaim(false);
        }
      } else if (gift.unlockType === 'PASSWORD') {
        // Password unlock requires correct password
        setCanClaim(passwordInput === gift.unlockChallengeData && !gift.claimed);
      } else if (gift.unlockType === 'QUIZ') {
        // Quiz unlock requires correct answer
        // Parse quiz data (format: "Question: What is 2+2? | Answer: 4")
        const parts = gift.unlockChallengeData.split(' | Answer: ');
        const correctAnswer = parts[1] || '';
        setCanClaim(quizAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim() && !gift.claimed);
      } else if (['VIDEO', 'IMAGE', 'MARKDOWN', 'URL'].includes(gift.unlockType)) {
        // Content viewing types require viewing confirmation
        setCanClaim(hasViewedContent && !gift.claimed);
      } else {
        // Fallback for other types
        setCanClaim(!gift.claimed);
      }
    }
  }, [location.latitude, location.longitude, gift, passwordInput, quizAnswer, hasViewedContent]);

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

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: 'Invalid Coordinates',
        description: 'Please enter valid latitude and longitude values.',
        variant: 'destructive',
      });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: 'Invalid Coordinates',
        description: 'Latitude must be between -90 and 90, longitude between -180 and 180.',
        variant: 'destructive',
      });
      return;
    }

    setLocation({
      latitude: lat,
      longitude: lng,
      accuracy: null,
      error: null,
      loading: false,
    });

    setShowManualInput(false);
    
    toast({
      title: 'Coordinates Set',
      description: `Location set to ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
  };

  const handleClaim = async () => {
    if (!canClaim || !gift || !giftId) return;
    
    // For GPS gifts, require actual location
    if (gift.unlockType === 'GPS' && (!location.latitude || !location.longitude)) return;

    setClaiming(true);
    try {
      // Use actual location for GPS gifts, dummy coordinates for others
      const claimLat = gift.unlockType === 'GPS' ? location.latitude! : 0;
      const claimLng = gift.unlockType === 'GPS' ? location.longitude! : 0;
      
      await claimGift(Number(giftId), claimLat, claimLng, isGGT);
      
      // Show celebration
      setClaimSuccess(true);
      setShowConfetti(true);
      setShowRewardContent(true);
      
      toast({
        title: '🎉 Gift Claimed Successfully!',
        description: `You've received ${gift.amount} ${gift.currency}!`,
      });
      
      // Refresh after celebration
      setTimeout(() => window.location.reload(), 5000);
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
      <div className="min-h-screen gradient-dark-bg relative overflow-hidden">
        {/* Celebration Effects */}
        <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
        {claimSuccess && <FloatingGifts />}
        
        <div className="px-4 py-8 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl">
            {/* Gift Header */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="mx-auto w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4 glow-cyan float-animation">
                <Gift className="h-8 w-8 text-cyan-500" />
              </div>
              <h1 className="text-3xl font-bold text-glow-white">You've Received a GeoGift!</h1>
              <p className="mt-2 text-gray-400">
                From {gift.giver} • {gift.amount} {gift.currency}
              </p>
            </motion.div>

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

                {/* Dynamic Content Based on Unlock Type */}
                {gift.unlockType === 'GPS' && (
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
                )}

                {gift.unlockType === 'PASSWORD' && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Lock className="mr-2 h-5 w-5" />
                        Password Challenge
                      </CardTitle>
                      <CardDescription>
                        Enter the correct password to unlock your gift
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 font-medium mb-3">🔐 Password Required</p>
                        <div className="space-y-3">
                          <Input
                            type="password"
                            placeholder="Enter password..."
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="max-w-xs"
                          />
                          {passwordInput && passwordInput !== gift.unlockChallengeData && (
                            <p className="text-red-600 text-sm">❌ Incorrect password</p>
                          )}
                          {passwordInput && passwordInput === gift.unlockChallengeData && (
                            <p className="text-green-600 text-sm">✅ Password correct! You can now claim your gift.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {gift.unlockType === 'QUIZ' && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <HelpCircle className="mr-2 h-5 w-5" />
                        Quiz Challenge
                      </CardTitle>
                      <CardDescription>
                        Answer the question correctly to unlock your gift
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 font-medium mb-3">❓ Quiz Question</p>
                        <div className="space-y-3">
                          {(() => {
                            const parts = gift.unlockChallengeData.split(' | Answer: ');
                            const question = parts[0] || gift.unlockChallengeData;
                            return (
                              <>
                                <p className="text-gray-700 font-medium">{question}</p>
                                <Input
                                  placeholder="Enter your answer..."
                                  value={quizAnswer}
                                  onChange={(e) => setQuizAnswer(e.target.value)}
                                  className="max-w-xs"
                                />
                                {quizAnswer && !canClaim && (
                                  <p className="text-red-600 text-sm">❌ Incorrect answer</p>
                                )}
                                {canClaim && quizAnswer && (
                                  <p className="text-green-600 text-sm">✅ Correct! You can now claim your gift.</p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {['VIDEO', 'IMAGE', 'MARKDOWN', 'URL'].includes(gift.unlockType) && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {gift.unlockType === 'VIDEO' && <Video className="mr-2 h-5 w-5" />}
                        {gift.unlockType === 'IMAGE' && <Image className="mr-2 h-5 w-5" />}
                        {gift.unlockType === 'MARKDOWN' && <FileText className="mr-2 h-5 w-5" />}
                        {gift.unlockType === 'URL' && <Link className="mr-2 h-5 w-5" />}
                        {gift.unlockType === 'VIDEO' && 'Watch Video'}
                        {gift.unlockType === 'IMAGE' && 'View Image'}
                        {gift.unlockType === 'MARKDOWN' && 'Read Content'}
                        {gift.unlockType === 'URL' && 'Visit Website'}
                      </CardTitle>
                      <CardDescription>
                        {gift.unlockType === 'VIDEO' && 'Watch the video to unlock your gift'}
                        {gift.unlockType === 'IMAGE' && 'View the image to unlock your gift'}
                        {gift.unlockType === 'MARKDOWN' && 'Read the content to unlock your gift'}
                        {gift.unlockType === 'URL' && 'Visit the website to unlock your gift'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-purple-800 font-medium mb-3">
                          {gift.unlockType === 'VIDEO' && '🎥 Video Content'}
                          {gift.unlockType === 'IMAGE' && '🖼️ Image Content'}
                          {gift.unlockType === 'MARKDOWN' && '📄 Written Content'}
                          {gift.unlockType === 'URL' && '🔗 Website Link'}
                        </p>
                        
                        {gift.unlockType === 'MARKDOWN' && (
                          <div className="bg-white p-3 rounded border text-gray-700 mb-3">
                            <pre className="whitespace-pre-wrap font-sans">{gift.unlockChallengeData}</pre>
                          </div>
                        )}
                        
                        {(gift.unlockType === 'VIDEO' || gift.unlockType === 'IMAGE' || gift.unlockType === 'URL') && gift.unlockChallengeData && (
                          <div className="mb-3">
                            <a 
                              href={gift.unlockChallengeData} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                              onClick={() => setHasViewedContent(true)}
                            >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              {gift.unlockType === 'VIDEO' && 'Watch Video'}
                              {gift.unlockType === 'IMAGE' && 'View Image'}
                              {gift.unlockType === 'URL' && 'Visit Website'}
                            </a>
                          </div>
                        )}
                        
                        {!hasViewedContent && (
                          <p className="text-purple-700 text-sm">👆 Click the link above to unlock your gift</p>
                        )}
                        
                        {hasViewedContent && (
                          <p className="text-green-600 text-sm">✅ Content viewed! You can now claim your gift.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Location Status - Only for GPS unlock type */}
                {gift.unlockType === 'GPS' && (
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
                      <div className="space-y-4">
                        {/* Automatic GPS Location */}
                        <div className="text-center">
                          <Button 
                            onClick={getCurrentLocation} 
                            disabled={location.loading}
                            size="lg"
                            className="w-full"
                          >
                            {location.loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Getting Location...
                              </>
                            ) : (
                              <>
                                <Navigation className="mr-2 h-4 w-4" />
                                Use Current Location (GPS)
                              </>
                            )}
                          </Button>
                          <p className="mt-2 text-sm text-gray-600">
                            Allow location access to automatically detect your position
                          </p>
                        </div>

                        {/* Manual Coordinate Input Toggle */}
                        <div className="text-center">
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white px-2 text-gray-500">Or</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <Button 
                            variant="outline"
                            onClick={() => setShowManualInput(!showManualInput)}
                            size="lg"
                            className="w-full"
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Enter Coordinates Manually
                          </Button>
                          <p className="mt-2 text-sm text-gray-600">
                            Type latitude and longitude coordinates directly
                          </p>
                        </div>

                        {/* Manual Input Form */}
                        {showManualInput && (
                          <Card className="mt-4 border-blue-200 bg-blue-50">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">Manual Coordinates</CardTitle>
                              <CardDescription>
                                Enter the latitude and longitude coordinates
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                  <Label htmlFor="latitude">Latitude</Label>
                                  <Input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    placeholder="e.g., 37.7749"
                                    value={manualLat}
                                    onChange={(e) => setManualLat(e.target.value)}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">-90 to 90</p>
                                </div>
                                <div>
                                  <Label htmlFor="longitude">Longitude</Label>
                                  <Input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    placeholder="e.g., -122.4194"
                                    value={manualLng}
                                    onChange={(e) => setManualLng(e.target.value)}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">-180 to 180</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={handleManualCoordinates}
                                  className="flex-1"
                                >
                                  Set Location
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => setShowManualInput(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                              
                              {/* Helper Info */}
                              <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                  <strong>💡 Hint:</strong> The San Francisco gift is at coordinates 37.7749, -122.4194
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
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
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={getCurrentLocation}
                            >
                              <Navigation className="h-3 w-3 mr-1" />
                              GPS
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setShowManualInput(true)}
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
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

                        {/* Manual Input Form - shown when user clicks Edit */}
                        {showManualInput && (
                          <Card className="mt-4 border-blue-200 bg-blue-50">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">Edit Coordinates</CardTitle>
                              <CardDescription>
                                Update your location coordinates
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                  <Label htmlFor="latitude-edit">Latitude</Label>
                                  <Input
                                    id="latitude-edit"
                                    type="number"
                                    step="any"
                                    placeholder="e.g., 37.7749"
                                    value={manualLat || location.latitude?.toString() || ''}
                                    onChange={(e) => setManualLat(e.target.value)}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">-90 to 90</p>
                                </div>
                                <div>
                                  <Label htmlFor="longitude-edit">Longitude</Label>
                                  <Input
                                    id="longitude-edit"
                                    type="number"
                                    step="any"
                                    placeholder="e.g., -122.4194"
                                    value={manualLng || location.longitude?.toString() || ''}
                                    onChange={(e) => setManualLng(e.target.value)}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">-180 to 180</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={handleManualCoordinates}
                                  className="flex-1"
                                >
                                  Update Location
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => setShowManualInput(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                              
                              {/* Helper Info */}
                              <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                  <strong>💡 Hint:</strong> The San Francisco gift is at coordinates 37.7749, -122.4194
                                </p>
                              </div>
                            </CardContent>
                          </Card>
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
                )}

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
                            Claim {gift.amount} {gift.currency}
                          </>
                        ) : gift.unlockType === 'GPS' ? (
                          <>
                            <MapPin className="mr-2 h-4 w-4" />
                            Get to Location to Claim
                          </>
                        ) : (
                          <>
                            <Gift className="mr-2 h-4 w-4" />
                            Ready to Claim
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

                {/* Reward Content Display (shown after claiming) */}
                {showRewardContent && gift.rewardContent && (
                  <Card className="mb-6 border-2 border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-green-800">
                        <Sparkles className="mr-2 h-5 w-5" />
                        🎉 Bonus Reward Unlocked!
                      </CardTitle>
                      <CardDescription>
                        You've unlocked additional content along with your crypto!
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white border border-green-200 rounded-lg p-4">
                        {gift.rewardContentType === 'url' && (
                          <div>
                            <p className="text-green-800 font-medium mb-3">🔗 Special Website Link:</p>
                            <a 
                              href={gift.rewardContent} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Visit: {gift.rewardContent}
                            </a>
                          </div>
                        )}
                        
                        {gift.rewardContentType === 'file' && (
                          <div>
                            <p className="text-green-800 font-medium mb-3">📎 File Download:</p>
                            <a 
                              href={gift.rewardContent} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Download: {gift.rewardContent.split('/').pop() || gift.rewardContent}
                            </a>
                          </div>
                        )}
                        
                        {gift.rewardContentType === 'message' && (
                          <div>
                            <p className="text-green-800 font-medium mb-3">💬 Secret Message:</p>
                            <div className="bg-gray-50 p-3 rounded border text-gray-700">
                              <pre className="whitespace-pre-wrap font-sans">{gift.rewardContent}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

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