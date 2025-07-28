'use client';

import { useState } from 'react';
import { 
  Plus, Trash2, MapPin, Move, GripVertical, 
  Video, Image, FileText, Lock, Link, HelpCircle,
  Youtube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { StepUnlockType, StepUnlockData, ChainStep } from '@/types';

const UNLOCK_TYPE_CONFIG = {
  gps: {
    icon: MapPin,
    label: 'GPS Location',
    description: 'Recipient must visit a specific location',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  video: {
    icon: Youtube,
    label: 'Video',
    description: 'Watch a YouTube or video link',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  image: {
    icon: Image,
    label: 'Image Clue',
    description: 'View an image for the next hint',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  markdown: {
    icon: FileText,
    label: 'Text Content',
    description: 'Read instructions or story',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  quiz: {
    icon: HelpCircle,
    label: 'Quiz Question',
    description: 'Answer a question correctly',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  password: {
    icon: Lock,
    label: 'Password',
    description: 'Enter a secret code',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  url: {
    icon: Link,
    label: 'Visit URL',
    description: 'Visit a specific website',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
};

interface EnhancedStepBuilderProps {
  steps: ChainStep[];
  onStepsChange: (steps: ChainStep[]) => void;
  maxSteps?: number;
  minSteps?: number;
  supportGGT?: boolean; // Support for custom GGT token
}

export function EnhancedStepBuilder({ 
  steps, 
  onStepsChange, 
  maxSteps = 10, 
  minSteps = 1,
  supportGGT = false 
}: EnhancedStepBuilderProps) {
  
  const addStep = (type: StepUnlockType = 'gps') => {
    if (steps.length >= maxSteps) return;
    
    const defaultUnlockData: Record<StepUnlockType, StepUnlockData> = {
      gps: { latitude: null, longitude: null, radius: 50 },
      video: { mediaUrl: '', mediaType: 'youtube' },
      image: { mediaUrl: '', mediaType: 'image' },
      markdown: { markdownContent: '# Step Title\n\nYour content here...' },
      quiz: { question: '', answer: '', hints: [] },
      password: { password: '', passwordHint: '' },
      url: { targetUrl: '', urlInstruction: 'Visit this website to continue' },
    };
    
    const newStep: ChainStep = {
      id: `step-${Date.now()}`,
      title: `Step ${steps.length + 1}`,
      message: '',
      unlockType: type,
      unlockData: defaultUnlockData[type],
      order: steps.length,
      emoji: '🎯',
      rewardToken: 'ETH',
    };
    
    onStepsChange([...steps, newStep]);
  };
  
  const removeStep = (stepId: string) => {
    if (steps.length <= minSteps) return;
    onStepsChange(steps.filter(step => step.id !== stepId));
  };
  
  const updateStep = (stepId: string, updates: Partial<ChainStep>) => {
    const updatedSteps = steps.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    );
    onStepsChange(updatedSteps);
  };
  
  const updateUnlockData = (stepId: string, unlockData: Partial<StepUnlockData>) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    updateStep(stepId, {
      unlockData: { ...step.unlockData, ...unlockData }
    });
  };
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const reorderedSteps = Array.from(steps);
    const [removed] = reorderedSteps.splice(result.source.index, 1);
    reorderedSteps.splice(result.destination.index, 0, removed);
    
    const stepsWithNewOrder = reorderedSteps.map((step, index) => ({
      ...step,
      order: index
    }));
    
    onStepsChange(stepsWithNewOrder);
  };
  
  const getCurrentLocation = (stepId: string) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateUnlockData(stepId, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };
  
  const renderUnlockFields = (step: ChainStep) => {
    const { unlockType, unlockData } = step;
    
    switch (unlockType) {
      case 'gps':
        return (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Input
                type="number"
                step="any"
                value={unlockData.latitude || ''}
                onChange={(e) => updateUnlockData(step.id, { 
                  latitude: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                placeholder="Latitude"
                className="flex-1"
              />
              <Input
                type="number"
                step="any"
                value={unlockData.longitude || ''}
                onChange={(e) => updateUnlockData(step.id, { 
                  longitude: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                placeholder="Longitude"
                className="flex-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={unlockData.radius || 50}
                onChange={(e) => updateUnlockData(step.id, { 
                  radius: parseInt(e.target.value) || 50 
                })}
                placeholder="Radius (m)"
                className="w-32"
              />
              <Button
                type="button"
                onClick={() => getCurrentLocation(step.id)}
                variant="outline"
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Current Location
              </Button>
            </div>
          </div>
        );
        
      case 'video':
        return (
          <div className="space-y-3">
            <Input
              value={unlockData.mediaUrl || ''}
              onChange={(e) => updateUnlockData(step.id, { mediaUrl: e.target.value })}
              placeholder="YouTube or video URL"
            />
            <Select
              value={unlockData.mediaType || 'youtube'}
              onValueChange={(value) => updateUnlockData(step.id, { 
                mediaType: value as 'youtube' | 'video' | 'vimeo' 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="video">Direct Video URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
        
      case 'image':
        return (
          <Input
            value={unlockData.mediaUrl || ''}
            onChange={(e) => updateUnlockData(step.id, { mediaUrl: e.target.value })}
            placeholder="Image URL (jpg, png, gif)"
          />
        );
        
      case 'markdown':
        return (
          <Textarea
            value={unlockData.markdownContent || ''}
            onChange={(e) => updateUnlockData(step.id, { markdownContent: e.target.value })}
            placeholder="Enter markdown content..."
            rows={4}
            className="font-mono text-sm"
          />
        );
        
      case 'quiz':
        return (
          <div className="space-y-3">
            <Input
              value={unlockData.question || ''}
              onChange={(e) => updateUnlockData(step.id, { question: e.target.value })}
              placeholder="Question"
            />
            <Input
              value={unlockData.answer || ''}
              onChange={(e) => updateUnlockData(step.id, { answer: e.target.value })}
              placeholder="Correct answer"
            />
            <Input
              value={unlockData.hints?.[0] || ''}
              onChange={(e) => updateUnlockData(step.id, { 
                hints: [e.target.value] 
              })}
              placeholder="Hint (optional)"
            />
          </div>
        );
        
      case 'password':
        return (
          <div className="space-y-3">
            <Input
              value={unlockData.password || ''}
              onChange={(e) => updateUnlockData(step.id, { password: e.target.value })}
              placeholder="Secret password"
            />
            <Input
              value={unlockData.passwordHint || ''}
              onChange={(e) => updateUnlockData(step.id, { passwordHint: e.target.value })}
              placeholder="Password hint (optional)"
            />
          </div>
        );
        
      case 'url':
        return (
          <div className="space-y-3">
            <Input
              value={unlockData.targetUrl || ''}
              onChange={(e) => updateUnlockData(step.id, { targetUrl: e.target.value })}
              placeholder="https://example.com"
            />
            <Input
              value={unlockData.urlInstruction || ''}
              onChange={(e) => updateUnlockData(step.id, { urlInstruction: e.target.value })}
              placeholder="Instructions for the recipient"
            />
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Chain Steps</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create a multi-step adventure with different unlock methods
          </p>
        </div>
        
        {steps.length < maxSteps && (
          <div className="flex items-center space-x-2">
            <Select onValueChange={(value) => addStep(value as StepUnlockType)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Add step..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(UNLOCK_TYPE_CONFIG).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center">
                        <Icon className={`h-4 w-4 mr-2 ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="steps">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {steps.map((step, index) => {
                const typeConfig = UNLOCK_TYPE_CONFIG[step.unlockType];
                const Icon = typeConfig.icon;
                
                return (
                  <Draggable key={step.id} draggableId={step.id} index={index}>
                    {(provided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="transition-shadow hover:shadow-md"
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                                <Icon className={`h-5 w-5 ${typeConfig.color}`} />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  Step {index + 1}: {typeConfig.label}
                                </h4>
                                <p className="text-sm text-gray-500 mt-0.5">
                                  {typeConfig.description}
                                </p>
                              </div>
                            </div>
                            {steps.length > minSteps && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStep(step.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Step Title</Label>
                              <Input
                                value={step.title}
                                onChange={(e) => updateStep(step.id, { title: e.target.value })}
                                placeholder="Enter step title"
                              />
                            </div>
                            
                            <div>
                              <Label>Emoji & Token</Label>
                              <div className="flex space-x-2">
                                <Input
                                  value={step.emoji || '🎯'}
                                  onChange={(e) => updateStep(step.id, { emoji: e.target.value })}
                                  className="w-16"
                                  maxLength={2}
                                />
                                {supportGGT && (
                                  <Select
                                    value={step.rewardToken || 'ETH'}
                                    onValueChange={(value) => updateStep(step.id, { 
                                      rewardToken: value as 'ETH' | 'GGT' 
                                    })}
                                  >
                                    <SelectTrigger className="flex-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ETH">ETH</SelectItem>
                                      <SelectItem value="GGT">GGT</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Message / Instructions</Label>
                            <Textarea
                              value={step.message}
                              onChange={(e) => updateStep(step.id, { message: e.target.value })}
                              placeholder="Instructions or clues for this step..."
                              rows={2}
                            />
                          </div>
                          
                          <div>
                            <Label className="mb-2 block">
                              {typeConfig.label} Configuration
                            </Label>
                            {renderUnlockFields(step)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {steps.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 mb-4">
              No steps added yet. Choose an unlock type to get started!
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => addStep('gps')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Step
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}