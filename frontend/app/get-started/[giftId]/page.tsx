'use client';

import { useState, useEffect } from 'react';

// TypeScript declarations for MetaMask are defined globally
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MainLayout } from '@/components/layout/main-layout';
import { 
  Wallet, 
  Download, 
  Network, 
  Gift,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Sparkles
} from 'lucide-react';

const steps = [
  {
    id: 'install',
    title: 'Install MetaMask',
    description: 'Download the secure crypto wallet',
    icon: Download,
    time: '2 minutes'
  },
  {
    id: 'create',
    title: 'Create Your Wallet',
    description: 'Set up your secure wallet',
    icon: Wallet,
    time: '2 minutes'
  },
  {
    id: 'network',
    title: 'Join Test Network',
    description: 'Connect to Sepolia testnet',
    icon: Network,
    time: '30 seconds'
  },
  {
    id: 'claim',
    title: 'Claim Your Gift',
    description: 'Receive your crypto tokens',
    icon: Gift,
    time: '30 seconds'
  }
];

export default function GetStartedPage() {
  const params = useParams();
  const giftId = params.giftId as string;
  const [currentStep, setCurrentStep] = useState(0);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  
  useEffect(() => {
    const checkWalletStatus = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        setHasMetaMask(true);
        
        try {
          // Check if wallet is connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          setHasWallet(accounts.length > 0);
          
          // Check network
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setIsCorrectNetwork(chainId === '0xaa36a7'); // Sepolia testnet
          
          // Auto-advance steps based on wallet state
          if (accounts.length > 0) {
            if (chainId === '0xaa36a7') {
              setCurrentStep(3); // Ready to claim
            } else {
              setCurrentStep(2); // Need to switch network
            }
          } else {
            setCurrentStep(1); // Need to create/connect wallet
          }
        } catch (error) {
          console.error('Error checking wallet status:', error);
          setCurrentStep(1); // Default to wallet creation step
        }
      }
    };
    
    checkWalletStatus();
  }, []);
  
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  const addSepoliaNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7',
          chainName: 'Sepolia Testnet',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://sepolia.infura.io/v3/'],
          blockExplorerUrls: ['https://sepolia.etherscan.io/']
        }]
      });
      setIsCorrectNetwork(true);
      setCurrentStep(3);
    } catch (error) {
      console.error('Failed to add network:', error);
    }
  };
  
  const connectWallet = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      setHasWallet(true);
      
      // Check network after connecting
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId === '0xaa36a7') {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };
  
  return (
    <MainLayout>
      <div className="min-h-screen gradient-dark-bg py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              You Have a Crypto Gift Waiting! 🎁
            </h1>
            <p className="text-gray-400">
              Let's get you set up to claim it - it only takes 5 minutes
            </p>
          </div>

          {/* Progress */}
          <Card className="mb-8 bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm text-cyan-400">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              const isUpcoming = index > currentStep;
              
              return (
                <Card 
                  key={step.id}
                  className={`border-2 transition-all ${
                    isActive 
                      ? 'border-cyan-400/50 bg-cyan-400/10 shadow-md shadow-cyan-400/20' 
                      : isComplete
                      ? 'border-green-400/50 bg-green-400/10'
                      : 'border-gray-600 bg-gray-700/30 opacity-60'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        isComplete
                          ? 'bg-green-500 text-black'
                          : isActive
                          ? 'bg-cyan-500 text-black'
                          : 'bg-gray-600 text-gray-400'
                      }`}>
                        {isComplete ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {step.title}
                        </h3>
                        <p className="text-gray-400">{step.description}</p>
                        <span className="text-sm text-cyan-400">{step.time}</span>
                      </div>
                      
                      {/* Action */}
                      {isActive && (
                        <div className="space-y-2">
                          {step.id === 'install' && (
                            <Button
                              onClick={() => window.open('https://metamask.io/download/', '_blank')}
                              className="bg-cyan-500 hover:bg-cyan-600 text-black w-full"
                            >
                              Download MetaMask
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          )}
                          
                          {step.id === 'create' && (
                            <div className="space-y-2">
                              <Button
                                onClick={connectWallet}
                                className="bg-cyan-500 hover:bg-cyan-600 text-black w-full"
                              >
                                Connect Wallet
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                              <Button
                                onClick={() => window.open('https://metamask.io/', '_blank')}
                                variant="outline"
                                className="w-full text-xs"
                              >
                                Need to create a wallet? Visit MetaMask.io
                              </Button>
                            </div>
                          )}
                          
                          {step.id === 'network' && (
                            <div className="space-y-2">
                              <Button
                                onClick={addSepoliaNetwork}
                                className="bg-cyan-500 hover:bg-cyan-600 text-black w-full"
                              >
                                Add Sepolia Network
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                              <p className="text-xs text-gray-400">
                                This will automatically add the Sepolia testnet to your MetaMask
                              </p>
                            </div>
                          )}
                          
                          {step.id === 'claim' && (
                            <Button
                              onClick={() => window.location.href = `/claim-newuser/${giftId}`}
                              className="bg-green-500 hover:bg-green-600 text-black w-full"
                            >
                              🎁 Claim Your Gift!
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* MetaMask Detection */}
          {hasMetaMask && (
            <Card className="mt-6 border-green-400/50 bg-green-400/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">MetaMask detected! You can skip to step 2.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help */}
          <Card className="mt-6 bg-blue-900/20 border-blue-400/50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-medium">Need Help?</p>
                  <p className="text-gray-400 text-sm">
                    Don't worry! Each step has detailed instructions. Your gift will wait for you.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}