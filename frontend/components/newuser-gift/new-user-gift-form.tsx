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
import { formatClaimCodeForDisplay } from '@/lib/newuser-gift';

const newUserGiftSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(val => {
    const num = parseFloat(val);
    return num > 0 && num <= 10000;
  }, 'Amount must be between 0 and 10,000 GGT'),
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
  const { createNewUserGift, isCreating, createdGiftId, claimCode, createError } = useNewUserGiftEscrow();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submittedFormData, setSubmittedFormData] = useState<any>(null);

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
      message: '',
      expiryDays: '30',
      unlockType: 'simple',
    },
  });

  const unlockType = watch('unlockType');

  const onSubmit = async (data: NewUserGiftForm) => {
    console.log('NewUserGiftForm - Submitting:', data);
    
    // Store form data for success callback
    setSubmittedFormData({
      amount: data.amount,
      message: data.message,
      expiryDays: parseInt(data.expiryDays),
      unlockType: data.unlockType,
    });
    
    try {
      await createNewUserGift({
        amount: data.amount,
        message: data.message,
        expiryDays: parseInt(data.expiryDays),
        unlockType: data.unlockType,
        unlockAnswer: data.unlockAnswer,
        unlockData: data.unlockData,
      });
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
        {/* Basic Gift Details */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Gift Details
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
        <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-400 mt-0.5">ℹ️</div>
            <div className="text-sm">
              <p className="text-blue-200 font-medium mb-1">Two-Step Process</p>
              <p className="text-blue-300/80">
                1. First you'll approve GGT tokens<br/>
                2. Then create your gift<br/>
                <span className="text-xs text-blue-400">You'll see two MetaMask popups automatically</span>
              </p>
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isCreating ? 'Creating Gift...' : 'Create New User Gift'}
          </Button>
        </div>
      </form>
    </div>
  );
}