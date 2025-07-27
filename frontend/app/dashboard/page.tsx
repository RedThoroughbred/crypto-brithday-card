'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { 
  Plus, 
  Gift, 
  MapPin, 
  Clock, 
  TrendingUp,
  Users,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';

// Mock data - will be replaced with real API calls
const mockStats = {
  totalGifts: 12,
  totalValue: '2.45',
  activeGifts: 3,
  claimedGifts: 9,
};

const mockRecentGifts = [
  {
    id: '1',
    recipient: '0x742d...35Cc',
    amount: '0.1 ETH',
    status: 'claimed',
    location: 'Central Park, NYC',
    createdAt: '2024-01-15T10:00:00Z',
    claimedAt: '2024-01-16T14:30:00Z',
  },
  {
    id: '2',
    recipient: '0x123a...89Bb',
    amount: '0.05 ETH',
    status: 'active',
    location: 'Golden Gate Bridge, SF',
    createdAt: '2024-01-14T15:20:00Z',
    claimedAt: null,
  },
  {
    id: '3',
    recipient: '0x456c...12Dd',
    amount: '0.2 ETH',
    status: 'expired',
    location: 'Times Square, NYC',
    createdAt: '2024-01-10T09:15:00Z',
    claimedAt: null,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'text-blue-600 bg-blue-100';
    case 'claimed':
      return 'text-green-600 bg-green-100';
    case 'expired':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return Clock;
    case 'claimed':
      return Award;
    case 'expired':
      return Clock;
    default:
      return Gift;
  }
};

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to view your dashboard
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="mt-2 text-gray-600">
                    Welcome back! Here's an overview of your GeoGift activity.
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link href="/create">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Gift
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Gifts</p>
                      <p className="text-3xl font-bold text-gray-900">{mockStats.totalGifts}</p>
                    </div>
                    <div className="rounded-lg bg-blue-100 p-3">
                      <Gift className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Value</p>
                      <p className="text-3xl font-bold text-gray-900">{mockStats.totalValue} ETH</p>
                    </div>
                    <div className="rounded-lg bg-green-100 p-3">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Gifts</p>
                      <p className="text-3xl font-bold text-gray-900">{mockStats.activeGifts}</p>
                    </div>
                    <div className="rounded-lg bg-yellow-100 p-3">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Claimed Gifts</p>
                      <p className="text-3xl font-bold text-gray-900">{mockStats.claimedGifts}</p>
                    </div>
                    <div className="rounded-lg bg-purple-100 p-3">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Gifts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Gifts</CardTitle>
                <CardDescription>
                  Your latest gift activities and their current status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mockRecentGifts.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No gifts yet</h3>
                    <p className="mt-2 text-gray-600">
                      Get started by creating your first gift!
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/create">Create Your First Gift</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockRecentGifts.map((gift) => {
                      const StatusIcon = getStatusIcon(gift.status);
                      return (
                        <div
                          key={gift.id}
                          className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="rounded-lg bg-geogift-100 p-2">
                              <StatusIcon className="h-5 w-5 text-geogift-600" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900">
                                  Gift to {gift.recipient}
                                </p>
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                                    gift.status
                                  )}`}
                                >
                                  {gift.status}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{gift.amount}</span>
                                <span className="flex items-center">
                                  <MapPin className="mr-1 h-3 w-3" />
                                  {gift.location}
                                </span>
                                <span>
                                  {gift.status === 'claimed' && gift.claimedAt
                                    ? `Claimed ${new Date(gift.claimedAt).toLocaleDateString()}`
                                    : `Created ${new Date(gift.createdAt).toLocaleDateString()}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}