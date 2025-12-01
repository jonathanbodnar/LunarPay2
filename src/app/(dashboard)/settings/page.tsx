'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Building2, Palette, Bell, Key } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Account Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Processor</p>
            <p className="font-medium">{user?.paymentProcessor || 'FTS'}</p>
          </div>
          <Button variant="outline">Edit Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">Password</p>
            <Button variant="outline">Change Password</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Branding</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Customize your organization's branding, logo, and colors
          </p>
          <Button variant="outline">Manage Branding</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Integrations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Connect with QuickBooks, Stripe, and other services
          </p>
          <Button variant="outline">Manage Integrations</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive email alerts for transactions</p>
            </div>
            <input type="checkbox" className="h-4 w-4" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS Notifications</p>
              <p className="text-sm text-gray-500">Receive text alerts for important events</p>
            </div>
            <input type="checkbox" className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
