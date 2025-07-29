'use client';

import { useState } from 'react';
import { Plus, Trash2, MapPin, Move, GripVertical, Video, Image as ImageIcon, FileText, HelpCircle, Lock, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

import { StepUnlockType, StepUnlockData } from '@/types';

export interface ChainStep {
  id: string;
  title: string;
  message: string;
  unlockType: StepUnlockType;
  unlockData: StepUnlockData;
  order: number;
  // Legacy GPS fields for backward compatibility
  latitude?: number | null;
  longitude?: number | null;
  radius?: number;
}

interface ChainStepBuilderProps {
  steps: ChainStep[];
  onStepsChange: (steps: ChainStep[]) => void;
  maxSteps?: number;
  minSteps?: number;
}

export function ChainStepBuilder({ 
  steps, 
  onStepsChange, 
  maxSteps = 10, 
  minSteps = 2 
}: ChainStepBuilderProps) {
  
  const addStep = () => {
    if (steps.length >= maxSteps) return;
    
    const newStep: ChainStep = {
      id: `step-${Date.now()}`,
      title: `Step ${steps.length + 1}`,
      message: '',
      unlockType: 'gps', // Default to GPS for now
      unlockData: {
        latitude: null,
        longitude: null,
        radius: 50
      },
      order: steps.length,
      // Legacy fields
      latitude: null,
      longitude: null,
      radius: 50
    };
    
    onStepsChange([...steps, newStep]);
  };
  
  const removeStep = (stepId: string) => {
    if (steps.length <= minSteps) return;
    
    const filteredSteps = steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index }));
    
    onStepsChange(filteredSteps);
  };
  
  const updateStep = (stepId: string, updates: Partial<ChainStep>) => {
    const updatedSteps = steps.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    );
    onStepsChange(updatedSteps);
  };
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const reorderedSteps = Array.from(steps);
    const [removed] = reorderedSteps.splice(result.source.index, 1);
    reorderedSteps.splice(result.destination.index, 0, removed);
    
    // Update order
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
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        
        // Check if any existing step has very similar coordinates (within 50 meters)
        const duplicateStep = steps.find(step => {
          if (step.id === stepId || !step.latitude || !step.longitude) return false;
          
          // Simple distance check (rough approximation)
          const latDiff = Math.abs(step.latitude - newLat);
          const lngDiff = Math.abs(step.longitude - newLng);
          const roughDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111320; // meters
          
          return roughDistance < 50; // Within 50 meters
        });
        
        if (duplicateStep) {
          const confirmed = confirm(
            `⚠️ This location is very close to "${duplicateStep.title}" (within 50m).\n\n` +
            `For a proper treasure hunt, each step should be at a different location.\n\n` +
            `Continue anyway?`
          );
          
          if (!confirmed) return;
        }
        
        updateStep(stepId, {
          latitude: newLat,
          longitude: newLng
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location. Please ensure location permissions are enabled.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Chain Steps</h3>
          <p className="text-sm text-gray-600">
            Create a sequence of locations for your gift chain. Recipients must visit each location in order.
          </p>
        </div>
        <Button
          onClick={addStep}
          disabled={steps.length >= maxSteps}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="steps">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {steps.map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`transition-shadow ${
                        snapshot.isDragging ? 'shadow-lg' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab text-gray-400 hover:text-gray-600"
                            >
                              <GripVertical className="h-5 w-5" />
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-geogift-100 flex items-center justify-center text-sm font-semibold text-geogift-700">
                                {index + 1}
                              </div>
                              <CardTitle className="text-lg">Step {index + 1}</CardTitle>
                            </div>
                          </div>
                          <Button
                            onClick={() => removeStep(step.id)}
                            disabled={steps.length <= minSteps}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor={`title-${step.id}`}>Step Title</Label>
                          <Input
                            id={`title-${step.id}`}
                            value={step.title}
                            onChange={(e) => updateStep(step.id, { title: e.target.value })}
                            placeholder="e.g., Where We First Met"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`unlock-type-${step.id}`}>Unlock Type</Label>
                          <Select
                            value={step.unlockType || 'gps'}
                            onValueChange={(value: StepUnlockType) => {
                              const updates: Partial<ChainStep> = {
                                unlockType: value,
                                unlockData: {}
                              };
                              
                              // Set default data for each type
                              switch (value) {
                                case 'gps':
                                  updates.unlockData = {
                                    latitude: step.latitude,
                                    longitude: step.longitude,
                                    radius: step.radius || 50
                                  };
                                  break;
                                case 'password':
                                  updates.unlockData = { password: '', passwordHint: '' };
                                  break;
                                case 'quiz':
                                  updates.unlockData = { question: '', answer: '', hints: [] };
                                  break;
                                case 'markdown':
                                  updates.unlockData = { markdownContent: '' };
                                  break;
                                case 'video':
                                  updates.unlockData = { mediaUrl: '', mediaType: 'youtube' };
                                  break;
                                case 'image':
                                  updates.unlockData = { mediaUrl: '' };
                                  break;
                                case 'url':
                                  updates.unlockData = { targetUrl: '', urlInstruction: '' };
                                  break;
                              }
                              
                              updateStep(step.id, updates);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gps">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  GPS Location
                                </div>
                              </SelectItem>
                              <SelectItem value="password">
                                <div className="flex items-center gap-2">
                                  <Lock className="h-4 w-4" />
                                  Password
                                </div>
                              </SelectItem>
                              <SelectItem value="quiz">
                                <div className="flex items-center gap-2">
                                  <HelpCircle className="h-4 w-4" />
                                  Quiz Question
                                </div>
                              </SelectItem>
                              <SelectItem value="markdown">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Read Message
                                </div>
                              </SelectItem>
                              <SelectItem value="video">
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4" />
                                  Watch Video
                                </div>
                              </SelectItem>
                              <SelectItem value="image">
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="h-4 w-4" />
                                  View Image
                                </div>
                              </SelectItem>
                              <SelectItem value="url">
                                <div className="flex items-center gap-2">
                                  <Link className="h-4 w-4" />
                                  Visit Website
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor={`message-${step.id}`}>Step Message</Label>
                          <Textarea
                            id={`message-${step.id}`}
                            value={step.message}
                            onChange={(e) => updateStep(step.id, { message: e.target.value })}
                            placeholder="Write a message or clue for this step..."
                            rows={3}
                            className="mt-1"
                          />
                        </div>
                        
                        {/* Dynamic fields based on unlock type */}
                        {step.unlockType === 'gps' && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Location</Label>
                                <div className="mt-1 space-y-2">
                                  <div className="flex space-x-2">
                                    <Input
                                      type="number"
                                      step="any"
                                      value={step.unlockData?.latitude || ''}
                                      onChange={(e) => updateStep(step.id, { 
                                        unlockData: {
                                          ...step.unlockData,
                                          latitude: e.target.value ? parseFloat(e.target.value) : null 
                                        },
                                        latitude: e.target.value ? parseFloat(e.target.value) : null
                                      })}
                                      placeholder="Latitude"
                                    />
                                    <Input
                                      type="number"
                                      step="any"
                                      value={step.unlockData?.longitude || ''}
                                      onChange={(e) => updateStep(step.id, { 
                                        unlockData: {
                                          ...step.unlockData,
                                          longitude: e.target.value ? parseFloat(e.target.value) : null 
                                        },
                                        longitude: e.target.value ? parseFloat(e.target.value) : null
                                      })}
                                      placeholder="Longitude"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      getCurrentLocation(step.id);
                                      // Also update unlockData
                                      if (navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition(
                                          (position) => {
                                            updateStep(step.id, {
                                              unlockData: {
                                                ...step.unlockData,
                                                latitude: position.coords.latitude,
                                                longitude: position.coords.longitude
                                              }
                                            });
                                          }
                                        );
                                      }
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                  >
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Use Current Location
                                  </Button>
                                </div>
                              </div>
                              
                              <div>
                                <Label htmlFor={`radius-${step.id}`}>
                                  Verification Radius (meters)
                                </Label>
                                <Input
                                  id={`radius-${step.id}`}
                                  type="number"
                                  min="5"
                                  max="1000"
                                  value={step.unlockData?.radius || 50}
                                  onChange={(e) => updateStep(step.id, { 
                                    unlockData: {
                                      ...step.unlockData,
                                      radius: parseInt(e.target.value) || 50 
                                    },
                                    radius: parseInt(e.target.value) || 50
                                  })}
                                  className="mt-1"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  How close recipients need to be to claim this step
                                </p>
                              </div>
                            </div>
                            
                            {step.unlockData?.latitude && step.unlockData?.longitude && (
                              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                <div className="flex items-center text-green-800">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  <span className="text-sm font-medium">
                                    Location Set: {step.unlockData.latitude.toFixed(6)}, {step.unlockData.longitude.toFixed(6)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        
                        {step.unlockType === 'password' && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`password-${step.id}`}>Password</Label>
                              <Input
                                id={`password-${step.id}`}
                                type="text"
                                value={step.unlockData?.password || ''}
                                onChange={(e) => updateStep(step.id, {
                                  unlockData: {
                                    ...step.unlockData,
                                    password: e.target.value
                                  }
                                })}
                                placeholder="Enter the password recipients must provide"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`password-hint-${step.id}`}>Password Hint (Optional)</Label>
                              <Input
                                id={`password-hint-${step.id}`}
                                value={step.unlockData?.passwordHint || ''}
                                onChange={(e) => updateStep(step.id, {
                                  unlockData: {
                                    ...step.unlockData,
                                    passwordHint: e.target.value
                                  }
                                })}
                                placeholder="Give recipients a hint"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                        
                        {step.unlockType === 'quiz' && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`question-${step.id}`}>Question</Label>
                              <Input
                                id={`question-${step.id}`}
                                value={step.unlockData?.question || ''}
                                onChange={(e) => updateStep(step.id, {
                                  unlockData: {
                                    ...step.unlockData,
                                    question: e.target.value
                                  }
                                })}
                                placeholder="What question should recipients answer?"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`answer-${step.id}`}>Correct Answer</Label>
                              <Input
                                id={`answer-${step.id}`}
                                value={step.unlockData?.answer || ''}
                                onChange={(e) => updateStep(step.id, {
                                  unlockData: {
                                    ...step.unlockData,
                                    answer: e.target.value
                                  }
                                })}
                                placeholder="The correct answer (case-insensitive)"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`hint-${step.id}`}>Hint (Optional)</Label>
                              <Input
                                id={`hint-${step.id}`}
                                value={step.unlockData?.hints?.[0] || ''}
                                onChange={(e) => updateStep(step.id, {
                                  unlockData: {
                                    ...step.unlockData,
                                    hints: e.target.value ? [e.target.value] : []
                                  }
                                })}
                                placeholder="Give recipients a hint"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                        
                        {step.unlockType === 'markdown' && (
                          <div>
                            <Label htmlFor={`markdown-${step.id}`}>Message Content (Markdown)</Label>
                            <Textarea
                              id={`markdown-${step.id}`}
                              value={step.unlockData?.markdownContent || ''}
                              onChange={(e) => updateStep(step.id, {
                                unlockData: {
                                  ...step.unlockData,
                                  markdownContent: e.target.value
                                }
                              })}
                              placeholder="Write your message in Markdown format..."
                              rows={5}
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Supports **bold**, *italic*, [links](url), and more
                            </p>
                          </div>
                        )}
                        
                        {(step.unlockType === 'video' || step.unlockType === 'image') && (
                          <div>
                            <Label htmlFor={`media-url-${step.id}`}>
                              {step.unlockType === 'video' ? 'Video URL' : 'Image URL'}
                            </Label>
                            <Input
                              id={`media-url-${step.id}`}
                              value={step.unlockData?.mediaUrl || ''}
                              onChange={(e) => updateStep(step.id, {
                                unlockData: {
                                  ...step.unlockData,
                                  mediaUrl: e.target.value
                                }
                              })}
                              placeholder={step.unlockType === 'video' ? 
                                'https://youtube.com/watch?v=...' : 
                                'https://example.com/image.jpg'
                              }
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {step.unlockType === 'video' ? 
                                'YouTube, Vimeo, or direct video URLs' : 
                                'Direct link to an image'
                              }
                            </p>
                          </div>
                        )}
                        
                        {step.unlockType === 'url' && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`target-url-${step.id}`}>Website URL</Label>
                              <Input
                                id={`target-url-${step.id}`}
                                value={step.unlockData?.targetUrl || ''}
                                onChange={(e) => updateStep(step.id, {
                                  unlockData: {
                                    ...step.unlockData,
                                    targetUrl: e.target.value
                                  }
                                })}
                                placeholder="https://example.com"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`url-instruction-${step.id}`}>Instructions (Optional)</Label>
                              <Input
                                id={`url-instruction-${step.id}`}
                                value={step.unlockData?.urlInstruction || ''}
                                onChange={(e) => updateStep(step.id, {
                                  unlockData: {
                                    ...step.unlockData,
                                    urlInstruction: e.target.value
                                  }
                                })}
                                placeholder="What should they do on this website?"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {steps.length < minSteps && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <p className="text-amber-800 text-sm">
            <strong>Minimum {minSteps} steps required.</strong> Add at least {minSteps - steps.length} more step{minSteps - steps.length !== 1 ? 's' : ''} to create your chain.
          </p>
        </div>
      )}
      
      {steps.length >= maxSteps && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-blue-800 text-sm">
            <strong>Maximum {maxSteps} steps reached.</strong> You can reorder existing steps by dragging them.
          </p>
        </div>
      )}
    </div>
  );
}