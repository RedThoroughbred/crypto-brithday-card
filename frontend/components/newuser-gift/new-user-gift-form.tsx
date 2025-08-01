'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Gift, Clock, Shield, HelpCircle } from 'lucide-react';
import { useNewUserGiftEscrow } from '@/hooks/useNewUserGiftEscrow';
import { useNewUserGiftEscrowGSN } from '@/hooks/useNewUserGiftEscrowGSN';
import { useGSNProvider } from '@/hooks/useGSNProvider';
import { useSimpleRelayEscrow } from '@/hooks/useSimpleRelayEscrow';
import { Switch } from '@/components/ui/switch';
import { formatClaimCodeForDisplay } from '@/lib/newuser-gift';

const newUserGiftSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(val => {
    const num = parseFloat(val);
    return num > 0 && num <= 10000;
  }, 'Amount must be between 0 and 10,000 GGT'),
  ethAmount: z.string().min(1, 'ETH amount is required').refine(val => {
    const num = parseFloat(val);
    return num >= 0.001 && num <= 0.1;
  }, 'ETH amount must be between 0.001 and 0.1'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
  expiryDays: z.string().refine(val => {
    const num = parseInt(val);
    return num >= 1 && num <= 365;
  }, 'Expiry must be between 1 and 365 days'),
  unlockType: z.enum(['simple', 'password', 'quiz', 'gps']),
  unlockAnswer: z.string().optional(),
  unlockData: z.string().optional(),
});

type NewUserGiftForm = z.infer<typeof newUserGiftSchema>;

interface NewUserGiftFormProps {
  onSuccess: (giftId: string, claimCode: string, formData: {
    amount: string;
    message: string;
    expiryDays: number;
    unlockType: string;
  }) => void;
  onCancel: () => void;
}

