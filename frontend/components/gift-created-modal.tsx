import { useState } from 'react';
import { Copy, Mail, MessageSquare, Check, ExternalLink, FileText, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

interface GiftCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  giftId: number | string | null;
  amount: string;
  recipientAddress: string;
  message?: string;
  unlockType?: string;
  location?: string;
  isGasless?: boolean;
}

export function GiftCreatedModal({
  isOpen,
  onClose,
  giftId,
  amount,
  recipientAddress,
  message,
  unlockType,
  location,
  isGasless = false,
}: GiftCreatedModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [showFullEmail, setShowFullEmail] = useState(false);
  
  // Generate URLs
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const giftUrl = `${baseUrl}/gift/${giftId}`;
  const getStartedUrl = `${baseUrl}/get-started/${giftId}`;
  
  // Generate email template for new users
  const generateNewUserEmail = () => {
    const unlockInstructions = unlockType === 'gps' && location 
      ? `📍 Location: ${location}\n🔓 Go to this location to unlock your gift`
      : unlockType === 'password'
      ? `🔓 You'll need a password to unlock this gift`
      : '🔓 Follow the clues to unlock your gift';
    
    const subject = `🎁 You received ${amount} GGT crypto tokens!`;
    const body = `Hi there!

I've sent you ${amount} GGT tokens as a crypto gift!

💰 Your Gift: ${amount} GGT tokens
${unlockInstructions}
${message ? `\n💬 Message: "${message}"` : ''}

Ready to claim? Click here:
${giftUrl}

New to crypto? No problem! Get started here:
${getStartedUrl}

This gift expires in 30 days.

Enjoy!`;

    return { subject, body };
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(giftUrl);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Gift link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const copyEmailTemplate = async () => {
    const { subject, body } = generateNewUserEmail();
    const fullEmail = `Subject: ${subject}\n\n${body}`;
    
    try {
      // Use the same method as the other copy function that works
      await navigator.clipboard.writeText(fullEmail);
      setEmailCopied(true);
      toast({
        title: 'Email template copied!',
        description: 'Paste it into your email client',
      });
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      // Auto-show the full email text if copy fails
      setShowFullEmail(true);
      toast({
        title: 'Copy failed - text shown below',
        description: 'Manually copy the email text',
        variant: 'destructive',
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('You received a GeoGift!');
    const body = encodeURIComponent(
      `You've received ${amount} GGT!\n\nClaim your gift here: ${giftUrl}\n\nFollow the location clues to unlock your gift.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    const text = encodeURIComponent(`You received ${amount} GGT! Claim your gift: ${giftUrl}`);
    window.open(`sms:?body=${text}`);
  };

  const openInNewTab = () => {
    window.open(giftUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            🎉 {isGasless ? 'Gasless ' : ''}Gift Created Successfully!
          </DialogTitle>
          <DialogDescription>
            Your {amount} GGT {isGasless ? 'gasless ' : ''}gift has been created and is ready to share.
            {isGasless && (
              <span className="block mt-1 text-cyan-600 font-medium">
                🚀 Recipient can claim with ZERO ETH!
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Tabs defaultValue="experienced" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="experienced" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Has Wallet
              </TabsTrigger>
              <TabsTrigger value="newuser" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                New to Crypto
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="experienced" className="space-y-4">
              {/* Gift URL Display */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                  {giftUrl}
                </div>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Quick Sharing Options */}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={shareViaEmail} variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button onClick={shareViaSMS} variant="outline" className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  SMS
                </Button>
                <Button onClick={openInNewTab} variant="outline" className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button onClick={copyToClipboard} variant="outline" className="w-full">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="newuser" className="space-y-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-700 mb-3">
                    Perfect for friends who don't have a crypto wallet yet! This email includes everything they need to get started.
                  </p>
                  
                  {/* Email Template Preview */}
                  <div className="bg-white p-3 rounded border text-xs">
                    <div className="font-semibold text-gray-800 mb-2">
                      Subject: 🎁 You received {amount} GGT crypto tokens!
                    </div>
                    <div className="text-gray-600 whitespace-pre-line">
                      {generateNewUserEmail().body.substring(0, 200)}...
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={copyEmailTemplate}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {emailCopied ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : (
                          <FileText className="w-4 h-4 mr-2" />
                        )}
                        {emailCopied ? 'Copied!' : 'Copy Template'}
                      </Button>
                      <Button
                        onClick={() => {
                          const { subject, body } = generateNewUserEmail();
                          const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                          window.open(mailtoUrl);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Open Email
                      </Button>
                    </div>
                    
                    <Button
                      onClick={() => setShowFullEmail(!showFullEmail)}
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {showFullEmail ? 'Hide' : 'Show'} Full Email Text
                    </Button>
                    
                    {showFullEmail && (
                      <div className="bg-gray-100 p-3 rounded text-xs max-h-40 overflow-y-auto">
                        <div className="font-semibold mb-2">Subject: {generateNewUserEmail().subject}</div>
                        <div className="whitespace-pre-line font-mono">{generateNewUserEmail().body}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Gift Details */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Gift ID:</span>
              <span className="font-medium">#{giftId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">{amount} GGT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recipient:</span>
              <span className="font-mono text-xs">{recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 text-center">
            Share this link with the recipient. They'll need to solve the location clue and visit the GPS coordinates to claim their gift!
            {isGasless && (
              <div className="mt-2 text-cyan-600 font-medium">
                🚀 Best part: They don't need any ETH to claim - you've covered all the fees!
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}