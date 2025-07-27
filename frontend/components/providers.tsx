'use client';

import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { polygon, polygonMumbai } from 'wagmi/chains';
import { ThemeProvider } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';

const chains = process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true' 
  ? [polygonMumbai, polygon] as const
  : [polygon] as const;

const config = getDefaultConfig({
  appName: 'GeoGift',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'geogift-default',
  chains,
  ssr: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          showRecentTransactions={true}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={true}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}