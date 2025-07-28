'use client';

import { useState } from 'react';
import { Plus, Trash2, MapPin, Move, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

export interface ChainStep {
  id: string;
  title: string;
  message: string;
  latitude: number | null;
  longitude: number | null;
  radius: number;
  order: number;
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
      latitude: null,
      longitude: null,
      radius: 50,
      order: steps.length
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
        updateStep(stepId, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Location</Label>
                            <div className="mt-1 space-y-2">
                              <div className="flex space-x-2">
                                <Input
                                  type="number"
                                  step="any"
                                  value={step.latitude || ''}
                                  onChange={(e) => updateStep(step.id, { 
                                    latitude: e.target.value ? parseFloat(e.target.value) : null 
                                  })}
                                  placeholder="Latitude"
                                />
                                <Input
                                  type="number"
                                  step="any"
                                  value={step.longitude || ''}
                                  onChange={(e) => updateStep(step.id, { 
                                    longitude: e.target.value ? parseFloat(e.target.value) : null 
                                  })}
                                  placeholder="Longitude"
                                />
                              </div>
                              <Button
                                type="button"
                                onClick={() => getCurrentLocation(step.id)}
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
                              value={step.radius}
                              onChange={(e) => updateStep(step.id, { 
                                radius: parseInt(e.target.value) || 50 
                              })}
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              How close recipients need to be to claim this step
                            </p>
                          </div>
                        </div>
                        
                        {step.latitude && step.longitude && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="flex items-center text-green-800">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">
                                Location Set: {step.latitude.toFixed(6)}, {step.longitude.toFixed(6)}
                              </span>
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