export function NewUserGiftForm({ onSuccess, onCancel }: NewUserGiftFormProps) {
  const { createNewUserGift: createLegacy, isCreating: isCreatingLegacy, createdGiftId: createdGiftIdLegacy, claimCode: claimCodeLegacy, createError: createErrorLegacy } = useNewUserGiftEscrow();
  const { createGift: createGSN, isLoading: isCreatingGSN, contractAddress: gsnContractAddress, isGSNEnabled } = useNewUserGiftEscrowGSN();
  const { isGSNAvailable, isInitializing: isGSNInitializing } = useGSNProvider();
  const { createGift: createRelay, isCreating: isCreatingRelay, createdGiftId: createdGiftIdRelay, claimCode: claimCodeRelay, createError: createErrorRelay } = useSimpleRelayEscrow();
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submittedFormData, setSubmittedFormData] = useState<any>(null);
  const [useGasless, setUseGasless] = useState(true); // Default to gasless if available
  const [gsnGiftResult, setGsnGiftResult] = useState<{ giftId: string; claimCode: string } | null>(null);
  
  // Determine which gift creation method to use
  const shouldUseRelay = useGasless; // Use relay for gasless claiming
  const shouldUseGSN = !useGasless && isGSNAvailable && isGSNEnabled && gsnContractAddress;
  const shouldUseLegacy = !useGasless && !shouldUseGSN;
  
  const isCreating = shouldUseRelay ? isCreatingRelay : shouldUseGSN ? isCreatingGSN : isCreatingLegacy;
  const createdGiftId = shouldUseRelay ? createdGiftIdRelay : shouldUseGSN ? gsnGiftResult?.giftId : createdGiftIdLegacy;
  const claimCode = shouldUseRelay ? claimCodeRelay : shouldUseGSN ? gsnGiftResult?.claimCode : claimCodeLegacy;
  const createError = shouldUseRelay ? createErrorRelay : shouldUseGSN ? null : createErrorLegacy;

  // Debug the form state
  React.useEffect(() => {
    console.log('NewUserGiftForm state:', { isCreating, createdGiftId, claimCode, createError });
  }, [isCreating, createdGiftId, claimCode, createError]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<NewUserGiftForm>({
    resolver: zodResolver(newUserGiftSchema),
    defaultValues: {
      amount: '100',
      ethAmount: '0.005',
      message: '',
      expiryDays: '30',
      unlockType: 'simple',
    },
  });

  const unlockType = watch('unlockType');

  const onSubmit = async (data: NewUserGiftForm) => {
    console.log('NewUserGiftForm - Submitting:', data, 'Method:', { shouldUseRelay, shouldUseGSN, shouldUseLegacy });
    
    // Store form data for success callback
    const formData = {
      amount: data.amount,
      ethAmount: data.ethAmount,
      message: data.message,
      expiryDays: parseInt(data.expiryDays),
      unlockType: data.unlockType,
    };
    setSubmittedFormData(formData);
    
    try {
      if (shouldUseRelay) {
        console.log('⚡ Creating gasless-compatible gift with SimpleRelayEscrow...');
        await createRelay({
          amount: data.amount,
          ethAmount: data.ethAmount,
          message: data.message,
          expiryDays: parseInt(data.expiryDays),
          unlockType: data.unlockType,
          unlockAnswer: data.unlockAnswer,
          unlockData: data.unlockData,
        });
      } else if (shouldUseGSN) {
        console.log('🚀 Creating GSN gift...');
        
        // Generate claim code for GSN (since GSN returns only giftId and txHash)
        const { generateClaimCode } = await import('@/hooks/useNewUserGiftEscrowGSN');
        const generatedClaimCode = generateClaimCode();
        
        const result = await createGSN({
          claimCode: generatedClaimCode,
          ggtAmount: data.amount,
          gasAllowance: data.ethAmount,
          expiryDays: parseInt(data.expiryDays),
          message: data.message,
          unlockType: data.unlockType,
          unlockAnswer: data.unlockAnswer,
          unlockData: data.unlockData,
        });
        
        if (result) {
          setGsnGiftResult({
            giftId: result.giftId,
            claimCode: generatedClaimCode,
          });
        }
      } else {
        console.log('📦 Creating legacy gift...');
        await createLegacy({
          amount: data.amount,
          ethAmount: data.ethAmount,
          message: data.message,
          expiryDays: parseInt(data.expiryDays),
          unlockType: data.unlockType,
          unlockAnswer: data.unlockAnswer,
          unlockData: data.unlockData,
        });
      }
    } catch (error) {
      console.error('NewUserGiftForm - Submit error:', error);
    }
  };

  // Handle success in useEffect to avoid React warnings
  React.useEffect(() => {
    if (createdGiftId && claimCode && submittedFormData) {
      console.log('🎉 Calling onSuccess with:', { createdGiftId, claimCode, submittedFormData });
      onSuccess(createdGiftId, claimCode, submittedFormData);
    }
  }, [createdGiftId, claimCode, submittedFormData]); // Removed onSuccess from deps to prevent infinite loop

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-blue-950/30 border-blue-400/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-100">
            <Users className="w-5 h-5" />
            Send Gift to New Crypto User
          </CardTitle>
          <p className="text-blue-200/80 text-sm">
            Perfect for friends who don't have a crypto wallet yet! They'll get a claim code 
            and step-by-step setup guide.
          </p>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Gasless Toggle */}
        <Card className="bg-purple-950/30 border-purple-400/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-purple-100 font-medium">⚡ Gasless Claiming</Label>
                <p className="text-purple-200/80 text-sm">
                  {useGasless ? 'Recipients won\'t need any ETH to claim their gift!' : 'Recipients will need ETH for transaction fees'}
                </p>
                <p className="text-purple-300/60 text-xs">
                  {useGasless ? 'Uses SimpleRelayEscrow for true gasless claiming' : 'Uses standard escrow contracts'}
                </p>
              </div>
              <Switch
                checked={useGasless}
                onCheckedChange={setUseGasless}
              />
            </div>
          </CardContent>
        </Card>

        {/* Basic Gift Details */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Gift Details {shouldUseRelay && <Badge className="bg-green-600 text-white">⚡ Gasless</Badge>}
              {shouldUseGSN && <Badge className="bg-purple-600 text-white">GSN</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount */}
            <div>
              <Label htmlFor="amount" className="text-gray-300">
                Amount (GGT)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="10000"
                {...register('amount')}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="100"
              />
              {errors.amount && (
                <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* ETH Amount for Gas */}
            <div>
              <Label htmlFor="ethAmount" className="text-gray-300">
                {shouldUseRelay ? 'Gas Sponsoring Fund (ETH)' : shouldUseGSN ? 'Gas Sponsoring Fund (ETH)' : 'Gas Money (ETH)'}
              </Label>
              <Input
                id="ethAmount"
                type="number"
                step="0.001"
                min="0.001"
                max="0.1"
                {...register('ethAmount')}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="0.005"
              />
              {errors.ethAmount && (
                <p className="text-red-400 text-sm mt-1">{errors.ethAmount.message}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                {shouldUseRelay 
                  ? '⚡ This ETH sponsors gasless transactions via our relay service!' 
                  : shouldUseGSN 
                  ? '⚡ This ETH will sponsor gasless transactions for the recipient!' 
                  : 'Recipients need ETH for transaction fees. 0.005 ETH covers ~10-20 transactions.'
                }
              </p>
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message" className="text-gray-300">
                Personal Message
              </Label>
              <Textarea
                id="message"
                {...register('message')}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Happy birthday! Here's your first crypto gift..."
                rows={3}
              />
              {errors.message && (
                <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>
              )}
            </div>

            {/* Expiry */}
            <div>
              <Label htmlFor="expiryDays" className="text-gray-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Expires in (days)
              </Label>
              <Select
                value={watch('expiryDays')}
                onValueChange={(value) => setValue('expiryDays', value)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days (recommended)</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-gray-400 text-xs mt-1">
                You can get a refund if the gift isn't claimed by the expiry date
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Unlock Method */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              How should they unlock it?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Unlock Method</Label>
              <Select
                value={unlockType}
                onValueChange={(value: 'simple' | 'password' | 'quiz' | 'gps') => 
                  setValue('unlockType', value)
                }
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">
                    Simple - Just the claim code
                  </SelectItem>
                  <SelectItem value="password">
                    Password - They need a secret password
                  </SelectItem>
                  <SelectItem value="quiz">
                    Quiz - They answer a question
                  </SelectItem>
                  <SelectItem value="gps">
                    Location - They visit a specific place
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password unlock */}
            {unlockType === 'password' && (
              <div>
                <Label htmlFor="unlockAnswer" className="text-gray-300">
                  Secret Password
                </Label>
                <Input
                  id="unlockAnswer"
                  {...register('unlockAnswer')}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter the password they'll need"
                />
                <p className="text-gray-400 text-xs mt-1">
                  They'll need to enter this exact password to claim the gift
                </p>
              </div>
            )}

            {/* Quiz unlock */}
            {unlockType === 'quiz' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="unlockData" className="text-gray-300">
                    Quiz Question
                  </Label>
                  <Input
                    id="unlockData"
                    {...register('unlockData')}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="What's your favorite color?"
                  />
                </div>
                <div>
                  <Label htmlFor="unlockAnswer" className="text-gray-300">
                    Correct Answer
                  </Label>
                  <Input
                    id="unlockAnswer"
                    {...register('unlockAnswer')}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="blue"
                  />
                </div>
              </div>
            )}

            {/* GPS unlock */}
            {unlockType === 'gps' && (
              <div>
                <Label htmlFor="unlockData" className="text-gray-300">
                  Location Description
                </Label>
                <Input
                  id="unlockData"
                  {...register('unlockData')}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="The coffee shop on Main Street"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Note: GPS location will be set when they claim (this is just a description)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="bg-green-950/30 border-green-400/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <h3 className="text-green-100 font-medium mb-2">How it works:</h3>
                <ol className="text-green-200/80 text-sm space-y-1 list-decimal list-inside">
                  <li>You create the gift and get a unique claim code</li>
                  <li>Send them the claim code via email (we'll help with a template)</li>
                  <li>They follow the link to set up their wallet</li>
                  <li>They enter the claim code to receive the crypto</li>
                  <li>If they don't claim it by the expiry date, you get your money back</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <div className={`border rounded-lg p-4 ${
          shouldUseRelay 
            ? 'bg-green-900/30 border-green-600/50' 
            : shouldUseGSN 
            ? 'bg-purple-900/30 border-purple-600/50' 
            : 'bg-blue-900/30 border-blue-600/50'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${
              shouldUseRelay ? 'text-green-400' : shouldUseGSN ? 'text-purple-400' : 'text-blue-400'
            }`}>
              {shouldUseRelay || shouldUseGSN ? '⚡' : 'ℹ️'}
            </div>
            <div className="text-sm">
              {shouldUseRelay ? (
                <>
                  <p className="text-green-200 font-medium mb-1">Gasless Gift Creation (Relay Service)</p>
                  <p className="text-green-300/80">
                    1. First you'll approve GGT tokens<br/>
                    2. Then create your gasless-compatible gift<br/>
                    <span className="text-xs text-green-400">You'll see two MetaMask popups automatically</span>
                  </p>
                  <p className="text-green-300/80 mt-2 text-xs">
                    ⚡ Recipients can claim completely gasless using our relay service!
                  </p>
                </>
              ) : shouldUseGSN ? (
                <>
                  <p className="text-purple-200 font-medium mb-1">GSN Gift Creation</p>
                  <p className="text-purple-300/80">
                    1. First you'll approve GGT tokens<br/>
                    2. Then create your GSN gift<br/>
                    <span className="text-xs text-purple-400">You'll see two MetaMask popups automatically</span>
                  </p>
                  <p className="text-purple-300/80 mt-2 text-xs">
                    ⚡ The recipient won't need ANY ETH to claim their gift - completely gasless!
                  </p>
                </>
              ) : (
                <>
                  <p className="text-blue-200 font-medium mb-1">Two-Step Process</p>
                  <p className="text-blue-300/80">
                    1. First you'll approve GGT tokens<br/>
                    2. Then create your gift (includes ETH for gas)<br/>
                    <span className="text-xs text-blue-400">You'll see two MetaMask popups automatically</span>
                  </p>
                  <p className="text-blue-300/80 mt-2 text-xs">
                    💡 The ETH you include helps new users pay for their first transactions
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isCreating}
            className={`flex-1 text-white ${
              shouldUseRelay 
                ? 'bg-green-600 hover:bg-green-700' 
                : shouldUseGSN 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isCreating ? (
              shouldUseRelay ? 'Creating Gasless Gift...' : shouldUseGSN ? 'Creating GSN Gift...' : 'Creating Gift...'
            ) : (
              <>
                {shouldUseRelay ? '⚡ Create Gasless Gift' : shouldUseGSN ? '⚡ Create GSN Gift' : 'Create New User Gift'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}