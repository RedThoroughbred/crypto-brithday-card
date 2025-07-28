'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestWalletPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Wallet Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div>
              <p className="text-green-600 font-medium">✅ Connected</p>
              <p className="text-sm font-mono break-all">{address}</p>
              <Button onClick={() => disconnect()} className="w-full mt-4">
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-red-600 font-medium">❌ Not Connected</p>
              {connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  className="w-full"
                >
                  Connect {connector.name}
                </Button>
              ))}
            </div>
          )}
          
          <div className="mt-6 text-xs text-gray-500">
            <p>Available connectors: {connectors.length}</p>
            <p>MetaMask installed: {typeof window !== 'undefined' && window.ethereum ? 'Yes' : 'No'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}