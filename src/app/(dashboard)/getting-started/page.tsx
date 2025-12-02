'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  path?: string;
  action?: () => void;
}

export default function GettingStartedPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProgress();
  }, []);

  const checkProgress = async () => {
    try {
      const [orgsRes, customersRes, productsRes, invoicesRes] = await Promise.all([
        fetch('/api/organizations', { credentials: 'include' }),
        fetch('/api/customers', { credentials: 'include' }),
        fetch('/api/products', { credentials: 'include' }),
        fetch('/api/invoices', { credentials: 'include' }),
      ]);

      const [orgs, customers, products, invoices] = await Promise.all([
        orgsRes.ok ? orgsRes.json() : { organizations: [] },
        customersRes.ok ? customersRes.json() : { customers: [] },
        productsRes.ok ? productsRes.json() : { products: [] },
        invoicesRes.ok ? invoicesRes.json() : { invoices: [] },
      ]);

      setSteps([
        {
          id: 'organization',
          title: 'Create Your Organization',
          description: 'Set up your company or organization profile',
          completed: orgs.organizations?.length > 0,
          path: '/organizations',
        },
        {
          id: 'customer',
          title: 'Add Your First Customer',
          description: 'Create a customer to send invoices to',
          completed: customers.customers?.length > 0,
          path: '/customers/new',
        },
        {
          id: 'product',
          title: 'Create a Product or Service',
          description: 'Add items you sell to use in invoices',
          completed: products.products?.length > 0,
          path: '/products/new',
        },
        {
          id: 'invoice',
          title: 'Create Your First Invoice',
          description: 'Send an invoice to a customer',
          completed: invoices.invoices?.length > 0,
          path: '/invoices/new',
        },
        {
          id: 'branding',
          title: 'Customize Your Branding',
          description: 'Add your logo and brand colors',
          completed: false, // TODO: Check if branding is set
          path: '/settings/branding',
        },
        {
          id: 'payment',
          title: 'Configure Payment Processing',
          description: 'Set up Fortis or other payment processor',
          completed: false, // TODO: Check if payment processor is connected
          path: '/settings',
        },
      ]);
    } catch (error) {
      console.error('Failed to check progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Getting Started</h1>
        <p className="mt-2 text-gray-600">
          Complete these steps to set up your account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">
                {completedCount} of {steps.length} completed
              </span>
              <span className="font-semibold text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={step.id} className={step.completed ? 'bg-green-50 border-green-200' : ''}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="mt-1">
                  {step.completed ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-500">
                      Step {index + 1}
                    </span>
                    {step.completed && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Complete
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
              {!step.completed && step.path && (
                <Button onClick={() => router.push(step.path!)}>
                  Start
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {progress === 100 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">🎉 Setup Complete!</h3>
              <p className="text-gray-600">
                You're all set! Start managing your payments and invoices.
              </p>
            </div>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
