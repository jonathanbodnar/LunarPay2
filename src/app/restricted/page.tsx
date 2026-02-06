'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Send, LogOut, Loader2, CheckCircle } from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  restricted: boolean;
  restrictedReason: string | null;
}

export default function RestrictedPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    fetchUserAndOrganization();
  }, []);

  const fetchUserAndOrganization = async () => {
    try {
      // Fetch user info and organization in parallel
      const [userRes, orgsRes] = await Promise.all([
        fetch('/api/auth/me', { credentials: 'include' }),
        fetch('/api/organizations', { credentials: 'include' }),
      ]);

      // Pre-fill user info
      if (userRes.ok) {
        const userData = await userRes.json();
        const user = userData.user;
        if (user) {
          setFormData(prev => ({
            ...prev,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email || '',
          }));
        }
      }

      // Check organization restriction
      if (orgsRes.ok) {
        const data = await orgsRes.json();
        const org = data.organizations?.[0];
        if (org) {
          setOrganization(org);
          // If not restricted, redirect to dashboard
          if (!org.restricted) {
            router.push('/dashboard');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create a support ticket for the restricted account appeal
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: `Account Restriction Appeal - ${organization?.name}`,
          message: `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
          category: 'account',
          priority: 'high',
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting appeal:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="LunarPay" className="h-10 mx-auto" />
        </div>

        {/* Restriction Notice */}
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-red-900">Account Restricted</h2>
                <p className="text-red-700 mt-1">
                  Your account has been restricted and cannot access LunarPay services at this time.
                </p>
                {organization?.restrictedReason && (
                  <p className="text-sm text-red-600 mt-2 bg-red-100 p-2 rounded">
                    <strong>Reason:</strong> {organization.restrictedReason}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support Form */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>
              If you believe this is a mistake or would like to appeal, please fill out the form below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Request Submitted</h3>
                <p className="text-muted-foreground">
                  We've received your appeal and will review it within 24-48 hours.
                  You'll receive an email when we have an update.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    required
                    className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-border bg-background resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Please explain your business and why you believe the restriction should be lifted..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Appeal
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
