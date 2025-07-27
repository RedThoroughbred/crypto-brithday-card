'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useTheme } from 'next-themes';
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    notifications: {
      email: '',
      giftCreated: true,
      giftClaimed: true,
      giftExpiring: true,
      newsletter: false,
    },
    privacy: {
      profilePublic: false,
      showActivity: true,
      allowAnalytics: true,
    },
    defaults: {
      defaultRadius: 50,
      defaultExpiry: 30,
      defaultCurrency: 'ETH',
    },
  });

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to access settings
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const handleSave = () => {
    // Here we would save settings to the backend
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been updated successfully.',
    });
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="mr-3 h-8 w-8" />
                Settings
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your GeoGift preferences and account settings.
              </p>
            </div>

            {/* Theme Settings */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="mr-2 h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how GeoGift looks on your device
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Theme
                    </label>
                    <div className="flex space-x-3">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        onClick={() => setTheme('light')}
                        className="flex items-center"
                      >
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        onClick={() => setTheme('dark')}
                        className="flex items-center"
                      >
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                      </Button>
                      <Button
                        variant={theme === 'system' ? 'default' : 'outline'}
                        onClick={() => setTheme('system')}
                        className="flex items-center"
                      >
                        <Monitor className="mr-2 h-4 w-4" />
                        System
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={settings.notifications.email}
                      onChange={(e) => updateSetting('notifications', 'email', e.target.value)}
                      placeholder="your@email.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Receive email notifications about your gifts
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.giftCreated}
                          onChange={(e) => updateSetting('notifications', 'giftCreated', e.target.checked)}
                          className="rounded border-gray-300 text-geogift-600 focus:ring-geogift-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          Gift created successfully
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.giftClaimed}
                          onChange={(e) => updateSetting('notifications', 'giftClaimed', e.target.checked)}
                          className="rounded border-gray-300 text-geogift-600 focus:ring-geogift-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          Gift claimed by recipient
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.giftExpiring}
                          onChange={(e) => updateSetting('notifications', 'giftExpiring', e.target.checked)}
                          className="rounded border-gray-300 text-geogift-600 focus:ring-geogift-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          Gift expiring soon
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.newsletter}
                          onChange={(e) => updateSetting('notifications', 'newsletter', e.target.checked)}
                          className="rounded border-gray-300 text-geogift-600 focus:ring-geogift-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          GeoGift newsletter and updates
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>
                  Control your privacy and data sharing preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Public Profile
                      </span>
                      <p className="text-xs text-gray-500">
                        Allow others to see your profile and achievements
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.privacy.profilePublic}
                      onChange={(e) => updateSetting('privacy', 'profilePublic', e.target.checked)}
                      className="rounded border-gray-300 text-geogift-600 focus:ring-geogift-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Show Activity
                      </span>
                      <p className="text-xs text-gray-500">
                        Display your gift activity on your profile
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.privacy.showActivity}
                      onChange={(e) => updateSetting('privacy', 'showActivity', e.target.checked)}
                      className="rounded border-gray-300 text-geogift-600 focus:ring-geogift-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Analytics
                      </span>
                      <p className="text-xs text-gray-500">
                        Help improve GeoGift by sharing anonymous usage data
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.privacy.allowAnalytics}
                      onChange={(e) => updateSetting('privacy', 'allowAnalytics', e.target.checked)}
                      className="rounded border-gray-300 text-geogift-600 focus:ring-geogift-500"
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Default Settings */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Default Gift Settings
                </CardTitle>
                <CardDescription>
                  Set default values for new gifts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Claim Radius (meters)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={settings.defaults.defaultRadius}
                      onChange={(e) => updateSetting('defaults', 'defaultRadius', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Expiry (days)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={settings.defaults.defaultExpiry}
                      onChange={(e) => updateSetting('defaults', 'defaultExpiry', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-medium text-red-900 mb-2">
                      Delete Account Data
                    </h4>
                    <p className="text-sm text-red-700 mb-4">
                      This will permanently delete your profile data and preferences. 
                      Your on-chain gifts and transactions will remain on the blockchain.
                    </p>
                    <Button variant="destructive" size="sm">
                      Delete Account Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <Button onClick={handleSave} size="lg">
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}