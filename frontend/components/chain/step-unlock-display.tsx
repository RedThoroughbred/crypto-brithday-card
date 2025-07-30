'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Video, 
  Image as ImageIcon, 
  FileText, 
  HelpCircle, 
  Lock, 
  Link, 
  Eye,
  EyeOff 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StepData {
  stepType?: number;
  unlockType: number;
  latitude: bigint;
  longitude: bigint;
  radius: bigint;
  stepTitle: string;
  stepMessage: string;
  stepValue: bigint;
  unlockData: string;
  isCompleted: boolean;
}

interface StepUnlockDisplayProps {
  step: StepData;
  stepIndex: number;
  isUnlocked: boolean;
  onUnlock: (unlockData: any) => void;
  isUnlocking?: boolean;
  currentLocation?: { lat: number; lng: number };
  isCompleted?: boolean;
  rewardContent?: string;
  rewardContentType?: string;
}

// Map numeric step types to unlock types
const getUnlockType = (step: StepData): string => {
  const types = ['gps', 'video', 'image', 'markdown', 'quiz', 'password', 'url'];
  // Use unlockType field from contract, fallback to stepType if available
  const typeIndex = step.unlockType ?? step.stepType ?? 0;
  return types[typeIndex] || 'gps';
};

export function StepUnlockDisplay({ 
  step, 
  stepIndex,
  isUnlocked, 
  onUnlock, 
  isUnlocking = false,
  currentLocation,
  isCompleted = false,
  rewardContent,
  rewardContentType
}: StepUnlockDisplayProps) {
  const [passwordInput, setPasswordInput] = useState('');
  const [quizAnswer, setQuizAnswer] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const unlockType = getUnlockType(step);

  // Debug logging
  console.log(`StepUnlockDisplay for step ${stepIndex}:`, {
    stepType: step.stepType,
    unlockType: step.unlockType,
    resolvedType: unlockType,
    stepMessage: step.stepMessage,
    unlockData: step.unlockData,
    stepData: step
  });

  const getUnlockIcon = (type: string) => {
    switch (type) {
      case 'gps': return <MapPin className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'markdown': return <FileText className="h-5 w-5" />;
      case 'quiz': return <HelpCircle className="h-5 w-5" />;
      case 'password': return <Lock className="h-5 w-5" />;
      case 'url': return <Link className="h-5 w-5" />;
      default: return <MapPin className="h-5 w-5" />;
    }
  };

  const getUnlockTypeLabel = (type: string) => {
    switch (type) {
      case 'gps': return 'Location-based unlock';
      case 'video': return 'Watch video to unlock';
      case 'image': return 'View image to unlock';
      case 'markdown': return 'Read message to unlock';
      case 'quiz': return 'Answer question to unlock';
      case 'password': return 'Enter password to unlock';
      case 'url': return 'Visit website to unlock';
      default: return 'Complete task to unlock';
    }
  };

  const renderCompletedContent = () => {
    return (
      <div className="space-y-4">
        {/* Show the original clue/message for completed steps */}
        {step.stepMessage && step.stepMessage !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">Completed Challenge:</p>
                <p className="text-sm text-green-700">{step.stepTitle || `Step ${stepIndex + 1}`}</p>
                {step.stepMessage && (
                  <p className="text-xs text-green-600 mt-2">💡 Clue: {step.stepMessage}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Show bonus reward content if available */}
        {rewardContent && rewardContentType && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="text-xl">🎁</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800 mb-2">Bonus Reward:</p>
                
                {rewardContentType === 'message' && (
                  <div className="bg-white rounded-lg border border-orange-200 p-3">
                    <p className="text-sm text-gray-700">{rewardContent}</p>
                  </div>
                )}
                
                {rewardContentType === 'url' && (
                  <div className="bg-white rounded-lg border border-orange-200 p-3">
                    <a 
                      href={rewardContent} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      🔗 {rewardContent}
                    </a>
                  </div>
                )}
                
                {rewardContentType === 'file' && (
                  <div className="bg-white rounded-lg border border-orange-200 p-3">
                    <a 
                      href={rewardContent} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      📎 Download File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Show step value achieved */}
        <div className="flex items-center justify-between text-sm text-green-600">
          <span>✅ Step completed</span>
          <span className="font-mono">{(Number(step.stepValue) / 1e18).toFixed(4)} ETH claimed</span>
        </div>
      </div>
    );
  };

  const renderUnlockContent = () => {
    switch (unlockType) {
      case 'gps':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{getUnlockTypeLabel('gps')}</span>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">🎯 Location Challenge:</p>
              <p className="text-xs text-muted-foreground mb-3">
                You must be within <strong>{Number(step.radius)} meters</strong> of the secret location to unlock this step.
              </p>
              
              {step.stepMessage && step.stepMessage !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Clue:</strong> {step.stepMessage}
                  </p>
                </div>
              )}
              
              {currentLocation ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>GPS location detected</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📍 Your coordinates: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </p>
                  <Button 
                    onClick={() => onUnlock({ lat: currentLocation.lat, lng: currentLocation.lng })}
                    disabled={isUnlocking}
                    className="w-full"
                  >
                    {isUnlocking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying Distance...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Verify I'm at the location!
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span>Waiting for GPS location...</span>
                  </div>
                  <Alert>
                    <MapPin className="h-4 w-4" />
                    <AlertDescription>
                      Please enable location services in your browser to verify your position for this GPS-based unlock.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="h-4 w-4" />
              <span>{getUnlockTypeLabel('video')}</span>
            </div>
            
            <Alert>
              <AlertDescription>
                Video unlock type is coming soon! For now, click continue to proceed.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => onUnlock({ watched: true })}
              disabled={isUnlocking}
              className="w-full"
            >
              {isUnlocking ? 'Unlocking...' : 'Continue'}
            </Button>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span>{getUnlockTypeLabel('image')}</span>
            </div>
            
            <Alert>
              <AlertDescription>
                Image unlock type is coming soon! For now, click continue to proceed.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => onUnlock({ viewed: true })}
              disabled={isUnlocking}
              className="w-full"
            >
              {isUnlocking ? 'Unlocking...' : 'Continue'}
            </Button>
          </div>
        );

      case 'markdown':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{getUnlockTypeLabel('markdown')}</span>
            </div>
            
            {step.stepMessage && (
              <div className="prose prose-sm max-w-none bg-muted/30 rounded-lg p-4">
                <ReactMarkdown>{step.stepMessage}</ReactMarkdown>
              </div>
            )}
            
            <Button 
              onClick={() => onUnlock({ read: true })}
              disabled={isUnlocking}
              className="w-full"
            >
              {isUnlocking ? 'Unlocking...' : 'I\'ve read the message'}
            </Button>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              <span>{getUnlockTypeLabel('quiz')}</span>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="font-medium mb-3">{step.stepMessage || 'Answer the question to proceed'}</p>
              
              <Input
                type="text"
                placeholder="Your answer..."
                value={quizAnswer}
                onChange={(e) => setQuizAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quizAnswer.trim()) {
                    onUnlock({ answer: quizAnswer.trim() });
                  }
                }}
              />
            </div>
            
            <Button 
              onClick={() => onUnlock({ answer: quizAnswer.trim() })}
              disabled={isUnlocking || !quizAnswer.trim()}
              className="w-full"
            >
              {isUnlocking ? 'Checking...' : 'Submit Answer'}
            </Button>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>{getUnlockTypeLabel('password')}</span>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && passwordInput) {
                      onUnlock({ password: passwordInput });
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 
                    <EyeOff className="h-4 w-4" /> : 
                    <Eye className="h-4 w-4" />
                  }
                </Button>
              </div>
              
              {step.stepMessage && (
                <Alert>
                  <AlertDescription>
                    💡 Hint: {step.stepMessage}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <Button 
              onClick={() => {
                console.log('Password unlock clicked:', { password: passwordInput });
                onUnlock({ password: passwordInput });
              }}
              disabled={isUnlocking || !passwordInput}
              className="w-full"
            >
              {isUnlocking ? 'Verifying...' : 'Unlock'}
            </Button>
          </div>
        );

      case 'url':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link className="h-4 w-4" />
              <span>{getUnlockTypeLabel('url')}</span>
            </div>
            
            <Alert>
              <AlertDescription>
                URL unlock type is coming soon! For now, click continue to proceed.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => onUnlock({ visited: true })}
              disabled={isUnlocking}
              className="w-full"
            >
              {isUnlocking ? 'Unlocking...' : 'Continue'}
            </Button>
          </div>
        );

      default:
        return (
          <Alert>
            <AlertDescription>
              Unknown unlock type. Please contact support.
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <Card className={
      isCompleted ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50' : 
      isUnlocked ? 'border-cyan-500 bg-cyan-50/50' : 
      'border-gray-300'
    }>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isCompleted ? 'bg-green-500 text-white' :
              isUnlocked ? 'bg-cyan-100 text-cyan-600' : 
              'bg-muted'
            }`}>
              {isCompleted ? '✓' : getUnlockIcon(unlockType)}
            </div>
            <div>
              <CardTitle className="text-lg">Step {stepIndex + 1}</CardTitle>
              <CardDescription className="mt-1">
                {step.stepTitle || 'Complete this step to continue'}
              </CardDescription>
            </div>
          </div>
          
          {isCompleted && (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              ✅ Completed
            </Badge>
          )}
          {isUnlocked && !isCompleted && (
            <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-300">
              🔓 Current
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isCompleted ? renderCompletedContent() : renderUnlockContent()}
      </CardContent>
    </Card>
  );
}