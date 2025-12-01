'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token in localStorage for client-side access
      if (data.token) {
        localStorage.setItem('lunarpay_token', data.token);
      }

      // Redirect to dashboard
      router.push('/organizations');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            Welcome to LunarPay
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={loading}
                />
                <label htmlFor="remember" className="text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>

      {/* Test Credentials - Always show for now */}
      <Card className="w-full max-w-md mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">🧪 Test Credentials</CardTitle>
            <CardDescription>
              Use these accounts for testing (development only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100 hover:border-blue-300 cursor-pointer"
                   onClick={() => {
                     setEmail('admin@lunarpay.io');
                     setPassword('Admin123456!');
                   }}>
                <div>
                  <p className="text-sm font-medium">Admin Account</p>
                  <p className="text-xs text-gray-500">admin@lunarpay.io</p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-800">
                  Use →
                </button>
              </div>

              <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100 hover:border-blue-300 cursor-pointer"
                   onClick={() => {
                     setEmail('merchant@test.com');
                     setPassword('Merchant123!');
                   }}>
                <div>
                  <p className="text-sm font-medium">Merchant Account</p>
                  <p className="text-xs text-gray-500">merchant@test.com</p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-800">
                  Use →
                </button>
              </div>

              <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100 hover:border-blue-300 cursor-pointer"
                   onClick={() => {
                     setEmail('demo@lunarpay.io');
                     setPassword('Demo123456!');
                   }}>
                <div>
                  <p className="text-sm font-medium">Demo Account</p>
                  <p className="text-xs text-gray-500">demo@lunarpay.io</p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-800">
                  Use →
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 italic text-center mt-2">
              Click any account to auto-fill credentials
            </p>
          </CardContent>
        </Card>
    </div>
  );
}

