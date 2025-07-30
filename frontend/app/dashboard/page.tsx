'use client';

/**
 * Dashboard Page - User's gift and chain history
 * 
 * Shows comprehensive view of sent/received gifts and chains with statistics
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { DashboardStats, GiftsTable, ChainsTable } from '@/components/dashboard';
import { Gift, MapPin, Users, TrendingUp, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, authenticate, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch dashboard stats
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useQuery({
    queryKey: ['dashboard-stats', address],
    queryFn: dashboardAPI.getStats,
    enabled: isConnected && isAuthenticated && !!address,
  });

  // Show wallet connection prompt
  if (!isConnected) {
    return (
      <MainLayout>
        <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
          <Card className="w-full max-w-md card-glow">
            <CardHeader className="text-center">
              <CardTitle className="text-white">Connect Your Wallet</CardTitle>
              <CardDescription className="text-gray-400">
                Please connect your wallet to view your gift dashboard
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Show authentication prompt (but wait for auth loading to complete)
  if (!authLoading && !isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
          <Card className="w-full max-w-md card-glow">
            <CardHeader className="text-center">
              <CardTitle className="text-white">Authentication Required</CardTitle>
              <CardDescription className="text-gray-400">
                Please authenticate with your wallet to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => {
                  console.log('Dashboard: Authenticate button clicked, wallet connected:', isConnected, 'address:', address);
                  authenticate();
                }}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
              >
                Authenticate Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Handle loading state (including auth loading)
  if (authLoading || statsLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen gradient-dark-bg">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-64 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-700 rounded card-glow"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Handle error state
  if (statsError) {
    return (
      <MainLayout>
        <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
          <Card className="w-full max-w-md card-glow">
            <CardHeader className="text-center">
              <CardTitle className="text-red-400">Error Loading Dashboard</CardTitle>
              <CardDescription className="text-gray-400">
                {statsError instanceof Error ? statsError.message : 'Failed to load dashboard data'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => window.location.reload()}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen gradient-dark-bg">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 text-glow">
              Your GeoGift Dashboard
            </h1>
            <p className="text-gray-400">
              Track your gifts, chains, and crypto adventures
            </p>
          </div>

          {/* Statistics Overview */}
          {stats && <DashboardStats stats={stats} />}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
              >
                <Activity className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="sent-gifts"
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
              >
                <Gift className="w-4 h-4 mr-2" />
                Sent Gifts
              </TabsTrigger>
              <TabsTrigger 
                value="sent-chains"
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Sent Chains
              </TabsTrigger>
              <TabsTrigger 
                value="received-gifts"
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
              >
                <Users className="w-4 h-4 mr-2" />
                Received Gifts
              </TabsTrigger>
              <TabsTrigger 
                value="received-chains"
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Received Chains
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="bg-gray-800/50 border-gray-700 card-glow">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                    <CardDescription className="text-gray-400">
                      Your latest gift and chain events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats?.recent_activity?.length ? (
                      <div className="space-y-3">
                        {stats.recent_activity.map((activity, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                            <div className="flex items-center space-x-3">
                              <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                                {activity.type}
                              </Badge>
                              <span className="text-white text-sm">
                                To: {activity.recipient}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-cyan-400 font-bold">
                                {activity.amount} GGT
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(activity.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No recent activity yet</p>
                        <p className="text-sm">Create your first gift to get started!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Popular Unlock Types */}
                <Card className="bg-gray-800/50 border-gray-700 card-glow">
                  <CardHeader>
                    <CardTitle className="text-white">Popular Unlock Types</CardTitle>
                    <CardDescription className="text-gray-400">
                      Your most used gift mechanisms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats?.popular_unlock_types?.length ? (
                      <div className="space-y-3">
                        {stats.popular_unlock_types.map((type, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-white capitalize">{type.type.replace('_', ' ')}</span>
                            <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                              {type.count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No gift types yet</p>
                        <p className="text-sm">Create some gifts to see your preferences!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sent-gifts" className="mt-6">
              <GiftsTable type="sent" />
            </TabsContent>

            <TabsContent value="sent-chains" className="mt-6">
              <ChainsTable type="sent" />
            </TabsContent>

            <TabsContent value="received-gifts" className="mt-6">
              <GiftsTable type="received" />
            </TabsContent>

            <TabsContent value="received-chains" className="mt-6">
              <ChainsTable type="received" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}