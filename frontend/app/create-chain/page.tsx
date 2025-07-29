'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Gift, Heart, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MainLayout } from '@/components/layout/main-layout';
import { ChainStepBuilder, ChainStep } from '@/components/chain-wizard/chain-step-builder';
import { ChainCreatedModal } from '@/components/chain-created-modal';
import { useToast } from '@/hooks/use-toast';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, decodeEventLog } from 'viem';
import { chainAPI, chainUtils } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { 
  GGT_CHAIN_ESCROW_ADDRESS,
  GGT_CHAIN_ESCROW_ABI,
  coordinateToContract,
  calculateExpiryTime,
  createMetadataHash,
  createClueHash
} from '@/lib/contracts';
import { GGT_TOKEN, ERC20_ABI } from '@/lib/tokens';
import { UNLOCK_TYPES, createClueHash as createUnlockClueHash } from '@/lib/unlock-types';

const createChainSchema = z.object({
  recipientEmail: z.string().email('Invalid email address'),
  recipientAddress: z.string().min(42, 'Invalid Ethereum address').max(42, 'Invalid Ethereum address'),
  chainTitle: z.string().min(1, 'Chain title is required').max(100, 'Title too long'),
  chainDescription: z.string().max(500, 'Description too long').optional(),
  totalAmount: z.string().min(1, 'Amount is required'),
  currency: z.enum(['ETH', 'GGT']).default('GGT'),
  expiryDays: z.number().min(1, 'Must be at least 1 day').max(365, 'Cannot exceed 365 days'),
});

type CreateChainForm = z.infer<typeof createChainSchema>;

const chainTemplates = [
  {
    id: 'proposal',
    name: 'Marriage Proposal',
    icon: Heart,
    color: 'text-red-500',
    description: 'Create a romantic journey leading to your proposal',
    defaultSteps: [
      { title: 'Where We First Met', message: 'Remember this special place where our story began?' },
      { title: 'Our First Date', message: 'You were so nervous, but it was perfect...' },
      { title: 'Where You Said You Loved Me', message: 'That sunset when you first said those three words...' },
      { title: 'Where I Ask You to Marry Me', message: 'Will you marry me? 💍' },
    ]
  },
  {
    id: 'birthday',
    name: 'Birthday Adventure',
    icon: Gift,
    color: 'text-blue-500',
    description: 'A special birthday treasure hunt',
    defaultSteps: [
      { title: 'Birthday Surprise #1', message: 'Happy Birthday! Your adventure begins here...' },
      { title: 'Memory Lane', message: 'Remember when we...' },
      { title: 'Final Surprise', message: 'The best is saved for last!' },
    ]
  },
  {
    id: 'anniversary',
    name: 'Anniversary Journey',
    icon: Calendar,
    color: 'text-purple-500',
    description: 'Celebrate your special milestone',
    defaultSteps: [
      { title: 'Our Beginning', message: 'Where it all started...' },
      { title: 'Growing Together', message: 'Through all our adventures...' },
      { title: 'Our Future', message: 'Here\'s to many more years together!' },
    ]
  },
  {
    id: 'custom',
    name: 'Custom Chain',
    icon: Star,
    color: 'text-yellow-500',
    description: 'Create your own unique experience',
    defaultSteps: [
      { title: 'Step 1', message: 'Your first clue...' },
      { title: 'Step 2', message: 'The journey continues...' },
    ]
  },
];

