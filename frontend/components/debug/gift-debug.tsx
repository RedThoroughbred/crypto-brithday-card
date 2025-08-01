'use client';

import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import { useNewUserGiftEscrow } from '@/hooks/useNewUserGiftEscrow';

interface GiftDebugProps {
  giftId: string;
}

export function GiftDebug({ giftId }: GiftDebugProps) {
  const { address, isConnected } = useAccount();
  const { isAuthenticated } = useAuth();
  const { useGiftDetails, useIsClaimable } = useNewUserGiftEscrow();
  
  const { data: giftDetails, isLoading: loadingDetails, error: giftError } = useGiftDetails(giftId);
  const { data: isClaimable, isLoading: loadingClaimable, error: claimError } = useIsClaimable(giftId);
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg text-xs text-white font-mono mt-4">
      <h3 className="text-yellow-400 font-bold mb-2">🐛 Debug Info</h3>
      
      <div className="space-y-1">
        <div>Gift ID: {giftId}</div>
        <div>Connected: {isConnected ? '✅' : '❌'}</div>
        <div>Address: {address || 'None'}</div>
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>Contract: 0x8284ab51a3221c7b295f949512B43DA1EB0Cd44f</div>
      </div>
      
      <div className="mt-3 space-y-1">
        <div className="text-cyan-400 font-bold">Gift Details Query:</div>
        <div>Loading: {loadingDetails ? '⏳' : '✅'}</div>
        <div>Error: {giftError ? `❌ ${giftError.message}` : '✅'}</div>
        <div>Data: {giftDetails ? 
          `✅ Sender: ${giftDetails[0]?.slice(0, 8)}...` : 
          '❌ No data'
        }</div>
      </div>
      
      <div className="mt-3 space-y-1">
        <div className="text-purple-400 font-bold">Claimable Query:</div>
        <div>Loading: {loadingClaimable ? '⏳' : '✅'}</div>
        <div>Error: {claimError ? `❌ ${claimError.message}` : '✅'}</div>
        <div>Claimable: {isClaimable !== undefined ? 
          (isClaimable ? '✅ Yes' : '❌ No') : 
          '❓ Unknown'
        }</div>
      </div>
      
      {giftDetails && (
        <div className="mt-3 space-y-1">
          <div className="text-green-400 font-bold">Raw Gift Data:</div>
          <div className="text-xs bg-black/30 p-2 rounded overflow-x-auto">
            {JSON.stringify(giftDetails, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value, 2
            )}
          </div>
        </div>
      )}
    </div>
  );
}