'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
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
  Sparkles
} from 'lucide-react';
import { useNewUserGiftEscrow } from '@/hooks/useNewUserGiftEscrow';
import { useAuth } from '@/hooks/useAuth';
import { formatClaimCodeForDisplay, cleanClaimCodeInput, isValidClaimCode, formatTimeRemaining } from '@/lib/newuser-gift';
import { formatEther } from 'viem';
import { Confetti, FloatingGifts } from '@/components/ui/confetti';

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
  
  const { claimGift, isClaiming, useGiftDetails, useIsClaimable } = useNewUserGiftEscrow();
  
  // Get gift details
  const { data: giftDetails, isLoading: loadingDetails } = useGiftDetails(giftId);
  const { data: isClaimable, isLoading: loadingClaimable } = useIsClaimable(giftId);
  
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
    
    await claimGift({
      giftId,
      claimCode: cleanCode,
      unlockAnswer,
    });
    
    // Show celebration effects
    setShowClaimed(true);
    setClaimSuccess(true);
    setShowConfetti(true);
  };
  
  if (loadingDetails || loadingClaimable) {
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
  
  if (!giftDetails || !giftDetails[0]) {
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
  
  const [sender, amount, expiry, claimed, refunded, message, unlockType, unlockData] = giftDetails;
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
              <div className="bg-black/30 p-4 rounded-lg">
                <p className="text-2xl font-bold text-green-400">
                  {formatEther(amount)} GGT
                </p>
                <p className="text-gray-400 text-sm">has been sent to your wallet</p>
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
                <div className="flex items-center justify-center gap-2">
                  <Gift className="w-6 h-6 text-blue-300" />
                  <span className="text-2xl font-bold text-blue-100">
                    {formatEther(amount)} GGT
                  </span>
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
                    Connect Wallet
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

                  <Button
                    type="submit"
                    disabled={isClaiming || !claimCode.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Claiming Gift...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Claim {formatEther(amount)} GGT
                      </>
                    )}
                  </Button>
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
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}