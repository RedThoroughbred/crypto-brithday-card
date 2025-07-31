import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplateGeneratorProps {
  giftType: 'gift' | 'chain';
  giftId: string;
  amount: string;
  tokenSymbol: string;
  message?: string;
  location?: string;
  unlockType?: string;
  onCopy?: () => void;
}

export function EmailTemplateGenerator({
  giftType,
  giftId,
  amount,
  tokenSymbol,
  message,
  location,
  unlockType,
  onCopy
}: EmailTemplateGeneratorProps) {
  const { toast } = useToast();
  const baseUrl = window.location.origin;
  
  const generateEmailTemplate = () => {
    const claimUrl = `${baseUrl}/${giftType}/${giftId}`;
    const getStartedUrl = `${baseUrl}/get-started/${giftId}`;
    
    const unlockInstructions = unlockType === 'gps' && location 
      ? `📍 Location: ${location}\n🔓 Go to this location to unlock your gift`
      : unlockType === 'password'
      ? `🔓 You'll need a password to unlock this gift`
      : '';
    
    const subject = `🎁 You received ${amount} ${tokenSymbol} crypto tokens!`;
    
    const body = `Hi there!

I've sent you ${amount} ${tokenSymbol} tokens as a crypto gift!

💰 Your Gift: ${amount} ${tokenSymbol} tokens
${unlockInstructions}
${message ? `\n💬 Message: "${message}"` : ''}

Ready to claim? Click here:
${claimUrl}

New to crypto? No problem! Get started here:
${getStartedUrl}

This gift expires in 30 days.

Enjoy!`;

    return { subject, body };
  };
  
  const copyToClipboard = async () => {
    const { subject, body } = generateEmailTemplate();
    const fullEmail = `Subject: ${subject}\n\n${body}`;
    
    try {
      await navigator.clipboard.writeText(fullEmail);
      toast({
        title: 'Email template copied!',
        description: 'Paste it into your email client',
      });
      onCopy?.();
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };
  
  const openEmailClient = () => {
    const { subject, body } = generateEmailTemplate();
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };
  
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
          {generateEmailTemplate().body}
        </pre>
      </Card>
      
      <div className="flex gap-2">
        <Button
          onClick={copyToClipboard}
          className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Template
        </Button>
        
        <Button
          onClick={openEmailClient}
          variant="outline"
          className="flex-1 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
        >
          <Mail className="w-4 h-4 mr-2" />
          Open Email
        </Button>
      </div>
    </div>
  );
}