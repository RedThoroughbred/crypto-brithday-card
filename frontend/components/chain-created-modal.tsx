import { useState } from 'react';
import { Copy, Mail, MessageSquare, Check, ExternalLink, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ChainCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainId: number | null;
  chainTitle: string;
  totalAmount: string;
  stepCount: number;
  recipientAddress: string;
}

export function ChainCreatedModal({
  isOpen,
  onClose,
  chainId,
  chainTitle,
  totalAmount,
  stepCount,
  recipientAddress,
}: ChainCreatedModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Generate chain URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const chainUrl = `${baseUrl}/chain/${chainId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(chainUrl);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Chain link copied to clipboard',
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

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`You received a GGT Gift Chain: ${chainTitle}`);
    const body = encodeURIComponent(
      `You've received a ${stepCount}-step adventure worth ${totalAmount} GGT!\n\n${chainTitle}\n\nStart your journey here: ${chainUrl}\n\nFollow the clues and complete each step to unlock your rewards!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    const text = encodeURIComponent(`You received a ${stepCount}-step GGT adventure worth ${totalAmount} GGT! Start here: ${chainUrl}`);
    window.open(`sms:?body=${text}`);
  };

  const openInNewTab = () => {
    window.open(chainUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎉 GGT Chain Created Successfully!</DialogTitle>
          <DialogDescription>
            Your {stepCount}-step adventure worth {totalAmount} GGT has been created and is ready to share.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Chain URL Display */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
              {chainUrl}
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

          {/* QR Code - Coming Soon */}
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
            <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
              QR Code
              <br />
              (Coming Soon)
            </div>
          </div>

          {/* Sharing Options */}
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

          {/* Chain Details */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Chain ID:</span>
              <span className="font-medium">#{chainId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Title:</span>
              <span className="font-medium">{chainTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Value:</span>
              <span className="font-medium flex items-center gap-1">
                <Coins className="h-4 w-4" />
                {totalAmount} GGT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Steps:</span>
              <span className="font-medium">{stepCount} locations</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recipient:</span>
              <span className="font-mono text-xs">{recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 text-center">
            Share this link with the recipient. They'll complete {stepCount} steps in order, visiting each location to unlock their GGT rewards!
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}