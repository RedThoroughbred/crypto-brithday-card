'use client';

import { useAccount, useBalance } from 'wagmi';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { GGT_TOKEN, ERC20_ABI } from '@/lib/tokens';

export function BalanceDisplay() {
  const { address, isConnected } = useAccount();

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  });

  // Get GGT balance
  const { data: ggtBalance, error: ggtError, isLoading: ggtLoading } = useReadContract({
    address: GGT_TOKEN.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Debug logging removed - GGT balance working correctly

  if (!isConnected || !address) {
    return null;
  }

  const formattedGGTBalance = ggtBalance 
    ? parseFloat(formatUnits(ggtBalance as bigint, GGT_TOKEN.decimals)).toLocaleString()
    : ggtLoading 
    ? 'Loading...' 
    : ggtError 
    ? 'Error' 
    : '0';

  const formattedETHBalance = ethBalance
    ? parseFloat(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)
    : '0';

  return (
    <div className="flex items-center space-x-3 text-sm">
      <div className="flex items-center space-x-1">
        <span className="text-cyan-400">🎁</span>
        <span className="font-medium text-white">{formattedGGTBalance}</span>
        <span className="text-gray-400">GGT</span>
      </div>
      <div className="flex items-center space-x-1">
        <span className="text-cyan-400">Ξ</span>
        <span className="font-medium text-white">{formattedETHBalance}</span>
        <span className="text-gray-400">SEP</span>
      </div>
    </div>
  );
}