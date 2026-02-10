'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trackLead } from '@/lib/fbpixel';

function RegisterForm() {
  // URL format: /register?email=user@example.com&firstName=John&lastName=Doe&phone=+15551234567
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get pre-filled values from URL params
  const emailParam = searchParams.get('email') || '';
  const firstNameParam = searchParams.get('firstName') || searchParams.get('first_name') || '';
  const lastNameParam = searchParams.get('lastName') || searchParams.get('last_name') || '';
  const phoneParam = searchParams.get('phone') || '';
  const businessNameParam = searchParams.get('businessName') || searchParams.get('business_name') || '';
  
  const [formData, setFormData] = useState({
    email: emailParam,
    password: '',
    firstName: firstNameParam,
    lastName: lastNameParam,
    phone: phoneParam,
    businessName: businessNameParam,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Update form if URL params change
  useEffect(() => {
    if (emailParam || firstNameParam || lastNameParam || phoneParam || businessNameParam) {
      setFormData(prev => ({
        ...prev,
        email: emailParam || prev.email,
        firstName: firstNameParam || prev.firstName,
        lastName: lastNameParam || prev.lastName,
        phone: phoneParam || prev.phone,
        businessName: businessNameParam || prev.businessName,
      }));
    }
  }, [emailParam, firstNameParam, lastNameParam, phoneParam, businessNameParam]);

  // Auto-save email as a lead when arriving with an email param
  useEffect(() => {
    if (emailParam) {
      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam, source: 'website' }),
      }).catch(() => {}); // fire and forget
    }
  }, [emailParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          businessName: formData.businessName,
          paymentProcessor: 'FTS', // Default to Fortis
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Registration failed:', data);
        const errorMsg = data.message || data.error || 'Registration failed';
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Store token
      if (data.token) {
        localStorage.setItem('lunarpay_token', data.token);
      }

      // Track Lead conversion event
      trackLead({ 
        email: formData.email, 
        businessName: formData.businessName 
      });

      // Redirect to getting started
      router.push('/getting-started');
    } catch (err) {
      console.error('Registration error:', err);
      setError(`An error occurred: ${(err as Error).message || 'Please try again.'}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8">
      {/* Logo */}
      <div className="mb-8">
        <img 
          src="/logo.png" 
          alt="LunarPay" 
          className="h-12 w-auto"
        />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create your account
          </CardTitle>
          <CardDescription className="text-center">
            Get started with LunarPay in minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="businessName" className="text-sm font-medium">
                Business Name
              </label>
              <Input
                id="businessName"
                name="businessName"
                placeholder="Your Company Inc"
                value={formData.businessName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
          <p className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Use
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}

