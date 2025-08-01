'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useSignMessage } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import { 
  Gift, 
  Key, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Sparkles,
  Zap
} from 'lucide-react';
import { useNewUserGiftEscrow } from '@/hooks/useNewUserGiftEscrow';
import { useNewUserGiftEscrowGSN } from '@/hooks/useNewUserGiftEscrowGSN';
import { useGSNProvider } from '@/hooks/useGSNProvider';
import { useSimpleRelayEscrow } from '@/hooks/useSimpleRelayEscrow';
import { useAuth } from '@/hooks/useAuth';
import { formatClaimCodeForDisplay, cleanClaimCodeInput, isValidClaimCode, formatTimeRemaining } from '@/lib/newuser-gift';
import { formatEther } from 'viem';
import { Confetti, FloatingGifts } from '@/components/ui/confetti';
import { GiftDebug } from '@/components/debug/gift-debug';

export default function ClaimNewUserGiftPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { isAuthenticated, authenticate } = useAuth();
  const giftId = params.giftId as string;
  
  const [claimCode, setClaimCode] = useState('');
  const [unlockAnswer, setUnlockAnswer] = useState('');
  const [showClaimed, setShowClaimed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [isGaslessClaiming, setIsGaslessClaiming] = useState(false);
  
  // Hook for gasless message signing
  const { signMessageAsync } = useSignMessage();
  
  const { claimGift: claimGiftLegacy, isClaiming: isClaimingLegacy, useGiftDetails, useIsClaimable } = useNewUserGiftEscrow();
  const { claimGift: claimGiftGSN, isLoading: isClaimingGSN, getGift: getGiftGSN, isClaimable: isClaimableGSN, isGSNEnabled } = useNewUserGiftEscrowGSN();
  const { isGSNAvailable, isInitializing: isGSNInitializing } = useGSNProvider();
  const { useGiftDetails: useSimpleRelayGiftDetails } = useSimpleRelayEscrow();
  
  // Use GSN version if available, otherwise fallback to legacy
  const shouldUseGSN = isGSNAvailable && isGSNEnabled;
  const claimGift = shouldUseGSN ? claimGiftGSN : claimGiftLegacy;
  const isClaiming = shouldUseGSN ? isClaimingGSN : isClaimingLegacy;
  
  // Check if this gift supports gasless claiming (using SimpleRelayEscrow contract)
  const SIMPLE_RELAY_ESCROW_ADDRESS = '0x0dA21305e6860bbBea457D44b02BDaf287eE856D';
  
  // Get gift details from both contracts
  const { data: giftDetails, isLoading: loadingDetails, error: giftDetailsError } = useGiftDetails(giftId);
  const { data: legacyIsClaimable, isLoading: loadingClaimable, error: claimableError } = useIsClaimable(giftId);
  const { data: simpleRelayGiftDetails, isLoading: loadingSimpleRelayDetails, error: simpleRelayError } = useSimpleRelayGiftDetails(giftId);
  
  // Determine which contract has the gift
  const hasLegacyGift = giftDetails && giftDetails[0] !== '0x0000000000000000000000000000000000000000';
  const hasSimpleRelayGift = simpleRelayGiftDetails && simpleRelayGiftDetails[0] !== '0x0000000000000000000000000000000000000000';
  
  // Use the gift details from whichever contract has the gift
  const actualGiftDetails = hasSimpleRelayGift ? simpleRelayGiftDetails : giftDetails;
  const isGaslessCompatible = hasSimpleRelayGift;
  
  // Calculate claimability based on which contract has the gift
  const isClaimable = hasSimpleRelayGift 
    ? (simpleRelayGiftDetails && !simpleRelayGiftDetails[4] && !simpleRelayGiftDetails[5] && Date.now() / 1000 < Number(simpleRelayGiftDetails[3]))
    : legacyIsClaimable;
  
  console.log('Hook data states:', {
    giftDetails,
    simpleRelayGiftDetails,
    legacyIsClaimable,
    calculatedIsClaimable: isClaimable,
    loadingDetails,
    loadingClaimable, 
    loadingSimpleRelayDetails,
    giftId,
    giftDetailsError: giftDetailsError?.message,
    claimableError: claimableError?.message,
    simpleRelayError: simpleRelayError?.message
  });
  
  // Log the actual gift data to see why isClaimable is false
  if (simpleRelayGiftDetails) {
    console.log('🎁 Simple Relay Gift Details:', {
      sender: simpleRelayGiftDetails[0],
      ggtAmount: simpleRelayGiftDetails[1]?.toString(),
      gasAllowance: simpleRelayGiftDetails[2]?.toString(),
      expiry: simpleRelayGiftDetails[3]?.toString(),
      expiryDate: new Date(Number(simpleRelayGiftDetails[3]) * 1000).toISOString(),
      claimed: simpleRelayGiftDetails[4],
      refunded: simpleRelayGiftDetails[5],
      message: simpleRelayGiftDetails[6],
      unlockType: simpleRelayGiftDetails[7],
      unlockData: simpleRelayGiftDetails[8],
      isExpiredNow: Date.now() / 1000 > Number(simpleRelayGiftDetails[3])
    });
  }
  
  console.log('actualGiftDetails calculation:', {
    hasSimpleRelayGift,
    simpleRelayGiftDetails,
    giftDetails,
    actualGiftDetails,
    'actualGiftDetails[0]': actualGiftDetails?.[0],
    'actualGiftDetails[4]': actualGiftDetails?.[4],
    'actualGiftDetails[5]': actualGiftDetails?.[5]
  });
  
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !isAuthenticated) {
      authenticate();
      return;
    }
    
    const cleanCode = cleanClaimCodeInput(claimCode);
    if (!isValidClaimCode(cleanCode)) {
      alert('Please enter a valid claim code');
      return;
    }
    
    if (shouldUseGSN) {
      // GSN gasless claim
      await claimGiftGSN({
        giftId,
        claimCode: cleanCode,
        unlockAnswer,
      });
    } else {
      // Legacy claim (requires gas from user)
      await claimGiftLegacy({
        giftId,
        claimCode: cleanCode,
        unlockAnswer,
      });
    }
    
    // Show celebration effects
    setShowClaimed(true);
    setClaimSuccess(true);
    setShowConfetti(true);
  };
  
  // Handle gasless claim using relay service
  const handleGaslessClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !isAuthenticated) {
      authenticate();
      return;
    }
    
    const cleanCode = cleanClaimCodeInput(claimCode);
    if (!isValidClaimCode(cleanCode)) {
      alert('Please enter a valid claim code');
      return;
    }
    
    try {
      setIsGaslessClaiming(true);
      
      // Step 1: Get nonce from relay service
      const nonceResponse = await fetch(`http://localhost:3001/nonce/${giftId}`);
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce from relay service');
      }
      const { nonce } = await nonceResponse.json();
      
      // Step 2: Create message hash
      const hashResponse = await fetch('http://localhost:3001/create-claim-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId,
          recipient: address,
          claimCode: cleanCode,
          unlockAnswer: unlockAnswer || '',
          nonce
        })
      });
      
      if (!hashResponse.ok) {
        throw new Error('Failed to create claim hash');
      }
      const { messageHash } = await hashResponse.json();
      
      // Step 3: Sign the message hash
      const signature = await signMessageAsync({
        message: { raw: messageHash as `0x${string}` }
      });
      
      // Step 4: Submit to relay service
      const claimResponse = await fetch('http://localhost:3001/relay-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId,
          recipient: address,
          claimCode: cleanCode,
          unlockAnswer: unlockAnswer || '',
          nonce,
          signature
        })
      });
      
      if (!claimResponse.ok) {
        const error = await claimResponse.json();
        throw new Error(error.error || 'Relay claim failed');
      }
      
      const result = await claimResponse.json();
      console.log('Gasless claim successful:', result);
      
      // Show celebration effects
      setShowClaimed(true);
      setClaimSuccess(true);
      setShowConfetti(true);
      
    } catch (error) {
      console.error('Gasless claim error:', error);
      alert(`Gasless claim failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGaslessClaiming(false);
    }
  };
  
  if (loadingDetails || loadingClaimable || loadingSimpleRelayDetails) {
    return (
      <MainLayout>
        <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
          <Card className="w-full max-w-md card-glow">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
              <p className="text-white">Loading gift details...</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  // Debug logging  
  console.log('Gift details check:', {
    giftDetails,
    simpleRelayGiftDetails,
    hasLegacyGift,
    hasSimpleRelayGift,
    isGaslessCompatible,
    actualGiftDetails,
  });
  
  console.log('Loading states:', {
    loadingDetails,
    loadingClaimable, 
    loadingSimpleRelayDetails,
    shouldShowLoading: loadingDetails || loadingClaimable || loadingSimpleRelayDetails
  });
  
  // Check if gift exists in either contract
  const giftExists = hasLegacyGift || hasSimpleRelayGift;
  
  console.log('Render flow check:', {
    giftExists,
    hasLegacyGift,
    hasSimpleRelayGift,
    showClaimed,
    claimed: actualGiftDetails?.[4],
    refunded: actualGiftDetails?.[5],
    expiry: actualGiftDetails?.[3],
    isExpired: actualGiftDetails?.[3] ? Date.now() / 1000 > Number(actualGiftDetails[3]) : false,
    isClaimable
  });
  
  if (!giftExists) {
    console.log('❌ Gift does not exist - showing not found page');
    return (
      <MainLayout>
        <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
          <Card className="w-full max-w-md card-glow">
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Gift Not Found
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-400 mb-4">
                This gift doesn't exist or the link is invalid.
              </p>
              <Button 
                onClick={() => router.push('/')}
                className="bg-cyan-500 hover:bg-cyan-600 text-black"
              >
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  // Handle both array and object responses from the contract
  const [sender, ggtAmount, ethAmount, expiry, claimed, refunded, message, unlockType, unlockData] = 
    Array.isArray(actualGiftDetails) ? actualGiftDetails : 
    (actualGiftDetails ? [
      actualGiftDetails[0], // sender
      actualGiftDetails[1], // ggtAmount
      actualGiftDetails[2], // ethAmount/gasAllowance
      actualGiftDetails[3], // expiry
      actualGiftDetails[4], // claimed
      actualGiftDetails[5], // refunded
      actualGiftDetails[6], // message
      actualGiftDetails[7], // unlockType
      actualGiftDetails[8]  // unlockData
    ] : []);
  const isExpired = Date.now() / 1000 > Number(expiry);
  const timeRemaining = formatTimeRemaining(Number(expiry));
  
  if (showClaimed || claimed) {
    return (
      <MainLayout>
        <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
          <Card className="w-full max-w-md card-glow border-green-400/50 bg-green-400/10">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-black" />
              </div>
              <CardTitle className="text-white">Gift Claimed Successfully! 🎉</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-black/30 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {formatEther(ggtAmount || BigInt(0))} GGT
                  </p>
                  <p className="text-gray-400 text-sm">tokens sent to your wallet</p>
                </div>
                {ethAmount && ethAmount > BigInt(0) && (
                  <div>
                    <p className="text-xl font-bold text-yellow-400">
                      + {formatEther(ethAmount)} ETH
                    </p>
                    <p className="text-gray-400 text-sm">for transaction fees</p>
                  </div>
                )}
              </div>
              
              {message && (
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-white italic">"{message}"</p>
                </div>
              )}
              
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full bg-green-500 hover:bg-green-600 text-black"
              >
                View Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  if (refunded || isExpired || !isClaimable) {
    return (
      <MainLayout>
        <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
          <Card className="w-full max-w-md card-glow border-red-400/50 bg-red-400/10">
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Gift Not Available
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-400 mb-4">
                {refunded 
                  ? "This gift has been refunded to the sender."
                  : isExpired
                  ? "This gift has expired and is no longer claimable."
                  : "This gift is not available for claiming."
                }
              </p>
              <Button 
                onClick={() => router.push('/')}
                className="bg-cyan-500 hover:bg-cyan-600 text-black"
              >
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="min-h-screen gradient-dark-bg py-12 relative overflow-hidden">
        {/* Celebration Effects */}
        <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
        {claimSuccess && <FloatingGifts />}
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              You Have a Crypto Gift! 🎁
            </h1>
            <p className="text-gray-400">
              Enter your claim code below to receive your crypto tokens
            </p>
          </div>

          {/* Gift Info */}
          <Card className="mb-6 bg-gradient-to-r from-blue-950/50 to-purple-950/50 border-blue-400/50">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="w-6 h-6 text-blue-300" />
                    <span className="text-2xl font-bold text-blue-100">
                      {formatEther(ggtAmount || BigInt(0))} GGT
                    </span>
                  </div>
                  {ethAmount && ethAmount > BigInt(0) && (
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      <span className="text-lg font-medium text-yellow-200">
                        + {formatEther(ethAmount)} ETH for gas
                      </span>
                    </div>
                  )}
                </div>
                
                {message && (
                  <div className="bg-black/30 p-3 rounded-lg border border-blue-400/30">
                    <p className="text-blue-100 italic">"{message}"</p>
                  </div>
                )}
                
                <div className="flex items-center justify-center gap-4 text-sm">
                  <Badge variant="outline" className="border-blue-400 text-blue-300">
                    <Clock className="w-3 h-3 mr-1" />
                    {timeRemaining}
                  </Badge>
                  <Badge variant="outline" className="border-purple-400 text-purple-300 capitalize">
                    {unlockType} unlock
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Connection */}
          {!isConnected ? (
            <Card className="mb-6 bg-yellow-950/30 border-yellow-400/50">
              <CardContent className="p-6 text-center">
                <h3 className="text-yellow-100 font-medium mb-2">Wallet Required</h3>
                <p className="text-yellow-200/80 text-sm mb-4">
                  You need a connected wallet to claim your gift. Don't have one?
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => authenticate()}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-black"
                  >
                    Connect Wallet {shouldUseGSN && '(Gasless Claiming!)'}
                  </Button>
                  <Button 
                    onClick={() => router.push(`/get-started/${giftId}`)}
                    variant="outline"
                    className="w-full border-yellow-400 text-yellow-200"
                  >
                    New to crypto? Get started here
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Claim Form */
            <Card className="mb-6 bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Claim Your Gift
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleClaimSubmit} className="space-y-4">
                  {/* Claim Code */}
                  <div>
                    <Label htmlFor="claimCode" className="text-gray-300">
                      Claim Code
                    </Label>
                    <Input
                      id="claimCode"
                      value={claimCode}
                      onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                      className="bg-gray-700 border-gray-600 text-white font-mono"
                      placeholder="HAPPY-GIFT-2025-ABC"
                      required
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Enter the claim code exactly as provided (spaces and dashes don't matter)
                    </p>
                  </div>

                  {/* Unlock Answer for password/quiz */}
                  {(unlockType === 'password' || unlockType === 'quiz') && (
                    <div>
                      <Label htmlFor="unlockAnswer" className="text-gray-300">
                        {unlockType === 'password' ? 'Password' : 'Answer'}
                      </Label>
                      {unlockType === 'quiz' && unlockData && (
                        <p className="text-gray-400 text-sm mb-2">Question: {unlockData}</p>
                      )}
                      <Input
                        id="unlockAnswer"
                        value={unlockAnswer}
                        onChange={(e) => setUnlockAnswer(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder={unlockType === 'password' ? 'Enter password' : 'Your answer'}
                        required
                      />
                    </div>
                  )}

                  {/* Location hint for GPS */}
                  {unlockType === 'gps' && unlockData && (
                    <div className="bg-blue-950/30 p-3 rounded-lg border border-blue-400/50">
                      <p className="text-blue-100 text-sm">
                        <strong>Location hint:</strong> {unlockData}
                      </p>
                      <p className="text-blue-200/80 text-xs mt-1">
                        You'll need to be at the correct location to claim this gift
                      </p>
                    </div>
                  )}

                  {/* Show gasless claim option if compatible */}
                  {isGaslessCompatible ? (
                    <div className="space-y-3">
                      <Button
                        onClick={handleGaslessClaimSubmit}
                        disabled={isGaslessClaiming || !claimCode.trim()}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isGaslessClaiming ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing Gasless Claim...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            ⚡ Claim Gasless {formatEther(ggtAmount || BigInt(0))} GGT
                            {ethAmount && ethAmount > BigInt(0) && ` + ${formatEther(ethAmount)} ETH`}
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="submit"
                        disabled={isClaiming || !claimCode.trim() || isGSNInitializing}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                        variant="outline"
                      >
                        {isClaiming ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Claiming Gift...
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4 mr-2" />
                            Direct Claim (Requires Gas)
                          </>
                        )}
                      </Button>
                      
                      <div className="p-3 bg-green-500/10 rounded text-sm">
                        <p className="text-green-400">
                          ⚡ <strong>Gasless claiming</strong>: You sign, relay pays gas, you get tokens!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isClaiming || !claimCode.trim() || isGSNInitializing}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isClaiming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {shouldUseGSN ? 'Claiming Gift (Gasless)...' : 'Claiming Gift...'}
                        </>
                      ) : isGSNInitializing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Initializing Gasless Claiming...
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4 mr-2" />
                          {shouldUseGSN ? '⚡ Claim Gasless' : 'Claim'} {formatEther(ggtAmount || BigInt(0))} GGT
                          {ethAmount && ethAmount > BigInt(0) && ` + ${formatEther(ethAmount)} ETH`}
                        </>
                      )}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-white font-medium mb-2">Need Help?</h3>
              <p className="text-gray-400 text-sm mb-3">
                Having trouble claiming your gift? Here are some tips:
              </p>
              <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                <li>Make sure you enter the claim code exactly as provided</li>
                <li>Check that your wallet is connected and on the correct network</li>
                <li>If you're new to crypto, use the "Get started" link above</li>
                <li>Gifts expire - check the time remaining above</li>
                {shouldUseGSN && (
                  <li className="text-green-400">⚡ Gasless claiming enabled - no transaction fees required!</li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Debug Info */}
          <GiftDebug giftId={giftId} />
        </div>
      </div>
    </MainLayout>
  );
}