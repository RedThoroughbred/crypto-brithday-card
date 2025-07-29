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
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MainLayout } from '@/components/layout/main-layout';
import { GiftCreatedModal } from '@/components/gift-created-modal';

const createGiftSchema = z.object({
  recipientAddress: z.string().min(42, 'Invalid Ethereum address').max(42, 'Invalid Ethereum address'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.enum(['ETH', 'GGT']).default('ETH'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
  clue: z.string().max(200, 'Clue too long').optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(1).max(1000),
  expiryDays: z.number().min(1).max(365),
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
  
  // Debug form state
  console.log('=== FORM STATE DEBUG ===');
  console.log('watchedValues:', JSON.stringify(watchedValues, null, 2));
  console.log('errors:', errors);
  console.log('isValid:', isValid);
  console.log('isValidating:', isValidating);
  console.log('selectedLocation:', selectedLocation);
  console.log('currentStep:', currentStep);

  // Show modal when gift is successfully created
  useEffect(() => {
    if (isTxSuccess && createdGiftId) {
      setShowGiftModal(true);
    }
  }, [isTxSuccess, createdGiftId]);

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
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
    console.log('=== FORM SUBMITTED ===');
    console.log('Form data:', data);
    console.log('Selected location:', selectedLocation);
    console.log('Is valid:', isValid);
    console.log('Is creating:', isCreating);
    console.log('Is tx success:', isTxSuccess);
    
    if (!selectedLocation) {
      console.error('No location selected');
      return;
    }

    console.log('Creating gift:', data);
    
    try {
      await createGift({
        recipientAddress: data.recipientAddress,
        amount: data.amount,
        currency: data.currency,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        radius: data.radius,
        clue: data.clue || '',
        message: data.message,
        expiryDays: data.expiryDays,
      });
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900">Create a GeoGift</h1>
              <p className="mt-2 text-gray-600">
                Transform your cryptocurrency into an exciting treasure hunt experience.
              </p>
            </div>

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

              {/* Step 2: Location & Clues */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5" />
                      Location & Clues
                    </CardTitle>
                    <CardDescription>
                      Set the treasure location and create hints for the recipient.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                    {createError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-red-800 mb-2">
                          Transaction Failed:
                        </h4>
                        <p className="text-sm text-red-700">{createError}</p>
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

                    {isTxSuccess && createdGiftId && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-800 mb-2">
                          🎉 Gift Created Successfully!
                        </h4>
                        <p className="text-sm text-green-700 mb-2">
                          Your gift has been created and funds are locked in the smart contract.
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

                    {isCreating && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">
                          Creating Gift...
                        </h4>
                        <p className="text-sm text-blue-700">
                          Please confirm the transaction in your wallet and wait for confirmation.
                        </p>
                        <div className="mt-2 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-sm text-blue-600">Processing...</span>
                        </div>
                      </div>
                    )}

                    {!isCreating && !isTxSuccess && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">
                          Important Notes:
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• This action will create a smart contract transaction</li>
                          <li>• The gift amount will be locked until claimed or expired</li>
                          <li>• Gas fees will apply for the transaction</li>
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
                    disabled={!isValid || !selectedLocation || isCreating || isTxSuccess}
                    onClick={() => {
                      console.log('=== BUTTON CLICKED ===');
                      console.log('isValid:', isValid);
                      console.log('selectedLocation:', selectedLocation);
                      console.log('isCreating:', isCreating);
                      console.log('isTxSuccess:', isTxSuccess);
                      console.log('Button disabled:', !isValid || !selectedLocation || isCreating || isTxSuccess);
                    }}
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Gift...
                      </>
                    ) : isTxSuccess ? (
                      <>
                        <Gift className="mr-2 h-4 w-4" />
                        Gift Created!
                      </>
                    ) : (
                      <>
                        <Gift className="mr-2 h-4 w-4" />
                        Create Gift
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Gift Creation Success Modal */}
      <GiftCreatedModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        giftId={createdGiftId}
        amount={watchedValues.amount || '0'}
        recipientAddress={watchedValues.recipientAddress || ''}
      />
    </MainLayout>
  );
}