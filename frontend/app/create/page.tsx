'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { MainLayout } from '@/components/layout/main-layout';

const createGiftSchema = z.object({
  recipientAddress: z.string().min(42, 'Invalid Ethereum address').max(42, 'Invalid Ethereum address'),
  amount: z.string().min(1, 'Amount is required'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
  clue: z.string().min(1, 'Clue is required').max(200, 'Clue too long'),
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateGiftForm>({
    resolver: zodResolver(createGiftSchema),
    defaultValues: {
      radius: 50,
      expiryDays: 30,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

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

  const onSubmit = (data: CreateGiftForm) => {
    console.log('Creating gift:', data);
    // Here we would call the smart contract to create the gift
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
                        Gift Amount (ETH)
                      </label>
                      <Input
                        {...register('amount')}
                        type="number"
                        step="0.001"
                        placeholder="0.1"
                        className={errors.amount ? 'border-red-500' : ''}
                      />
                      {errors.amount && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.amount.message}
                        </p>
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
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleLocationSelect(40.7831, -73.9712)} // Central Park example
                          className="mt-4"
                        >
                          Select Central Park (Demo)
                        </Button>
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
                          <dd className="text-sm font-medium">{watchedValues.amount} ETH</dd>
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
                  <Button type="submit" disabled={!isValid || !selectedLocation}>
                    <Gift className="mr-2 h-4 w-4" />
                    Create Gift
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}