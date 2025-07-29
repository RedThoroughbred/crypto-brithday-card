import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'GeoGift - Location-Verified Crypto Gifts',
    template: '%s | GeoGift',
  },
  description: 'Transform passive money transfers into active, memorable experiences with location-verified crypto gift cards.',
  keywords: ['crypto', 'gifts', 'location', 'blockchain', 'treasure hunt', 'Web3'],
  authors: [{ name: 'GeoGift Team' }],
  creator: 'GeoGift',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'GeoGift - Location-Verified Crypto Gifts',
    description: 'Transform passive money transfers into active, memorable experiences with location-verified crypto gift cards.',
    siteName: 'GeoGift',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GeoGift - Location-Verified Crypto Gifts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GeoGift - Location-Verified Crypto Gifts',
    description: 'Transform passive money transfers into active, memorable experiences with location-verified crypto gift cards.',
    images: ['/og-image.png'],
    creator: '@geogift',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
          firaCode.variable
        )}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}