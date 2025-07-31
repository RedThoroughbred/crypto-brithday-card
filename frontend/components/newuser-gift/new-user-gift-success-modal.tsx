import { useState } from 'react';
import { Copy, Mail, Check, Eye, Users, Gift, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatClaimCodeForDisplay, calculateExpiryDate } from '@/lib/newuser-gift';

interface NewUserGiftSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  giftId: string;
  claimCode: string;
  amount: string;
  message: string;
  expiryDays: number;
  unlockType: string;
}

export function NewUserGiftSuccessModal({
  isOpen,
  onClose,
  giftId,
  claimCode,
  amount,
  message,
  expiryDays,
  unlockType,
}: NewUserGiftSuccessModalProps) {
  const { toast } = useToast();
  const [emailCopied, setEmailCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showFullEmail, setShowFullEmail] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const claimUrl = `${baseUrl}/claim-newuser/${giftId}`;
  const getStartedUrl = `${baseUrl}/get-started/${giftId}`;
  const expiryDate = calculateExpiryDate(expiryDays);

  const generateEmailTemplate = () => {
    const subject = `🎁 You received ${amount} GGT crypto tokens!`;
    const body = `Hi there!

I've sent you ${amount} GGT as a crypto gift!

💰 Your Gift: ${amount} GGT (GeoGift Tokens)
🔐 Claim Code: ${formatClaimCodeForDisplay(claimCode)}
💬 Message: "${message}"

Ready to claim? Click here:
${claimUrl}

New to crypto? No problem! Get started here:
${getStartedUrl}

This gift expires on: ${expiryDate.toLocaleDateString()}

Enjoy your first crypto experience!`;

    return { subject, body };
  };

  const copyClaimCode = async () => {
    try {
      await navigator.clipboard.writeText(claimCode);
      setCodeCopied(true);
      toast({
        title: 'Claim code copied!',
        description: 'Share this code with the recipient',
      });
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Please copy the code manually',
        variant: 'destructive',
      });
    }
  };

  const copyEmailTemplate = async () => {
    try {
      const { subject, body } = generateEmailTemplate();
      const fullEmail = `Subject: ${subject}\n\n${body}`;
      await navigator.clipboard.writeText(fullEmail);
      setEmailCopied(true);
      toast({
        title: 'Email template copied!',
        description: 'Paste it into your email client',
      });
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (error) {
      setShowFullEmail(true);
      toast({
        title: 'Copy failed - text shown below',
        description: 'Manually copy the email text',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            🎉 New User Gift Created!
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              No Wallet Required
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Your {amount} GGT gift is ready! The recipient can claim it with the code below, 
            even if they don't have a crypto wallet yet.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Claim Code Display */}
          <Card className="bg-gradient-to-r from-blue-950/50 to-purple-950/50 border-blue-400/50">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-blue-100">
                  <Gift className="w-5 h-5" />
                  <span className="font-medium">Claim Code</span>
                </div>
                
                <div className="bg-black/30 p-4 rounded-lg border border-blue-400/30">
                  <div className="text-2xl font-mono text-blue-300 tracking-wider">
                    {formatClaimCodeForDisplay(claimCode)}
                  </div>
                </div>
                
                <Button
                  onClick={copyClaimCode}
                  variant="outline"
                  className="border-blue-400 text-blue-300 hover:bg-blue-400/10"
                >
                  {codeCopied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {codeCopied ? 'Copied!' : 'Copy Claim Code'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gift Details */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium text-white flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Gift Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-medium ml-2">{amount} GGT</span>
                </div>
                <div>
                  <span className="text-gray-400">Unlock Type:</span>
                  <span className="text-white font-medium ml-2 capitalize">{unlockType}</span>
                </div>
                <div>
                  <span className="text-gray-400">Expires:</span>
                  <span className="text-white font-medium ml-2">{expiryDate.toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Gift ID:</span>
                  <span className="text-white font-mono text-xs ml-2">{giftId.slice(0, 8)}...</span>
                </div>
              </div>
              {message && (
                <div>
                  <span className="text-gray-400">Message:</span>
                  <p className="text-white mt-1 italic">"{message}"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Template */}
          <Card className="bg-green-950/30 border-green-400/50">
            <CardContent className="p-4">
              <h3 className="text-green-100 font-medium mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Template for Recipient
              </h3>
              
              {!showFullEmail ? (
                <div className="bg-black/20 p-3 rounded border text-xs">
                  <div className="font-semibold text-gray-200 mb-2">
                    Subject: 🎁 You received {amount} GGT crypto tokens!
                  </div>
                  <div className="text-gray-300">
                    {generateEmailTemplate().body.substring(0, 150)}...
                  </div>
                </div>
              ) : (
                <div className="bg-black/20 p-3 rounded text-xs max-h-40 overflow-y-auto">
                  <div className="font-semibold mb-2 text-gray-200">
                    Subject: {generateEmailTemplate().subject}
                  </div>
                  <div className="whitespace-pre-line font-mono text-gray-300">
                    {generateEmailTemplate().body}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={copyEmailTemplate}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {emailCopied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  {emailCopied ? 'Copied!' : 'Copy Email Template'}
                </Button>
                
                <Button
                  onClick={() => setShowFullEmail(!showFullEmail)}
                  variant="outline"
                  size="sm"
                  className="border-green-400 text-green-300"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {showFullEmail ? 'Hide' : 'Show'} Full Text
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-yellow-950/30 border-yellow-400/50">
            <CardContent className="p-4">
              <h3 className="text-yellow-100 font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                What happens next?
              </h3>
              <ol className="text-yellow-200/80 text-sm space-y-1 list-decimal list-inside">
                <li>Copy the email template above</li>
                <li>Send it to your friend via email</li>
                <li>They'll follow the link to set up their wallet (if needed)</li>
                <li>They enter the claim code to receive the {amount} GGT</li>
                <li>If unclaimed by {expiryDate.toLocaleDateString()}, you get an automatic refund</li>
              </ol>
            </CardContent>
          </Card>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}