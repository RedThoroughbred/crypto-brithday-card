'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Settings,
  Bell,
  Shield,
  MapPin, 
  Award,
  Calendar,
  Copy,
  ExternalLink,
  Edit3,
  Mail,
  Globe,
  Eye,
  EyeOff,
  Palette,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { formatAddress, copyToClipboard } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { profileAPI, UserProfileUpdate, NotificationPreferencesUpdate } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// Achievement icon mapping
const achievementIcons = {
  welcome_aboard: User,
  first_steps: Gift,
  adventure_seeker: MapPin,
  chain_master: Award,
  community_member: Calendar,
  explorer: Globe,
};

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, authenticate, token, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Local state for form editing
  const [editMode, setEditMode] = useState(false);
  const [localProfile, setLocalProfile] = useState({
    display_name: '',
    bio: '',
    favorite_location: '',
    is_public_profile: false,
  });

  // Set auth token for API client
  useEffect(() => {
    if (token) {
      profileAPI.setAuthToken(token);
    }
  }, [token]);

  // Fetch user profile
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError
  } = useQuery({
    queryKey: ['profile', address],
    queryFn: profileAPI.getProfile,
    enabled: isConnected && isAuthenticated && !!token,
  });

  // Fetch notification preferences
  const {
    data: preferencesData,
    isLoading: preferencesLoading,
    error: preferencesError
  } = useQuery({
    queryKey: ['preferences', address],
    queryFn: profileAPI.getPreferences,
    enabled: isConnected && isAuthenticated && !!token,
  });

  // Fetch achievements
  const {
    data: achievementsData,
    isLoading: achievementsLoading,
    error: achievementsError
  } = useQuery({
    queryKey: ['achievements', address],
    queryFn: profileAPI.getAchievements,
    enabled: isConnected && isAuthenticated && !!token,
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: profileAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['profile', address]);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    },
  });

  // Preferences update mutation
  const preferencesMutation = useMutation({
    mutationFn: profileAPI.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries(['preferences', address]);
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update preferences.',
        variant: 'destructive',
      });
    },
  });

  // Update local state when profile data changes
  useEffect(() => {
    if (profileData) {
      setLocalProfile({
        display_name: profileData.display_name || '',
        bio: profileData.bio || '',
        favorite_location: profileData.favorite_location || '',
        is_public_profile: profileData.is_public_profile || false,
      });
    }
  }, [profileData]);

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
          <Card className="w-full max-w-md card-glow">
            <CardHeader className="text-center">
              <CardTitle className="text-white">Connect Your Wallet</CardTitle>
              <CardDescription className="text-gray-400">
                Please connect your wallet to view your profile
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
                Please authenticate with your wallet to access your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => {
                  console.log('Profile: Authenticate button clicked, wallet connected:', isConnected, 'address:', address);
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

  // Show loading state (including auth loading)
  if (authLoading || profileLoading || preferencesLoading || achievementsLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen gradient-dark-bg">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-64 mb-8"></div>
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-32 bg-gray-700 rounded card-glow"></div>
                <div className="h-96 bg-gray-700 rounded card-glow"></div>
              </div>
            </div>
          </div>
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

  const handleLocalProfileChange = (field: string, value: string | boolean) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    const updateData: UserProfileUpdate = {};
    
    // Only include changed fields
    if (localProfile.display_name !== (profileData?.display_name || '')) {
      updateData.display_name = localProfile.display_name || null;
    }
    if (localProfile.bio !== (profileData?.bio || '')) {
      updateData.bio = localProfile.bio || null;
    }
    if (localProfile.favorite_location !== (profileData?.favorite_location || '')) {
      updateData.favorite_location = localProfile.favorite_location || null;
    }
    if (localProfile.is_public_profile !== (profileData?.is_public_profile || false)) {
      updateData.is_public_profile = localProfile.is_public_profile;
    }

    if (Object.keys(updateData).length > 0) {
      profileMutation.mutate(updateData);
    }
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    if (profileData) {
      setLocalProfile({
        display_name: profileData.display_name || '',
        bio: profileData.bio || '',
        favorite_location: profileData.favorite_location || '',
        is_public_profile: profileData.is_public_profile || false,
      });
    }
    setEditMode(false);
  };

  const handlePreferencesUpdate = (field: string, value: boolean) => {
    const updateData: NotificationPreferencesUpdate = { [field]: value };
    preferencesMutation.mutate(updateData);
  };

  return (
    <MainLayout>
      <div className="min-h-screen gradient-dark-bg">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <Card className="mb-8 bg-gray-800/50 border-gray-700 card-glow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <User className="w-10 h-10 text-black" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white text-glow">Your Profile</h1>
                    <div className="flex items-center space-x-2 mt-2">
                      <p className="text-gray-300 font-mono text-sm">{formatAddress(address || '')}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyAddress}
                        className="text-gray-400 hover:text-cyan-400"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-gray-400 hover:text-cyan-400"
                      >
                        <a
                          href={`https://sepolia.etherscan.io/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Member since {profileData?.member_since ? new Date(profileData.member_since).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
                <TabsTrigger 
                  value="achievements"
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Achievements
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="bg-gray-800/50 border-gray-700 card-glow">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center">
                        <Edit3 className="w-5 h-5 mr-2 text-cyan-400" />
                        Profile Information
                      </div>
                      <div className="flex space-x-2">
                        {!editMode ? (
                          <Button
                            onClick={() => setEditMode(true)}
                            variant="outline"
                            size="sm"
                            className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={handleSaveProfile}
                              size="sm"
                              className="bg-cyan-500 hover:bg-cyan-600 text-black"
                              disabled={profileMutation.isLoading}
                            >
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              variant="outline"
                              size="sm"
                              className="border-gray-600 text-gray-400 hover:bg-gray-700"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Customize how you appear to other users
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-white">Display Name</Label>
                      <Input
                        id="displayName"
                        placeholder="Enter your display name"
                        value={localProfile.display_name}
                        onChange={(e) => handleLocalProfileChange('display_name', e.target.value)}
                        disabled={!editMode}
                        className={`${!editMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-700 border-gray-600 text-white'}`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-white">Bio</Label>
                      <Input
                        id="bio"
                        placeholder="Tell others about yourself"
                        value={localProfile.bio}
                        onChange={(e) => handleLocalProfileChange('bio', e.target.value)}
                        disabled={!editMode}
                        className={`${!editMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-700 border-gray-600 text-white'}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="favoriteLocation" className="text-white">Favorite Location</Label>
                      <Input
                        id="favoriteLocation"
                        placeholder="Your favorite place for adventures"
                        value={localProfile.favorite_location}
                        onChange={(e) => handleLocalProfileChange('favorite_location', e.target.value)}
                        disabled={!editMode}
                        className={`${!editMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-700 border-gray-600 text-white'}`}
                      />
                    </div>

                    <div className="flex items-center space-x-2 opacity-60 pointer-events-none">
                      <Switch
                        id="publicProfile"
                        checked={localProfile.is_public_profile}
                        onCheckedChange={(checked) => handleLocalProfileChange('is_public_profile', checked)}
                        disabled={true}
                      />
                      <Label htmlFor="publicProfile" className="text-white">
                        Make profile public (Coming Soon)
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card className="bg-gray-800/50 border-gray-700 card-glow">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Bell className="w-5 h-5 mr-2 text-cyan-400" />
                      Notifications
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Manage your notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-white">Email Notifications</Label>
                        <p className="text-sm text-gray-400">Receive updates about your gifts</p>
                      </div>
                      <Switch
                        checked={preferencesData?.email_notifications || false}
                        onCheckedChange={(checked) => handlePreferencesUpdate('email_notifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-white">Gift Notifications</Label>
                        <p className="text-sm text-gray-400">Get notified when you receive gifts</p>
                      </div>
                      <Switch
                        checked={preferencesData?.gift_notifications || false}
                        onCheckedChange={(checked) => handlePreferencesUpdate('gift_notifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-white">Marketing Emails</Label>
                        <p className="text-sm text-gray-400">Receive news and updates</p>
                      </div>
                      <Switch
                        checked={preferencesData?.marketing_emails || false}
                        onCheckedChange={(checked) => handlePreferencesUpdate('marketing_emails', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700 card-glow">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-cyan-400" />
                      Privacy & Security
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Control your privacy settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="text-white font-medium">Member Since</p>
                          <p className="text-sm text-gray-400">
                            {profileData?.member_since ? new Date(profileData.member_since).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }) : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Achievements Tab */}
              <TabsContent value="achievements" className="space-y-6">
                <Card className="bg-gray-800/50 border-gray-700 card-glow">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Award className="w-5 h-5 mr-2 text-cyan-400" />
                      Personal Achievements
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Your GeoGift milestones and personal accomplishments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {achievementsData?.achievements?.map((achievement) => {
                        const Icon = achievementIcons[achievement.id as keyof typeof achievementIcons] || Award;
                        return (
                          <div
                            key={achievement.id}
                            className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all ${
                              achievement.earned
                                ? 'border-cyan-400/50 bg-cyan-400/10 shadow-md shadow-cyan-400/20'
                                : 'border-gray-600 bg-gray-700/30 opacity-60'
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                                achievement.earned
                                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                                  : 'bg-gray-600 text-gray-400'
                              }`}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-white">{achievement.title}</h3>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    achievement.category === 'milestone' ? 'border-blue-400 text-blue-400' :
                                    achievement.category === 'creator' ? 'border-green-400 text-green-400' :
                                    'border-purple-400 text-purple-400'
                                  }`}
                                >
                                  {achievement.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400">{achievement.description}</p>
                              {achievement.earned && achievement.earned_date && (
                                <p className="text-xs text-cyan-400 mt-1">
                                  Earned {new Date(achievement.earned_date).toLocaleDateString()}
                                </p>
                              )}
                              {!achievement.earned && achievement.progress && (
                                <div className="mt-2">
                                  <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                      className="bg-cyan-500 h-2 rounded-full"
                                      style={{ width: `${achievement.progress}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {achievement.progress}% complete
                                  </p>
                                </div>
                              )}
                            </div>
                            {achievement.earned && (
                              <div className="flex-shrink-0">
                                <Award className="w-5 h-5 text-cyan-400" />
                              </div>
                            )}
                          </div>
                        );
                      }) || (
                        <div className="col-span-2 text-center text-gray-400 py-8">
                          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No achievements data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}