export default function CreateChainPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [chainSteps, setChainSteps] = useState<ChainStep[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showChainModal, setShowChainModal] = useState(false);
  const [createdChainId, setCreatedChainId] = useState<number | null>(null);
  const { toast } = useToast();
  const { address } = useAccount();
  const auth = useAuth();
  
  // Contract interaction hooks
  const { writeContract, data: hash, isPending, error: contractError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<CreateChainForm>({
    resolver: zodResolver(createChainSchema),
    defaultValues: {
      expiryDays: 30,
      currency: 'GGT', // Default to GGT since you have 1M tokens!
    },
  });

  const watchedValues = watch();
  const totalSteps = 4;

  // Handle transaction status - need to store form data for second transaction
  const [formData, setFormData] = useState<CreateChainForm | null>(null);
  const [isApprovalStep, setIsApprovalStep] = useState(true);

  useEffect(() => {
    console.log('Transaction effect:', { isConfirmed, hash, formData, isApprovalStep, isConfirming, isPending });
    
    if (isConfirmed && hash && formData) {
      if (isApprovalStep) {
        // Approval confirmed, now create the chain
        console.log('Approval confirmed, creating chain...');
        handleCreateChain(formData);
      } else {
        // Chain created successfully - extract chain ID from transaction logs
        console.log('Chain created! Transaction hash:', hash);
        console.log('Transaction receipt:', receipt);
        console.log('Receipt logs:', receipt?.logs);
        
        // Extract chain ID from ChainCreated event
        let newChainId = null;
        if (receipt?.logs) {
          for (const log of receipt.logs) {
            try {
              // Try to decode the log as a ChainCreated event
              const decodedLog = decodeEventLog({
                abi: GGT_CHAIN_ESCROW_ABI,
                data: log.data,
                topics: log.topics,
              });
              
              console.log('Decoded log:', decodedLog);
              
              if (decodedLog.eventName === 'ChainCreated') {
                // Extract chain ID from the decoded event
                newChainId = Number(decodedLog.args.chainId);
                console.log('Extracted chain ID from event:', newChainId);
                break;
              }
            } catch (error) {
              // This log is not a ChainCreated event, continue to next
              console.log('Log decode error (expected for non-ChainCreated events):', error);
              continue;
            }
          }
        }
        
        // Fallback to incremental ID if extraction fails
        if (!newChainId) {
          console.warn('Could not extract chain ID from logs, using fallback');
          newChainId = Date.now() % 1000; // Temporary fallback
        }
        
        console.log('Setting chain ID:', newChainId);
        
        // Store chain data in backend database
        const saveToBackend = async () => {
          try {
            console.log('Storing chain data in backend...');
            
            // Try to authenticate but don't fail if it doesn't work
            try {
              const isAuthenticated = await auth.ensureAuthenticated();
              console.log('Authentication status:', isAuthenticated);
            } catch (authError) {
              console.warn('Authentication failed, continuing without backend storage:', authError);
              // Continue without authentication - blockchain storage will still work
            }
            
            const chainData = chainUtils.prepareChainForAPI({
              title: formData.chainTitle,
              description: formData.chainDescription || '',
              recipientAddress: formData.recipientAddress,
              recipientEmail: formData.recipientEmail,
              totalValue: formData.totalAmount,
              expiryDays: formData.expiryDays,
              steps: chainSteps,
              blockchainChainId: newChainId,
              transactionHash: hash
            });
            
            console.log('Prepared chain data for API:', chainData);
            
            // TODO: Enable when authentication is fixed
            // const savedChain = await chainAPI.createChain(chainData);
            // console.log('Chain saved to backend:', savedChain);
            
            console.log('Backend storage temporarily disabled - chain stored on blockchain only');
            
            // toast({
            //   title: 'Chain Saved!',
            //   description: 'Your chain has been saved to the database for easy access.',
            // });
          } catch (error) {
            console.error('Failed to save chain to backend:', error);
            // Don't fail the entire flow if backend save fails
            toast({
              title: 'Backend Warning',
              description: `Chain created on blockchain but failed to save to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
              variant: 'destructive',
            });
          }
        };
        
        saveToBackend();
        
        setCreatedChainId(newChainId);
        setShowChainModal(true);
        setIsCreating(false);
        
        toast({
          title: 'GGT Chain Created!',
          description: `Your ${chainSteps.length}-step adventure has been created successfully.`,
        });
      }
    }
  }, [isConfirmed, hash, receipt, formData, isApprovalStep, chainSteps.length, toast, isConfirming, isPending]);

  const handleCreateChain = async (data: CreateChainForm) => {
    try {
      setIsApprovalStep(false);
      console.log('handleCreateChain called with:', data);
      console.log('Chain steps for creation:', chainSteps);
      
      toast({
        title: 'Step 2: Creating GGT Chain...',
        description: 'Please confirm the chain creation transaction in your wallet.',
      });

      // Prepare step data with proper unlock types
      const stepLocations = chainSteps.map(step => {
        if (step.unlockType === 'gps' && step.unlockData?.latitude && step.unlockData?.longitude) {
          return [
            coordinateToContract(step.unlockData.latitude),
            coordinateToContract(step.unlockData.longitude)
          ];
        }
        // For non-GPS types, use dummy coordinates
        return [BigInt(0), BigInt(0)];
      });

      const stepRadii = chainSteps.map(step => {
        if (step.unlockType === 'gps') {
          // For GPS steps, use the radius from unlock data or step data
          const radius = step.unlockData?.radius || step.radius || 50;
          return BigInt(Math.max(1, radius)); // Ensure minimum radius of 1 meter
        }
        // For non-GPS steps, use a minimal radius
        return BigInt(1);
      });
      
      // Create step messages (human-readable hints/clues)
      const stepMessages = chainSteps.map(step => {
        switch (step.unlockType) {
          case 'password':
            // For password steps, use the hint as the message
            return step.unlockData?.passwordHint || step.message || 'Enter the correct password';
          case 'quiz':
            // For quiz steps, use the question as the message  
            return step.unlockData?.question || step.message || 'Answer the question';
          case 'markdown':
            // For markdown steps, use the content as the message
            return step.unlockData?.markdownContent || step.message || 'Read the message';
          case 'gps':
          default:
            // For other steps, use the general message
            return step.message || 'Complete this step to continue';
        }
      }); // Now sending as plain strings, not hashed
      
      // Create unlock data hashes for verification (passwords, quiz answers, etc.)
      const stepUnlockDataHashes = chainSteps.map(step => {
        switch (step.unlockType) {
          case 'password':
            // Hash the password for verification
            return createUnlockClueHash(step.unlockType, { password: step.unlockData?.password || '' });
          case 'quiz':
            // Hash the answer for verification
            return createUnlockClueHash(step.unlockType, { answer: step.unlockData?.answer || '' });
          default:
            // For other types, create a generic hash
            return createUnlockClueHash('gps', {});
        }
      });
      
      const stepTitles = chainSteps.map(step => step.title);
      const chainMetadata = createMetadataHash(data.chainDescription || '');
      const expiryTime = calculateExpiryTime(data.expiryDays);
      
      // Get step types as numbers
      const stepTypes = chainSteps.map(step => {
        const typeMap = {
          'gps': UNLOCK_TYPES.GPS,
          'video': UNLOCK_TYPES.VIDEO,
          'image': UNLOCK_TYPES.IMAGE,
          'markdown': UNLOCK_TYPES.MARKDOWN,
          'quiz': UNLOCK_TYPES.QUIZ,
          'password': UNLOCK_TYPES.PASSWORD,
          'url': UNLOCK_TYPES.URL
        };
        return typeMap[step.unlockType] || UNLOCK_TYPES.GPS;
      });

      // Calculate step values (same as before)
      const totalAmountBigInt = parseUnits(data.totalAmount, GGT_TOKEN.decimals);
      const stepCount = BigInt(chainSteps.length);
      const stepValue = totalAmountBigInt / stepCount;
      const stepValues = Array(chainSteps.length).fill(stepValue);

      // Adjust last step for any remainder
      const remainder = totalAmountBigInt % stepCount;
      if (remainder > 0) {
        stepValues[stepValues.length - 1] = stepValue + remainder;
      }

      console.log('Calling createGiftChain with args:', {
        recipient: data.recipientAddress,
        stepValues: stepValues.map(v => v.toString()),
        stepLocations: stepLocations.map(loc => loc.map(c => c.toString())),
        stepRadii: stepRadii.map(r => r.toString()),
        stepTypes,
        stepUnlockDataHashes,
        stepMessages,
        stepTitles,
        chainTitle: data.chainTitle,
        expiryTime: expiryTime.toString(),
        chainMetadata
      });
      
      console.log('Chain steps detailed:', chainSteps.map(step => ({
        title: step.title,
        unlockType: step.unlockType,
        radius: step.radius,
        unlockData: step.unlockData
      })));

      // Create GGT chain
      const result = await writeContract({
        address: GGT_CHAIN_ESCROW_ADDRESS,
        abi: GGT_CHAIN_ESCROW_ABI,
        functionName: 'createGiftChain',
        args: [
          data.recipientAddress as `0x${string}`,
          stepValues,
          stepLocations,
          stepRadii,
          stepTypes, // Use actual unlock types from steps
          stepUnlockDataHashes, // Add unlock data hashes for verification
          stepMessages,
          stepTitles,
          data.chainTitle,
          expiryTime,
          chainMetadata
        ],
      });
      
      console.log('writeContract result:', result);

    } catch (error) {
      console.error('Error creating GGT chain:', error);
      toast({
        title: 'Chain Creation Failed',
        description: 'There was an error creating your gift chain. Please try again.',
        variant: 'destructive',
      });
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (contractError) {
      toast({
        title: 'Transaction Failed',
        description: contractError.message || 'Failed to create gift chain.',
        variant: 'destructive',
      });
    }
  }, [contractError, toast]);

  const selectTemplate = (templateId: string) => {
    console.log('Selecting template:', templateId);
    setSelectedTemplate(templateId);
    const template = chainTemplates.find(t => t.id === templateId);
    
    if (template && template.defaultSteps) {
      const steps: ChainStep[] = template.defaultSteps.map((step, index) => ({
        id: `step-${Date.now()}-${index}`,
        title: step.title,
        message: step.message,
        latitude: null,
        longitude: null,
        radius: 50,
        order: index,
        unlockType: 'gps', // Default to GPS for all template steps
        unlockData: {}
      }));
      setChainSteps(steps);
      setValue('chainTitle', template.name);
    }
    
    // Auto-advance to next step after selection (step 2: chain details)
    setTimeout(() => {
      setCurrentStep(2);
    }, 100);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: CreateChainForm) => {
    console.log('Creating GGT chain with data:', data);
    console.log('Chain steps:', chainSteps);
    
    if (!address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to create a gift chain.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate that GPS steps have locations
    const gpsStepsWithoutLocation = chainSteps.filter(step => 
      step.unlockType === 'gps' && (!step.unlockData?.latitude || !step.unlockData?.longitude)
    );
    if (gpsStepsWithoutLocation.length > 0) {
      toast({
        title: 'Missing Locations',
        description: `Please set locations for ${gpsStepsWithoutLocation.length} GPS step(s).`,
        variant: 'destructive',
      });
      return;
    }
    
    // Validate that other steps have required data
    const invalidSteps = chainSteps.filter(step => {
      switch (step.unlockType) {
        case 'password':
          return !step.unlockData?.password;
        case 'quiz':
          return !step.unlockData?.question || !step.unlockData?.answer;
        case 'markdown':
          return !step.unlockData?.markdownContent;
        case 'video':
        case 'image':
          return !step.unlockData?.mediaUrl;
        case 'url':
          return !step.unlockData?.targetUrl;
        default:
          return false;
      }
    });
    
    if (invalidSteps.length > 0) {
      toast({
        title: 'Incomplete Steps',
        description: `Please complete all required fields for ${invalidSteps.length} step(s).`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      setIsApprovalStep(true);
      setFormData(data); // Store form data for the second transaction

      // Calculate total amount for approval
      const totalAmountBigInt = parseUnits(data.totalAmount, GGT_TOKEN.decimals);

      toast({
        title: 'Step 1: Approving GGT Tokens...',
        description: 'Please confirm the approval transaction in your wallet.',
      });

      // Step 1: Approve GGT tokens
      await writeContract({
        address: GGT_TOKEN.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [GGT_CHAIN_ESCROW_ADDRESS, totalAmountBigInt],
      });

      // Step 2: Create GGT chain will be handled in the success effect

    } catch (error) {
      console.error('Error creating chain:', error);
      toast({
        title: 'Chain Creation Failed',
        description: 'There was an error creating your gift chain. Please try again.',
        variant: 'destructive',
      });
      setIsCreating(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-geogift-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Create a Gift Chain
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Design a multi-step adventure that leads your recipient through meaningful locations,
              each unlocking the next part of your story.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step <= currentStep
                        ? 'bg-geogift-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-16 h-1 ${
                        step < currentStep ? 'bg-geogift-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <span className="text-sm text-gray-600">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Template Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Your Adventure Type</CardTitle>
                    <CardDescription>
                      Select a template to get started, or create a custom chain from scratch.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {chainTemplates.map((template) => {
                        const IconComponent = template.icon;
                        return (
                          <Card
                            key={template.id}
                            className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                              selectedTemplate === template.id
                                ? 'ring-2 ring-geogift-500 border-geogift-500 bg-geogift-50'
                                : 'border-gray-200 hover:border-geogift-300 hover:bg-gray-50'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              console.log('Card clicked:', template.id);
                              selectTemplate(template.id);
                            }}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center space-x-3 mb-3">
                                <IconComponent className={`h-6 w-6 ${template.color}`} />
                                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                              </div>
                              <p className="text-sm text-gray-600">{template.description}</p>
                              {template.defaultSteps && (
                                <div className="mt-3 text-xs text-gray-500">
                                  {template.defaultSteps.length} steps included
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 2: Chain Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Chain Details</CardTitle>
                    <CardDescription>
                      Provide the basic information for your gift chain.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="recipientEmail">Recipient Email</Label>
                        <Input
                          id="recipientEmail"
                          {...register('recipientEmail')}
                          type="email"
                          placeholder="recipient@example.com"
                          className={errors.recipientEmail ? 'border-red-500' : ''}
                        />
                        {errors.recipientEmail && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.recipientEmail.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="recipientAddress">Recipient Wallet Address</Label>
                        <Input
                          id="recipientAddress"
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
                    </div>

                    <div>
                      <Label htmlFor="chainTitle">Chain Title</Label>
                      <Input
                        id="chainTitle"
                        {...register('chainTitle')}
                        placeholder="e.g., Our Love Story Adventure"
                        className={errors.chainTitle ? 'border-red-500' : ''}
                      />
                      {errors.chainTitle && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.chainTitle.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="chainDescription">Chain Description (Optional)</Label>
                      <Textarea
                        id="chainDescription"
                        {...register('chainDescription')}
                        placeholder="Describe the story or theme of your gift chain..."
                        rows={3}
                        className={errors.chainDescription ? 'border-red-500' : ''}
                      />
                      {errors.chainDescription && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.chainDescription.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="totalAmount">Total Gift Amount</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="totalAmount"
                            {...register('totalAmount')}
                            type="number"
                            step="0.001"
                            placeholder={watchedValues.currency === 'GGT' ? '1000' : '0.1'}
                            className={`flex-1 ${errors.totalAmount ? 'border-red-500' : ''}`}
                          />
                          <Select
                            value={watchedValues.currency}
                            onValueChange={(value) => setValue('currency', value as 'ETH' | 'GGT')}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GGT">🎁 GGT</SelectItem>
                              <SelectItem value="ETH">Ξ ETH</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {errors.totalAmount && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.totalAmount.message}
                          </p>
                        )}
                        {watchedValues.currency === 'GGT' && (
                          <p className="mt-1 text-xs text-green-600">
                            💰 Using your custom GeoGift tokens! You have 1,000,000 GGT available.
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="expiryDays">Expires In (Days)</Label>
                        <Input
                          id="expiryDays"
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Chain Steps */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Design Your Steps</CardTitle>
                    <CardDescription>
                      Create the sequence of locations and messages for your gift chain.
                      Recipients must complete each step in order to unlock the next.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChainStepBuilder
                      steps={chainSteps}
                      onStepsChange={setChainSteps}
                      maxSteps={10}
                      minSteps={2}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 4: Review & Create */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Gift Chain</CardTitle>
                    <CardDescription>
                      Double-check all details before creating your gift chain on the blockchain.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Chain Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">{watchedValues.chainTitle}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Recipient:</span>
                          <div className="font-medium">{watchedValues.recipientEmail}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Amount:</span>
                          <div className="font-medium">
                            {watchedValues.totalAmount} {watchedValues.currency || 'GGT'}
                            {watchedValues.currency === 'GGT' && <span className="ml-1">🎁</span>}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Steps:</span>
                          <div className="font-medium">{chainSteps.length} locations</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Expires:</span>
                          <div className="font-medium">
                            {new Date(Date.now() + (watchedValues.expiryDays || 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Steps Preview */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Chain Steps Preview</h4>
                      <div className="space-y-3">
                        {chainSteps.map((step, index) => (
                          <div key={step.id} className="flex items-start space-x-3 p-3 bg-white border rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-geogift-100 flex items-center justify-center text-sm font-semibold text-geogift-700 mt-1">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{step.title}</h5>
                              <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                              {step.latitude && step.longitude && (
                                <p className="text-xs text-gray-500 mt-1">
                                  📍 {step.latitude.toFixed(6)}, {step.longitude.toFixed(6)} ({step.radius}m radius)
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Important Notes:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• The recipient must complete steps in the exact order you've created</li>
                        <li>• Each step will only unlock after the previous one is completed</li>
                        <li>• The total amount will be distributed across all steps</li>
                        <li>• This transaction cannot be undone once confirmed</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !selectedTemplate) ||
                    (currentStep === 2 && (!watchedValues.recipientEmail || !watchedValues.chainTitle || !watchedValues.totalAmount)) ||
                    (currentStep === 3 && chainSteps.length < 2)
                  }
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!isValid || chainSteps.length < 2 || isPending || isConfirming || isCreating}
                  className="min-w-[140px]"
                >
                  {isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isApprovalStep ? 'Approving GGT...' : 'Creating Chain...'}
                    </>
                  ) : isConfirming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isApprovalStep ? 'Confirming Approval...' : 'Confirming Chain...'}
                    </>
                  ) : (
                    <>
                      <Gift className="mr-2 h-4 w-4" />
                      Create GGT Chain
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Chain Created Modal */}
      {formData && (
        <ChainCreatedModal
          isOpen={showChainModal}
          onClose={() => setShowChainModal(false)}
          chainId={createdChainId}
          chainTitle={formData.chainTitle}
          totalAmount={formData.totalAmount}
          stepCount={chainSteps.length}
          recipientAddress={formData.recipientAddress}
        />
      )}
    </MainLayout>
  );
}