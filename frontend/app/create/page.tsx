'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocationEscrow } from '@/hooks/useLocationEscrow';
import { 
  MapPin, 
  Gift, 
  MessageSquare, 
  DollarSign,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Video,
  Image,
  FileText,
  HelpCircle,
  Lock,
  Link,
  Users,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/main-layout';
import { GiftCreatedModal } from '@/components/gift-created-modal';
import { NewUserGiftForm } from '@/components/newuser-gift/new-user-gift-form';
import { NewUserGiftSuccessModal } from '@/components/newuser-gift/new-user-gift-success-modal';
import { useSimpleRelayEscrow } from '@/hooks/useSimpleRelayEscrow';

const createGiftSchema = z.object({
  recipientAddress: z.string().min(42, 'Invalid Ethereum address').max(42, 'Invalid Ethereum address'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.enum(['ETH', 'GGT']).default('ETH'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
  clue: z.string().max(200, 'Clue too long').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(1).max(1000).optional(),
  expiryDays: z.number().min(1).max(365),
  unlockType: z.enum(['GPS', 'VIDEO', 'IMAGE', 'MARKDOWN', 'QUIZ', 'PASSWORD', 'URL']).default('GPS'),
  unlockChallengeData: z.string().max(5000, 'Challenge data too long').optional(),
  rewardContent: z.string().max(2000, 'Reward content too long').optional(),
  rewardContentType: z.enum(['url', 'file', 'message', 'none']).optional(),
  gasless: z.boolean().optional(),
  ethAmount: z.string().optional(), // ETH amount for gas sponsoring (when gasless = true)
}).refine((data) => {
  // If gasless mode is enabled, ETH amount is required
  if (data.gasless && (!data.ethAmount || parseFloat(data.ethAmount) <= 0)) {
    return false;
  }
  return true;
}, {
  message: "ETH amount is required for gasless gifts",
  path: ["ethAmount"],
});

type CreateGiftForm = z.infer<typeof createGiftSchema>;

const steps = [
  { id: 1, title: 'Gift Details', icon: Gift },
  { id: 2, title: 'Location & Clues', icon: MapPin },
  { id: 3, title: 'Review & Create', icon: MessageSquare },
];

export default function CreateGiftPage() {
  const { address, isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserGiftData, setNewUserGiftData] = useState<{
    giftId: string;
    claimCode: string;
    amount: string;
    ethAmount?: string;
    message: string;
    expiryDays: number;
    unlockType: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'wallet' | 'newuser'>('wallet');
  const [isGaslessMode, setIsGaslessMode] = useState(false);
  
  // Smart contract integration
  const { 
    createGift, 
    isCreating, 
    createError, 
    createdGiftId, 
    createTxHash, 
    isTxSuccess,
    resetCreateState 
  } = useLocationEscrow();

  // Gasless direct gift integration
  const { 
    createDirectGift,
    isCreating: isCreatingGasless,
    createError: createErrorGasless,
    createdGiftId: createdGiftIdGasless,
  } = useSimpleRelayEscrow();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid, isValidating },
  } = useForm<CreateGiftForm>({
    resolver: zodResolver(createGiftSchema),
    defaultValues: {
      radius: 50,
      expiryDays: 30,
      currency: 'GGT', // Default to GGT since you have 1M tokens!
      unlockType: 'GPS',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();
  
  // Update form values when location is selected
  useEffect(() => {
    if (selectedLocation) {
      setValue('latitude', selectedLocation.lat);
      setValue('longitude', selectedLocation.lng);
      // Trigger validation after setting coordinates
      trigger();
    }
  }, [selectedLocation, setValue, trigger]);
  
  // Debug form state (development only) - disabled to reduce console noise
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('Form state:', { isValid, currentStep, unlockType: watchedValues.unlockType });
  // }

  // Show modal when gift is successfully created (traditional or gasless)
  useEffect(() => {
    if (isTxSuccess && createdGiftId) {
      setShowGiftModal(true);
    }
  }, [isTxSuccess, createdGiftId]);

  // Show modal when gasless direct gift is successfully created
  useEffect(() => {
    if (createdGiftIdGasless) {
      setShowGiftModal(true);
    }
  }, [createdGiftIdGasless]);

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
          <Card className="w-full max-w-md card-glow">
            <CardHeader className="text-center">
              <CardTitle className="text-white">Connect Your Wallet</CardTitle>
              <CardDescription className="text-gray-400">
                Please connect your wallet to create a gift
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setValue('latitude', lat);
    setValue('longitude', lng);
  };

  const onSubmit = async (data: CreateGiftForm) => {
    // Only require location for GPS unlock type
    if (data.unlockType === 'GPS' && !selectedLocation) {
      console.error('No location selected for GPS gift');
      return;
    }
    
    try {
      // Check if this is a gasless direct gift
      if (data.gasless && data.currency === 'GGT' && data.ethAmount) {
        console.log('🚀 Creating gasless direct gift via SimpleRelayEscrow');
        
        await createDirectGift({
          recipientAddress: data.recipientAddress,
          amount: data.amount,
          ethAmount: data.ethAmount,
          message: data.message,
          expiryDays: data.expiryDays,
          unlockType: data.unlockType.toLowerCase(),
          unlockAnswer: data.unlockChallengeData,
          unlockData: data.unlockType === 'GPS' ? `${selectedLocation?.lat},${selectedLocation?.lng}` : data.unlockChallengeData
        });
        
        // Show success - createDirectGift will handle toasts
        console.log('✅ Gasless direct gift created successfully');
        
      } else {
        // Traditional gift creation (recipient pays gas)
        console.log('📤 Creating traditional gift via LocationEscrow');
        
        await createGift({
          recipientAddress: data.recipientAddress,
          amount: data.amount,
          currency: data.currency,
          latitude: data.unlockType === 'GPS' ? selectedLocation!.lat : 0,
          longitude: data.unlockType === 'GPS' ? selectedLocation!.lng : 0,
          radius: data.unlockType === 'GPS' ? data.radius! : 50,
          clue: data.clue || '',
          message: data.message,
          expiryDays: data.expiryDays,
          unlockType: data.unlockType,
          unlockChallengeData: data.unlockChallengeData,
          rewardContent: data.rewardContentType === 'none' ? undefined : data.rewardContent,
          rewardContentType: data.rewardContentType === 'none' ? undefined : data.rewardContentType,
        });
      }
    } catch (error) {
      console.error('Failed to create gift:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNewUserGiftSuccess = (giftId: string, claimCode: string, formData: {
    amount: string;
    ethAmount?: string;
    message: string;
    expiryDays: number;
    unlockType: string;
  }) => {
    console.log('handleNewUserGiftSuccess called with:', { giftId, claimCode, formData });
    
    // Store data for success modal with actual form data
    setNewUserGiftData({
      giftId,
      claimCode,
      amount: formData.amount,
      ethAmount: formData.ethAmount,
      message: formData.message,
      expiryDays: formData.expiryDays,
      unlockType: formData.unlockType,
    });
    setShowNewUserModal(true);
  };

  const handleNewUserGiftCancel = () => {
    setActiveTab('wallet');
  };

  return (
    <MainLayout>
      <div className="min-h-screen gradient-dark-bg">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-glow-white">Create a GeoGift</h1>
              <p className="mt-2 text-gray-400">
                Transform your cryptocurrency into an exciting treasure hunt experience.
              </p>
            </div>

            {/* Gift Type Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'wallet' | 'newuser')} className="mb-8">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-gray-700">
                <TabsTrigger value="wallet" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
                  <Wallet className="w-4 h-4 mr-2" />
                  Send to Wallet
                </TabsTrigger>
                <TabsTrigger value="newuser" className="data-[state=active]:bg-blue-500 data-[state=active]:text-black">
                  <Users className="w-4 h-4 mr-2" />
                  Send to New User
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="wallet" className="mt-8">
                {/* Existing wallet-based gift creation */}

            {/* Progress Steps */}
            <div className="mb-8">
              <nav aria-label="Progress">
                <ol className="flex items-center justify-center space-x-8">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;

                    return (
                      <li key={step.id} className="flex items-center">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                            isCompleted
                              ? 'bg-geogift-500 border-geogift-500 text-white'
                              : isActive
                              ? 'border-geogift-500 text-geogift-500'
                              : 'border-gray-300 text-gray-300'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`ml-3 text-sm font-medium ${
                            isActive ? 'text-geogift-600' : 'text-gray-500'
                          }`}
                        >
                          {step.title}
                        </span>
                        {index < steps.length - 1 && (
                          <div className="ml-8 w-8 h-0.5 bg-gray-300" />
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Gift Details */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Gift className="mr-2 h-5 w-5" />
                      Gift Details
                    </CardTitle>
                    <CardDescription>
                      Set up the basic information for your crypto gift.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipient Address
                      </label>
                      <Input
                        {...register('recipientAddress')}
                        placeholder="0x..."
                        className={errors.recipientAddress ? 'border-red-500' : ''}
                      />
                      {errors.recipientAddress && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.recipientAddress.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gift Amount
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          {...register('amount')}
                          type="number"
                          step="0.001"
                          placeholder={watchedValues.currency === 'GGT' ? '100' : '0.1'}
                          className={`flex-1 ${errors.amount ? 'border-red-500' : ''}`}
                        />
                        <Select
                          value={watchedValues.currency}
                          onValueChange={(value) => setValue('currency', value as 'ETH' | 'GGT')}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GGT">
                              <div className="flex items-center">
                                <span className="mr-1">🎁</span>
                                GGT
                              </div>
                            </SelectItem>
                            <SelectItem value="ETH">
                              <div className="flex items-center">
                                <span className="mr-1">Ξ</span>
                                ETH
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {errors.amount && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.amount.message}
                        </p>
                      )}
                      {watchedValues.currency === 'GGT' && (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-green-600">
                            💰 Using your custom GeoGift tokens! You have 1,000,000 GGT available.
                          </p>
                          <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            ✨ GGT token gifts now supported! This will require approval + gift creation (2 transactions).
                          </p>
                          
                          {/* Gasless Option for GGT Direct Gifts */}
                          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 mt-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="gasless"
                                checked={isGaslessMode}
                                onChange={(e) => {
                                  setIsGaslessMode(e.target.checked);
                                  setValue('gasless', e.target.checked);
                                  if (!e.target.checked) {
                                    setValue('ethAmount', '');
                                  }
                                }}
                                className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                              />
                              <label htmlFor="gasless" className="text-sm font-medium text-cyan-800">
                                🚀 Enable Gasless Claiming (Recommended!)
                              </label>
                            </div>
                            <p className="text-xs text-cyan-700 mt-1 ml-6">
                              You pay gas fees so recipient can claim with ZERO ETH. Perfect for onboarding new users!
                            </p>
                            
                            {isGaslessMode && (
                              <div className="mt-3 ml-6">
                                <label className="block text-sm font-medium text-cyan-800 mb-1">
                                  Gas Sponsoring Amount (ETH)
                                </label>
                                <Input
                                  {...register('ethAmount')}
                                  type="number"
                                  step="0.001"
                                  placeholder="0.01"
                                  className="w-32 text-sm"
                                />
                                <p className="text-xs text-cyan-600 mt-1">
                                  Recommended: 0.01 ETH covers claiming costs + relay profit
                                </p>
                                {errors.ethAmount && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {errors.ethAmount.message}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personal Message
                      </label>
                      <textarea
                        {...register('message')}
                        rows={4}
                        placeholder="Write a personal message for the recipient..."
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-geogift-500 focus:outline-none focus:ring-1 focus:ring-geogift-500"
                      />
                      {errors.message && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unlock Mechanism
                      </label>
                      <Select
                        value={watchedValues.unlockType}
                        onValueChange={(value) => setValue('unlockType', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GPS">
                            <div className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4" />
                              📍 GPS Location
                            </div>
                          </SelectItem>
                          <SelectItem value="PASSWORD">
                            <div className="flex items-center">
                              <Lock className="mr-2 h-4 w-4" />
                              🔐 Password
                            </div>
                          </SelectItem>
                          <SelectItem value="QUIZ">
                            <div className="flex items-center">
                              <HelpCircle className="mr-2 h-4 w-4" />
                              ❓ Quiz Question
                            </div>
                          </SelectItem>
                          <SelectItem value="VIDEO">
                            <div className="flex items-center">
                              <Video className="mr-2 h-4 w-4" />
                              🎥 Watch Video
                            </div>
                          </SelectItem>
                          <SelectItem value="IMAGE">
                            <div className="flex items-center">
                              <Image className="mr-2 h-4 w-4" />
                              🖼️ View Image
                            </div>
                          </SelectItem>
                          <SelectItem value="MARKDOWN">
                            <div className="flex items-center">
                              <FileText className="mr-2 h-4 w-4" />
                              📄 Read Content
                            </div>
                          </SelectItem>
                          <SelectItem value="URL">
                            <div className="flex items-center">
                              <Link className="mr-2 h-4 w-4" />
                              🔗 Visit Website
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-gray-500">
                        {watchedValues.unlockType === 'GPS' && 'Recipient must visit a specific location to claim'}
                        {watchedValues.unlockType === 'PASSWORD' && 'Recipient must enter the correct password to claim'}
                        {watchedValues.unlockType === 'QUIZ' && 'Recipient must answer a question correctly to claim'}
                        {watchedValues.unlockType === 'VIDEO' && 'Recipient must watch a video to claim'}
                        {watchedValues.unlockType === 'IMAGE' && 'Recipient must view an image to claim'}
                        {watchedValues.unlockType === 'MARKDOWN' && 'Recipient must read content to claim'}
                        {watchedValues.unlockType === 'URL' && 'Recipient must visit a website to claim'}
                      </p>
                    </div>

                    {/* Unlock Challenge Data Fields */}
                    {watchedValues.unlockType === 'PASSWORD' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <Input
                          {...register('unlockChallengeData')}
                          type="password"
                          placeholder="Enter the password recipients need to enter"
                          className={errors.unlockChallengeData ? 'border-red-500' : ''}
                        />
                        {errors.unlockChallengeData && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.unlockChallengeData.message}
                          </p>
                        )}
                      </div>
                    )}

                    {watchedValues.unlockType === 'QUIZ' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quiz Question & Answer
                        </label>
                        <textarea
                          {...register('unlockChallengeData')}
                          rows={3}
                          placeholder='Enter question and answer in format: "Question: What is 2+2? | Answer: 4"'
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-geogift-500 focus:outline-none focus:ring-1 focus:ring-geogift-500"
                        />
                        {errors.unlockChallengeData && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.unlockChallengeData.message}
                          </p>
                        )}
                      </div>
                    )}

                    {(watchedValues.unlockType === 'VIDEO' || watchedValues.unlockType === 'IMAGE' || watchedValues.unlockType === 'URL') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {watchedValues.unlockType === 'VIDEO' ? 'Video URL' : 
                           watchedValues.unlockType === 'IMAGE' ? 'Image URL' : 'Website URL'}
                        </label>
                        <Input
                          {...register('unlockChallengeData')}
                          type="url"
                          placeholder="https://example.com/video or https://example.com/image or https://example.com"
                          className={errors.unlockChallengeData ? 'border-red-500' : ''}
                        />
                        {errors.unlockChallengeData && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.unlockChallengeData.message}
                          </p>
                        )}
                      </div>
                    )}

                    {watchedValues.unlockType === 'MARKDOWN' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content to Read
                        </label>
                        <textarea
                          {...register('unlockChallengeData')}
                          rows={4}
                          placeholder="Enter the content recipients need to read..."
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-geogift-500 focus:outline-none focus:ring-1 focus:ring-geogift-500"
                        />
                        {errors.unlockChallengeData && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.unlockChallengeData.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Optional Reward Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bonus Reward (Optional)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Additional content to reveal AFTER successful unlock (along with the crypto)
                      </p>
                      <div className="space-y-2">
                        <Select
                          value={watchedValues.rewardContentType || 'none'}
                          onValueChange={(value) => setValue('rewardContentType', value === 'none' ? undefined : value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select reward type (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No additional reward</SelectItem>
                            <SelectItem value="url">🔗 Website/Link</SelectItem>
                            <SelectItem value="file">📎 File/Download</SelectItem>
                            <SelectItem value="message">💬 Secret Message</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {watchedValues.rewardContentType && watchedValues.rewardContentType !== 'none' && (
                          <div>
                            {watchedValues.rewardContentType === 'message' ? (
                              <textarea
                                {...register('rewardContent')}
                                rows={3}
                                placeholder="Enter the secret message to reveal after unlock..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-geogift-500 focus:outline-none focus:ring-1 focus:ring-geogift-500"
                              />
                            ) : (
                              <Input
                                {...register('rewardContent')}
                                type="url"
                                placeholder={watchedValues.rewardContentType === 'url' ? 'https://example.com' : 'https://example.com/file.pdf'}
                                className={errors.rewardContent ? 'border-red-500' : ''}
                              />
                            )}
                            {errors.rewardContent && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.rewardContent.message}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry (Days)
                      </label>
                      <Input
                        {...register('expiryDays', { valueAsNumber: true })}
                        type="number"
                        min="1"
                        max="365"
                        className={errors.expiryDays ? 'border-red-500' : ''}
                      />
                      {errors.expiryDays && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.expiryDays.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Location & Clues (only for GPS) */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5" />
                      {watchedValues.unlockType === 'GPS' ? 'Location & Clues' : 'Gift Setup Complete'}
                    </CardTitle>
                    <CardDescription>
                      {watchedValues.unlockType === 'GPS' 
                        ? 'Set the treasure location and create hints for the recipient.'
                        : 'Your gift challenge is configured. Review and create your gift.'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {watchedValues.unlockType === 'GPS' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Treasure Hunt Clue
                          </label>
                          <textarea
                            {...register('clue')}
                            rows={3}
                            placeholder="Create a riddle or hint to guide the recipient to the location..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-geogift-500 focus:outline-none focus:ring-1 focus:ring-geogift-500"
                          />
                          {errors.clue && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.clue.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location Selection
                          </label>
                          <div className="bg-gray-100 rounded-lg p-8 text-center">
                            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-4">
                              Interactive map component will be placed here
                            </p>
                            {selectedLocation && (
                              <p className="text-sm text-geogift-600">
                                Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                              </p>
                            )}
                            <div className="space-y-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                      const lat = position.coords.latitude;
                                      const lng = position.coords.longitude;
                                      handleLocationSelect(lat, lng);
                                    },
                                    (error) => {
                                      console.error('Error getting location:', error);
                                      alert('Unable to get your location. Please enable location services.');
                                    }
                                  );
                                }}
                                className="mt-4 w-full"
                              >
                                📍 Use My Current Location
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleLocationSelect(40.7831, -73.9712)}
                                className="w-full"
                              >
                                Select Central Park (Demo)
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Claim Radius (meters)
                          </label>
                          <Input
                            {...register('radius', { valueAsNumber: true })}
                            type="number"
                            min="1"
                            max="1000"
                            className={errors.radius ? 'border-red-500' : ''}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Recipients must be within this distance to claim the gift
                          </p>
                          {errors.radius && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.radius.message}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <Gift className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Challenge Configured!</h3>
                        <p className="text-gray-600 mb-4">
                          Your {watchedValues.unlockType.toLowerCase()} challenge is ready. Recipients will need to complete the challenge to unlock their gift.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Challenge Summary:</h4>
                          <p className="text-sm text-gray-600">
                            <strong>Type:</strong> {watchedValues.unlockType} unlock
                          </p>
                          {watchedValues.unlockChallengeData && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Challenge:</strong> {watchedValues.unlockChallengeData.slice(0, 100)}{watchedValues.unlockChallengeData.length > 100 ? '...' : ''}
                            </p>
                          )}
                          {watchedValues.rewardContent && watchedValues.rewardContentType !== 'none' && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Bonus Reward:</strong> {watchedValues.rewardContentType} content included
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Review & Create */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Review & Create
                    </CardTitle>
                    <CardDescription>
                      Review your gift details before creating the smart contract.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-medium text-gray-900 mb-4">Gift Summary</h3>
                      <dl className="space-y-3">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Recipient:</dt>
                          <dd className="text-sm font-mono">{watchedValues.recipientAddress}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Amount:</dt>
                          <dd className="text-sm font-medium">
                            {watchedValues.amount} {watchedValues.currency || 'GGT'}
                            {watchedValues.currency === 'GGT' && <span className="ml-1">🎁</span>}
                          </dd>
                        </div>
                        {watchedValues.gasless && watchedValues.ethAmount && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Gas Sponsoring:</dt>
                            <dd className="text-sm font-medium text-cyan-600">
                              {watchedValues.ethAmount} ETH <span className="ml-1">🚀</span>
                            </dd>
                          </div>
                        )}
                        {watchedValues.gasless && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Gift Type:</dt>
                            <dd className="text-sm font-medium text-cyan-600">
                              Gasless (Recipient pays 0 ETH)
                            </dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Location:</dt>
                          <dd className="text-sm">
                            {selectedLocation
                              ? `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`
                              : 'Not selected'}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Radius:</dt>
                          <dd className="text-sm">{watchedValues.radius}m</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Expires:</dt>
                          <dd className="text-sm">
                            {new Date(Date.now() + (watchedValues.expiryDays || 0) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Transaction Status */}
                    {(createError || createErrorGasless) && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-red-800 mb-2">
                          Transaction Failed:
                        </h4>
                        <p className="text-sm text-red-700">{createError || createErrorGasless}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetCreateState}
                          className="mt-2"
                        >
                          Try Again
                        </Button>
                      </div>
                    )}

                    {(isTxSuccess && createdGiftId || createdGiftIdGasless) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-800 mb-2">
                          🎉 {watchedValues.gasless ? 'Gasless Gift' : 'Gift'} Created Successfully!
                        </h4>
                        <p className="text-sm text-green-700 mb-2">
                          Your {watchedValues.gasless ? 'gasless ' : ''}gift has been created and funds are locked in the smart contract.
                          {watchedValues.gasless && (
                            <span className="block mt-1 font-medium text-cyan-700">
                              🚀 Recipient can now claim with ZERO ETH!
                            </span>
                          )}
                        </p>
                        {createTxHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${createTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-600 hover:text-green-800 underline"
                          >
                            View transaction on Etherscan
                          </a>
                        )}
                      </div>
                    )}

                    {(isCreating || isCreatingGasless) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">
                          Creating {watchedValues.gasless ? 'Gasless ' : ''}Gift...
                        </h4>
                        <p className="text-sm text-blue-700">
                          Please confirm the transaction{watchedValues.gasless ? 's' : ''} in your wallet and wait for confirmation.
                          {watchedValues.gasless && (
                            <span className="block mt-1">
                              🚀 Setting up gasless claiming for recipient with zero ETH!
                            </span>
                          )}
                        </p>
                        <div className="mt-2 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-sm text-blue-600">Processing...</span>
                        </div>
                      </div>
                    )}

                    {!(isCreating || isCreatingGasless) && !(isTxSuccess || createdGiftIdGasless) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">
                          Important Notes:
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• This action will create a smart contract transaction</li>
                          <li>• The gift amount will be locked until claimed or expired</li>
                          <li>• Gas fees will apply for the transaction</li>
                          {watchedValues.gasless && (
                            <>
                              <li>• 🚀 <strong>Gasless mode:</strong> Recipient pays ZERO ETH to claim</li>
                              <li>• 💰 Your ETH covers all claiming costs + relay fees</li>
                            </>
                          )}
                          <li>• Make sure all details are correct before proceeding</li>
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={currentStep === 1 && (!watchedValues.recipientAddress || !watchedValues.amount)}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={!isValid || (watchedValues.unlockType === 'GPS' && !selectedLocation) || isCreating || isCreatingGasless || isTxSuccess || !!createdGiftIdGasless}
                  >
                    {(isCreating || isCreatingGasless) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating {watchedValues.gasless ? 'Gasless ' : ''}Gift...
                      </>
                    ) : (isTxSuccess || createdGiftIdGasless) ? (
                      <>
                        <Gift className="mr-2 h-4 w-4" />
                        {watchedValues.gasless ? 'Gasless ' : ''}Gift Created!
                      </>
                    ) : (
                      <>
                        <Gift className="mr-2 h-4 w-4" />
                        Create {watchedValues.gasless ? 'Gasless ' : ''}Gift
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
              </TabsContent>
              
              <TabsContent value="newuser" className="mt-8">
                {/* New User Gift Creation */}
                <NewUserGiftForm
                  onSuccess={handleNewUserGiftSuccess}
                  onCancel={handleNewUserGiftCancel}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Gift Creation Success Modal */}
      <GiftCreatedModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        giftId={createdGiftId || createdGiftIdGasless}
        amount={watchedValues.amount || '0'}
        recipientAddress={watchedValues.recipientAddress || ''}
        isGasless={watchedValues.gasless || false}
        message={watchedValues.message}
        unlockType={watchedValues.unlockType}
      />
      
      {/* New User Gift Success Modal */}
      {newUserGiftData && (
        <NewUserGiftSuccessModal
          isOpen={showNewUserModal}
          onClose={() => {
            setShowNewUserModal(false);
            setNewUserGiftData(null);
          }}
          giftId={newUserGiftData.giftId}
          claimCode={newUserGiftData.claimCode}
          amount={newUserGiftData.amount}
          ethAmount={newUserGiftData.ethAmount}
          message={newUserGiftData.message}
          expiryDays={newUserGiftData.expiryDays}
          unlockType={newUserGiftData.unlockType}
        />
      )}
    </MainLayout>
  );
}