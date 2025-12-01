'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Circle } from 'lucide-react';

export default function GettingStartedPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState<any>(null);

  const [step1Data, setStep1Data] = useState({
    organizationName: '',
    legalName: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  const [step2Data, setStep2Data] = useState({
    signFirstName: '',
    signLastName: '',
    signPhone: '',
    signEmail: '',
    routingNumber: '',
    accountNumber: '',
    accountHolderName: '',
    altRoutingNumber: '',
    altAccountNumber: '',
    altAccountHolderName: '',
  });

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/organizations');
      if (response.ok) {
        const data = await response.json();
        if (data.organizations?.length > 0) {
          setOrganization(data.organizations[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (organization) {
        const response = await fetch(`/api/organizations/${organization.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: step1Data.organizationName,
            legalName: step1Data.legalName,
            website: step1Data.website,
            phoneNumber: step1Data.phone,
            email: step1Data.email,
            streetAddress: step1Data.address,
            city: step1Data.city,
            state: step1Data.state,
            postal: step1Data.zip,
          }),
          credentials: 'include',
        });

        if (response.ok) {
          setCurrentStep(2);
        } else {
          alert('Failed to update organization');
        }
      }
    } catch (error) {
      alert('Error updating organization');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/fortis/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          ...step2Data,
          dbaName: step1Data.organizationName,
          legalName: step1Data.legalName,
          website: step1Data.website,
          addressLine1: step1Data.address,
          city: step1Data.city,
          state: step1Data.state,
          postalCode: step1Data.zip,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.appLink) {
          window.open(data.appLink, '_blank');
        }
        setCurrentStep(3);
      } else {
        alert('Failed to submit onboarding');
      }
    } catch (error) {
      alert('Error submitting onboarding');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Organization Details', description: 'Basic information about your organization' },
    { number: 2, title: 'Fortis Onboarding', description: 'Set up payment processing' },
    { number: 3, title: 'Complete!', description: 'You\'re ready to start accepting payments' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Getting Started</h1>
        <p className="mt-2 text-gray-600">
          Let's set up your account in a few simple steps
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center gap-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-gray-500 max-w-[150px]">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 w-24 mx-4 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Organization Details */}
      {currentStep === 1 && (
        <form onSubmit={handleStep1Submit}>
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization Name *</label>
                  <Input
                    value={step1Data.organizationName}
                    onChange={(e) => setStep1Data({ ...step1Data, organizationName: e.target.value })}
                    placeholder="First Community Church"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Legal Name</label>
                  <Input
                    value={step1Data.legalName}
                    onChange={(e) => setStep1Data({ ...step1Data, legalName: e.target.value })}
                    placeholder="First Community Church Inc"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website *</label>
                  <Input
                    type="url"
                    value={step1Data.website}
                    onChange={(e) => setStep1Data({ ...step1Data, website: e.target.value })}
                    placeholder="https://yourchurch.org"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone *</label>
                  <Input
                    type="tel"
                    value={step1Data.phone}
                    onChange={(e) => setStep1Data({ ...step1Data, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={step1Data.email}
                  onChange={(e) => setStep1Data({ ...step1Data, email: e.target.value })}
                  placeholder="contact@yourchurch.org"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Street Address *</label>
                <Input
                  value={step1Data.address}
                  onChange={(e) => setStep1Data({ ...step1Data, address: e.target.value })}
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City *</label>
                  <Input
                    value={step1Data.city}
                    onChange={(e) => setStep1Data({ ...step1Data, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">State *</label>
                  <Input
                    value={step1Data.state}
                    onChange={(e) => setStep1Data({ ...step1Data, state: e.target.value })}
                    placeholder="TX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ZIP *</label>
                  <Input
                    value={step1Data.zip}
                    onChange={(e) => setStep1Data({ ...step1Data, zip: e.target.value })}
                    placeholder="75001"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Next Step'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Step 2: Fortis Onboarding */}
      {currentStep === 2 && (
        <form onSubmit={handleStep2Submit}>
          <Card>
            <CardHeader>
              <CardTitle>Payment Processor Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  Complete your merchant application with Fortis to start accepting payments
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Signer First Name *</label>
                  <Input
                    value={step2Data.signFirstName}
                    onChange={(e) => setStep2Data({ ...step2Data, signFirstName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Signer Last Name *</label>
                  <Input
                    value={step2Data.signLastName}
                    onChange={(e) => setStep2Data({ ...step2Data, signLastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Signer Email *</label>
                <Input
                  type="email"
                  value={step2Data.signEmail}
                  onChange={(e) => setStep2Data({ ...step2Data, signEmail: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Signer Phone *</label>
                <Input
                  type="tel"
                  value={step2Data.signPhone}
                  onChange={(e) => setStep2Data({ ...step2Data, signPhone: e.target.value })}
                  required
                />
              </div>

              <div className="border-t pt-4 mt-6">
                <h3 className="text-lg font-semibold mb-4">Primary Bank Account</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Routing Number *</label>
                    <Input
                      value={step2Data.routingNumber}
                      onChange={(e) => setStep2Data({ ...step2Data, routingNumber: e.target.value })}
                      placeholder="000000000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Number *</label>
                    <Input
                      value={step2Data.accountNumber}
                      onChange={(e) => setStep2Data({ ...step2Data, accountNumber: e.target.value })}
                      placeholder="000000000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <label className="text-sm font-medium">Account Holder Name *</label>
                  <Input
                    value={step2Data.accountHolderName}
                    onChange={(e) => setStep2Data({ ...step2Data, accountHolderName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <h3 className="text-lg font-semibold mb-4">Alternative Bank Account (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Alt Routing Number</label>
                    <Input
                      value={step2Data.altRoutingNumber}
                      onChange={(e) => setStep2Data({ ...step2Data, altRoutingNumber: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Alt Account Number</label>
                    <Input
                      value={step2Data.altAccountNumber}
                      onChange={(e) => setStep2Data({ ...step2Data, altAccountNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <label className="text-sm font-medium">Alt Account Holder Name</label>
                  <Input
                    value={step2Data.altAccountHolderName}
                    onChange={(e) => setStep2Data({ ...step2Data, altAccountHolderName: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Step 3: Complete */}
      {currentStep === 3 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
            <p className="text-gray-600 text-center mb-6">
              Your merchant application has been submitted to Fortis.<br />
              You'll receive an email when it's approved.
            </p>
            <Button onClick={() => router.push('/organizations')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

