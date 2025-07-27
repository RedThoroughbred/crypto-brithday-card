'use client';

import { useAccount } from 'wagmi';
import { 
  User, 
  Gift, 
  MapPin, 
  Award,
  TrendingUp,
  Calendar,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { formatAddress, copyToClipboard } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Mock user data - will be replaced with real API calls
const mockUserStats = {
  giftsCreated: 12,
  giftsClaimed: 5,
  totalValueSent: '2.45',
  totalValueReceived: '0.8',
  favoriteLocation: 'Central Park, NYC',
  memberSince: '2024-01-01',
  achievementCount: 3,
};

const mockAchievements = [
  {
    id: '1',
    title: 'First Gift',
    description: 'Created your first GeoGift',
    icon: Gift,
    earned: true,
    earnedDate: '2024-01-15',
  },
  {
    id: '2',
    title: 'Treasure Hunter',
    description: 'Claimed 5 gifts successfully',
    icon: MapPin,
    earned: true,
    earnedDate: '2024-01-20',
  },
  {
    id: '3',
    title: 'Explorer',
    description: 'Visited 10 different locations',
    icon: Award,
    earned: true,
    earnedDate: '2024-01-25',
  },
  {
    id: '4',
    title: 'Generous Giver',
    description: 'Sent gifts worth over 1 ETH',
    icon: TrendingUp,
    earned: false,
    earnedDate: null,
  },
];

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to view your profile
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const handleCopyAddress = async () => {
    if (address) {
      const success = await copyToClipboard(address);
      if (success) {
        toast({
          title: 'Address Copied',
          description: 'Your wallet address has been copied to clipboard.',
        });
      }
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Profile Header */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-geogift-400 to-geogift-600 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
                    <div className="flex items-center space-x-2 mt-2">
                      <p className="text-gray-600 font-mono text-sm">{formatAddress(address || '')}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyAddress}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={`https://polygonscan.com/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Member since {new Date(mockUserStats.memberSince).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gifts Created</p>
                      <p className="text-3xl font-bold text-gray-900">{mockUserStats.giftsCreated}</p>
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
                      <p className="text-sm font-medium text-gray-600">Gifts Claimed</p>
                      <p className="text-3xl font-bold text-gray-900">{mockUserStats.giftsClaimed}</p>
                    </div>
                    <div className="rounded-lg bg-green-100 p-3">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Value Sent</p>
                      <p className="text-3xl font-bold text-gray-900">{mockUserStats.totalValueSent} ETH</p>
                    </div>
                    <div className="rounded-lg bg-purple-100 p-3">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Value Received</p>
                      <p className="text-3xl font-bold text-gray-900">{mockUserStats.totalValueReceived} ETH</p>
                    </div>
                    <div className="rounded-lg bg-yellow-100 p-3">
                      <MapPin className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>
                  Your GeoGift milestones and accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {mockAchievements.map((achievement) => {
                    const Icon = achievement.icon;
                    return (
                      <div
                        key={achievement.id}
                        className={`flex items-center space-x-4 p-4 rounded-lg border-2 ${
                          achievement.earned
                            ? 'border-geogift-200 bg-geogift-50'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                            achievement.earned
                              ? 'bg-geogift-500 text-white'
                              : 'bg-gray-300 text-gray-500'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{achievement.title}</h3>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                          {achievement.earned && achievement.earnedDate && (
                            <p className="text-xs text-geogift-600 mt-1">
                              Earned {new Date(achievement.earnedDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {achievement.earned && (
                          <div className="flex-shrink-0">
                            <Award className="w-5 h-5 text-geogift-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
                <CardDescription>
                  Your recent GeoGift activity and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-geogift-600" />
                      <div>
                        <p className="font-medium text-gray-900">Favorite Location</p>
                        <p className="text-sm text-gray-600">{mockUserStats.favoriteLocation}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-geogift-600" />
                      <div>
                        <p className="font-medium text-gray-900">Member Since</p>
                        <p className="text-sm text-gray-600">
                          {new Date(mockUserStats.memberSince).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Award className="h-5 w-5 text-geogift-600" />
                      <div>
                        <p className="font-medium text-gray-900">Achievements Unlocked</p>
                        <p className="text-sm text-gray-600">
                          {mockUserStats.achievementCount} of {mockAchievements.length} total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-geogift-500 rounded-full"
                          style={{
                            width: `${(mockUserStats.achievementCount / mockAchievements.length) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((mockUserStats.achievementCount / mockAchievements.length) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}