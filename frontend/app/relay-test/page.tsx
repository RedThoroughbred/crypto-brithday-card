'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MainLayout } from '@/components/layout/main-layout';
import { Loader2, Gift, CheckCircle, Zap } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { formatEther, keccak256, encodePacked } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// SimpleRelayEscrow ABI
const RELAY_ESCROW_ABI = [
  {
    "inputs": [{"name": "giftId", "type": "bytes32"}],
    "name": "getGift",
    "outputs": [
      {"name": "sender", "type": "address"},
      {"name": "ggtAmount", "type": "uint256"},
      {"name": "gasAllowance", "type": "uint256"},
      {"name": "expiry", "type": "uint256"},
      {"name": "claimed", "type": "bool"},
      {"name": "refunded", "type": "bool"},
      {"name": "message", "type": "string"},
      {"name": "unlockType", "type": "string"},
      {"name": "unlockData", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "giftId", "type": "bytes32"},
      {"name": "claimCode", "type": "string"},
      {"name": "unlockAnswer", "type": "string"}
    ],
    "name": "claimGift",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const RELAY_ESCROW_ADDRESS = '0x8284ab51a3221c7b295f949512B43DA1EB0Cd44f' as const;
const GIFT_ID = '0x0896225e666064ae1186f8b6ececdca2deb86613c35e2ab20eeec026d2bdd31a';

export default function RelayTestPage() {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, authenticate } = useAuth();
  const { toast } = useToast();
  const [claimCode, setClaimCode] = useState('RELAY-TEST-2025-XYZ');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isRelayLoading, setIsRelayLoading] = useState(false);
  
  // Hook for signing messages (for gasless claims)
  const { signMessageAsync } = useSignMessage();
  
  // Read gift details with stable caching
  const { data: giftDetails } = useReadContract({
    address: RELAY_ESCROW_ADDRESS,
    abi: RELAY_ESCROW_ABI,
    functionName: 'getGift',
    args: [GIFT_ID as `0x${string}`],
    query: {
      staleTime: Infinity, // Never consider stale during this session
      gcTime: Infinity, // Never garbage collect during this session
    }
  });
  
  // Transaction hooks
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  // Handle authentication
  const handleConnect = async () => {
    if (!isConnected) {
      toast({
        title: 'Connect your wallet',
        description: 'Use the Connect Wallet button in the top right',
      });
      return;
    }
    
    if (!isAuthenticated) {
      await authenticate();
    }
  };
  
  // Handle direct claim (requires gas from user)
  const handleClaim = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect Wallet 3 (0x3465...1002)',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isAuthenticated) {
      await authenticate();
      return;
    }
    
    try {
      console.log('Direct claiming with:', { giftId: GIFT_ID, claimCode });
      
      await writeContract({
        address: RELAY_ESCROW_ADDRESS,
        abi: RELAY_ESCROW_ABI,
        functionName: 'claimGift',
        args: [
          GIFT_ID as `0x${string}`,
          claimCode,
          '' // empty unlock answer for simple gift
        ],
        gas: 300000n,
      });
      
    } catch (error) {
      console.error('Direct claim error:', error);
      toast({
        title: 'Direct Claim Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };
  
  // Handle gasless claim (user signs, relay pays gas)
  const handleGaslessClaim = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect Wallet 3 (0x3465...1002)',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isAuthenticated) {
      await authenticate();
      return;
    }
    
    try {
      setIsRelayLoading(true);
      console.log('Starting gasless claim for:', { giftId: GIFT_ID, recipient: address, claimCode });
      
      // Step 1: Get nonce from relay service
      const nonceResponse = await fetch(`http://localhost:3001/nonce/${GIFT_ID}`);
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce from relay service');
      }
      const { nonce } = await nonceResponse.json();
      console.log('Got nonce:', nonce);
      
      // Step 2: Create message hash
      const hashResponse = await fetch('http://localhost:3001/create-claim-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: GIFT_ID,
          recipient: address,
          claimCode,
          unlockAnswer: '',
          nonce
        })
      });
      
      if (!hashResponse.ok) {
        throw new Error('Failed to create claim hash');
      }
      const { messageHash } = await hashResponse.json();
      console.log('Got message hash:', messageHash);
      
      // Step 3: Sign the message hash
      toast({
        title: 'Sign Message',
        description: 'Please sign the claim message in your wallet',
      });
      
      const signature = await signMessageAsync({
        message: { raw: messageHash as `0x${string}` }
      });
      console.log('Message signed:', signature);
      
      // Step 4: Submit to relay service
      toast({
        title: 'Processing Claim',
        description: 'Relay is processing your gasless claim...',
      });
      
      const claimResponse = await fetch('http://localhost:3001/relay-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: GIFT_ID,
          recipient: address,
          claimCode,
          unlockAnswer: '',
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
      
      setShowSuccess(true);
      toast({
        title: '🎉 Gasless Claim Successful!',
        description: `Transaction: ${result.transactionHash.slice(0, 10)}...`,
      });
      
    } catch (error) {
      console.error('Gasless claim error:', error);
      toast({
        title: 'Gasless Claim Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsRelayLoading(false);
    }
  };
  
  // Show success when transaction completes
  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      toast({
        title: '🎉 Gift Claimed!',
        description: '25 GGT has been sent to your wallet',
      });
    }
  }, [isSuccess, toast]);
  
  // Parse gift details
  const [sender, ggtAmount, gasAllowance, expiry, claimed, refunded, message] = giftDetails || [];
  
  if (showSuccess || claimed) {
    return (
      <MainLayout>
        <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
          <Card className="w-full max-w-md border-green-400/50 bg-green-400/10">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Gift Claimed! 🎉</h2>
              <p className="text-green-400 text-xl mb-4">{formatEther(ggtAmount || 0n)} GGT</p>
              <p className="text-gray-400">Check your wallet for the tokens</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="min-h-screen gradient-dark-bg py-12">
        <div className="container mx-auto px-4 max-w-xl">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            Relay System Test
          </h1>
          
          {/* Gift Details */}
          <Card className="mb-6 bg-gradient-to-r from-blue-950/50 to-purple-950/50 border-blue-400/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Test Gift
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {giftDetails ? (
                <>
                  <p className="text-2xl font-bold text-blue-100">{formatEther(ggtAmount || 0n)} GGT</p>
                  <p className="text-sm text-gray-400">From: {sender?.slice(0, 10)}...</p>
                  <p className="text-sm text-gray-400">Gas Allowance: {formatEther(gasAllowance || 0n)} ETH</p>
                  {message && <p className="text-blue-100 italic mt-2">"{message}"</p>}
                </>
              ) : (
                <p className="text-gray-400">Loading gift details...</p>
              )}
            </CardContent>
          </Card>
          
          {/* Wallet Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Wallet Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Connected:</span>
                <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                  {isConnected ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Authenticated:</span>
                <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                  {isAuthenticated ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              {address && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Address:</span>
                  <span className="text-white font-mono text-sm">{address.slice(0, 8)}...</span>
                </div>
              )}
              <div className="text-xs text-yellow-400 mt-2">
                Expected: Wallet 3 (0x34658EE3...1002) with 0 ETH
              </div>
            </CardContent>
          </Card>
          
          {/* Claim Form */}
          <Card>
            <CardHeader>
              <CardTitle>Claim Gift</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Connect Wallet 3 to test gasless claiming</p>
                  <Button onClick={handleConnect} className="w-full">
                    Connect Wallet
                  </Button>
                </div>
              ) : !isAuthenticated ? (
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Authenticate to continue</p>
                  <Button onClick={authenticate} className="w-full">
                    Authenticate
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <Label>Claim Code</Label>
                    <Input
                      value={claimCode}
                      onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                      className="bg-gray-700 text-white font-mono"
                      placeholder="RELAY-TEST-2025-XYZ"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={handleGaslessClaim}
                      disabled={isRelayLoading || !claimCode}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isRelayLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing Gasless Claim...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          ⚡ Gasless Claim {formatEther(ggtAmount || 0n)} GGT
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleClaim}
                      disabled={isPending || isConfirming || !claimCode}
                      className="w-full bg-red-600 hover:bg-red-700"
                      variant="outline"
                    >
                      {isPending || isConfirming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isConfirming ? 'Confirming...' : 'Claiming...'}
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4 mr-2" />
                          Direct Claim (Requires Gas)
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-green-500/10 rounded text-sm">
                    <p className="text-green-400">
                      ⚡ <strong>Gasless claiming</strong>: You sign, Wallet 2 pays gas, you get tokens!
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}