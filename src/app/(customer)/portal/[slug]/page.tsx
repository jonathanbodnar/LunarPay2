'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  logo: string | null;
  primaryColor: string | null;
  backgroundColor: string | null;
  buttonTextColor: string | null;
  portalTitle: string | null;
  portalDescription: string | null;
  portalSlug: string | null;
}

export default function PortalLoginPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Branding
  const primaryColor = organization?.primaryColor || '#000000';
  const backgroundColor = organization?.backgroundColor || '#ffffff';
  const buttonTextColor = organization?.buttonTextColor || '#ffffff';

  useEffect(() => {
    fetchPortal();
    checkSession();
  }, [slug]);

  const fetchPortal = async () => {
    try {
      const response = await fetch(`/api/portal/${slug}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Portal not found');
      }

      setOrganization(data.organization);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    try {
      const response = await fetch('/api/portal/me');
      if (response.ok) {
        // Already logged in, redirect to dashboard
        router.push(`/portal/${slug}/dashboard`);
      }
    } catch {
      // Not logged in, stay on login page
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/portal/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, portalSlug: slug }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send code');
      }

      setStep('code');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/portal/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, portalSlug: slug }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      router.push(`/portal/${slug}/dashboard`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4" style={{ backgroundColor }}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Portal Not Found</h2>
            <p className="text-muted-foreground">{error || 'This customer portal does not exist or is not enabled.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor }}>
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Name */}
        <div className="text-center">
          {organization.logo ? (
            <img 
              src={organization.logo} 
              alt={organization.name} 
              className="h-12 mx-auto mb-4 object-contain" 
            />
          ) : (
            <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
              {organization.name}
            </h1>
          )}
          <h2 className="text-xl font-semibold" style={{ color: primaryColor }}>
            {organization.portalTitle || 'Customer Portal'}
          </h2>
          {organization.portalDescription && (
            <p className="mt-2 text-muted-foreground">{organization.portalDescription}</p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {step === 'email' ? 'Sign In' : 'Enter Verification Code'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {step === 'email' ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send you a verification code to sign in.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {submitting ? 'Sending...' : 'Continue'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification Code</label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    We sent a code to <strong>{email}</strong>
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                  disabled={submitting || code.length !== 6}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {submitting ? 'Verifying...' : 'Verify & Sign In'}
                </Button>

                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:underline"
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setError('');
                  }}
                >
                  Use a different email
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Powered by LunarPay
        </p>
      </div>
    </div>
  );
}

