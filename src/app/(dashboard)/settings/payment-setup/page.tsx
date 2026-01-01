'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  Circle, 
  Building2, 
  CreditCard, 
  Loader2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Lock
} from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  legalName?: string;
  website?: string;
  fortisOnboarding?: {
    stepCompleted: number;
    appStatus: string | null;
    mpaLink: string | null;
    signFirstName: string | null;
    signLastName: string | null;
    signPhoneNumber: string | null;
    email: string | null;
    merchantAddressLine1: string | null;
    merchantCity: string | null;
    merchantState: string | null;
    merchantPostalCode: string | null;
  };
}

export default function PaymentSetupPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Merchant Info
  const [merchantInfo, setMerchantInfo] = useState({
    signFirstName: '',
    signLastName: '',
    signPhoneNumber: '',
    email: '',
    dbaName: '',
    legalName: '',
    website: '',
    fedTaxId: '', // EIN
    ownershipType: '',
    ownerTitle: '',
    ownershipPercent: '100',
    dateOfBirth: '',
    merchantAddressLine1: '',
    merchantAddressLine2: '',
    merchantCity: '',
    merchantState: '',
    merchantPostalCode: '',
  });

  // Step 2: Bank Account
  const [bankInfo, setBankInfo] = useState({
    achAccountNumber: '',
    achRoutingNumber: '',
    accountHolderName: '',
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/organizations', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
        if (data.organizations?.length > 0) {
          const org = data.organizations[0];
          setSelectedOrg(org);
          loadOrgData(org);
        }
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrgData = (org: Organization) => {
    // Pre-populate all saved data from organization and fortisOnboarding
    setMerchantInfo({
      signFirstName: org.fortisOnboarding?.signFirstName || '',
      signLastName: org.fortisOnboarding?.signLastName || '',
      signPhoneNumber: org.fortisOnboarding?.signPhoneNumber || '',
      email: org.fortisOnboarding?.email || '',
      dbaName: org.name || '',
      legalName: org.legalName || org.name || '',
      website: org.website || '',
      fedTaxId: '',
      ownershipType: '',
      ownerTitle: '',
      ownershipPercent: '100',
      dateOfBirth: '',
      merchantAddressLine1: org.fortisOnboarding?.merchantAddressLine1 || '',
      merchantAddressLine2: '',
      merchantCity: org.fortisOnboarding?.merchantCity || '',
      merchantState: org.fortisOnboarding?.merchantState || '',
      merchantPostalCode: org.fortisOnboarding?.merchantPostalCode || '',
    });

    // Set current step based on progress
    if (org.fortisOnboarding?.appStatus === 'BANK_INFORMATION_SENT' || 
        org.fortisOnboarding?.appStatus === 'ACTIVE') {
      setCurrentStep(3);
    } else if (org.fortisOnboarding?.stepCompleted && org.fortisOnboarding.stepCompleted >= 1) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  };

  const handleMerchantInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Save step 1 data to database so it persists on refresh
      const res = await fetch('/api/onboarding/save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          organizationId: selectedOrg.id,
          step: 1,
          signFirstName: merchantInfo.signFirstName,
          signLastName: merchantInfo.signLastName,
          signPhoneNumber: merchantInfo.signPhoneNumber,
          email: merchantInfo.email,
          dbaName: merchantInfo.dbaName,
          legalName: merchantInfo.legalName,
          website: merchantInfo.website,
          addressLine1: merchantInfo.merchantAddressLine1,
          addressLine2: merchantInfo.merchantAddressLine2,
          state: merchantInfo.merchantState,
          city: merchantInfo.merchantCity,
          postalCode: merchantInfo.merchantPostalCode,
        }),
      });

      if (res.ok) {
        setCurrentStep(2);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save merchant info');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBankInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Submit directly to Fortis with all data
      const fortisRes = await fetch('/api/fortis/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          organizationId: selectedOrg.id,
          // Primary contact
          signFirstName: merchantInfo.signFirstName,
          signLastName: merchantInfo.signLastName,
          signPhoneNumber: merchantInfo.signPhoneNumber,
          email: merchantInfo.email,
          // Business info
          dbaName: merchantInfo.dbaName,
          legalName: merchantInfo.legalName,
          website: merchantInfo.website,
          fedTaxId: merchantInfo.fedTaxId || undefined,
          ownershipType: merchantInfo.ownershipType || undefined,
          // Owner details
          ownerTitle: merchantInfo.ownerTitle || 'Owner',
          ownershipPercent: merchantInfo.ownershipPercent || '100',
          dateOfBirth: merchantInfo.dateOfBirth || undefined,
          // Business address
          addressLine1: merchantInfo.merchantAddressLine1,
          addressLine2: merchantInfo.merchantAddressLine2 || undefined,
          state: merchantInfo.merchantState,
          city: merchantInfo.merchantCity,
          postalCode: merchantInfo.merchantPostalCode,
          // Bank info
          routingNumber: bankInfo.achRoutingNumber,
          accountNumber: bankInfo.achAccountNumber,
          accountHolderName: bankInfo.accountHolderName,
          // Use primary bank account for alternative as well (Fortis requires both)
          altRoutingNumber: bankInfo.achRoutingNumber,
          altAccountNumber: bankInfo.achAccountNumber,
          altAccountHolderName: bankInfo.accountHolderName,
        }),
      });

      const data = await fortisRes.json();

      if (fortisRes.ok && data.status) {
        setSuccess('Application submitted to Fortis successfully!');
        setCurrentStep(3);
        await fetchOrganizations();
      } else {
        setError(data.error || 'Failed to submit to Fortis');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>;
      case 'BANK_INFORMATION_SENT':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending Review</span>;
      case 'FORM_ERROR':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Error</span>;
      case 'PENDING':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">In Progress</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Not Started</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Payment Processing Setup</h1>
        <p className="mt-1 text-muted-foreground">
          Configure Fortis payment processing to accept credit cards and ACH payments.
        </p>
      </div>

      {organizations.length > 1 && (
        <div className="space-y-2">
          <Label>Organization</Label>
          <select
            className="w-full h-10 px-3 rounded-lg border border-border bg-background"
            value={selectedOrg?.id || ''}
            onChange={(e) => {
              const org = organizations.find(o => o.id === parseInt(e.target.value));
              if (org) {
                setSelectedOrg(org);
                loadOrgData(org);
              }
            }}
          >
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, title: 'Merchant Info', icon: Building2 },
          { num: 2, title: 'Bank Account', icon: CreditCard },
          { num: 3, title: 'Complete', icon: CheckCircle },
        ].map((step, idx) => (
          <div key={step.num} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.num 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-300 text-gray-400'
            }`}>
              {currentStep > step.num ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= step.num ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {step.title}
            </span>
            {idx < 2 && (
              <div className={`w-16 h-0.5 mx-4 ${
                currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Step 1: Merchant Info */}
      {currentStep === 1 && (
        <form onSubmit={handleMerchantInfoSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Merchant Information
              </CardTitle>
              <CardDescription>
                Enter the primary contact and business address information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    required
                    value={merchantInfo.signFirstName}
                    onChange={(e) => setMerchantInfo({ ...merchantInfo, signFirstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    required
                    value={merchantInfo.signLastName}
                    onChange={(e) => setMerchantInfo({ ...merchantInfo, signLastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    required
                    type="tel"
                    value={merchantInfo.signPhoneNumber}
                    onChange={(e) => setMerchantInfo({ ...merchantInfo, signPhoneNumber: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    required
                    type="email"
                    value={merchantInfo.email}
                    onChange={(e) => setMerchantInfo({ ...merchantInfo, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-4">Business Information</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>DBA Name (Doing Business As) *</Label>
                      <Input
                        required
                        value={merchantInfo.dbaName}
                        onChange={(e) => setMerchantInfo({ ...merchantInfo, dbaName: e.target.value })}
                        placeholder="My Company Inc"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Legal Name *</Label>
                      <Input
                        required
                        value={merchantInfo.legalName}
                        onChange={(e) => setMerchantInfo({ ...merchantInfo, legalName: e.target.value })}
                        placeholder="My Company Inc, LLC"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Website *</Label>
                      <Input
                        required
                        type="url"
                        value={merchantInfo.website}
                        onChange={(e) => setMerchantInfo({ ...merchantInfo, website: e.target.value })}
                        placeholder="https://www.mycompany.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Federal Tax ID (EIN)</Label>
                      <Input
                        value={merchantInfo.fedTaxId}
                        onChange={(e) => setMerchantInfo({ ...merchantInfo, fedTaxId: e.target.value })}
                        placeholder="XX-XXXXXXX"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Business Type</Label>
                      <select
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                        value={merchantInfo.ownershipType}
                        onChange={(e) => setMerchantInfo({ ...merchantInfo, ownershipType: e.target.value })}
                      >
                        <option value="">Select type...</option>
                        <option value="sole_proprietorship">Sole Proprietorship</option>
                        <option value="llc">LLC</option>
                        <option value="corporation">Corporation</option>
                        <option value="partnership">Partnership</option>
                        <option value="non_profit">Non-Profit</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Owner Title</Label>
                      <Input
                        value={merchantInfo.ownerTitle}
                        onChange={(e) => setMerchantInfo({ ...merchantInfo, ownerTitle: e.target.value })}
                        placeholder="Owner, CEO, President"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ownership Percentage</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={merchantInfo.ownershipPercent}
                        onChange={(e) => setMerchantInfo({ ...merchantInfo, ownershipPercent: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={merchantInfo.dateOfBirth}
                        onChange={(e) => setMerchantInfo({ ...merchantInfo, dateOfBirth: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-4">Business Address</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Street Address *</Label>
                    <Input
                      required
                      value={merchantInfo.merchantAddressLine1}
                      onChange={(e) => setMerchantInfo({ ...merchantInfo, merchantAddressLine1: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Suite / Unit</Label>
                    <Input
                      value={merchantInfo.merchantAddressLine2}
                      onChange={(e) => setMerchantInfo({ ...merchantInfo, merchantAddressLine2: e.target.value })}
                      placeholder="Suite 100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    required
                    value={merchantInfo.merchantCity}
                    onChange={(e) => setMerchantInfo({ ...merchantInfo, merchantCity: e.target.value })}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Input
                    required
                    value={merchantInfo.merchantState}
                    onChange={(e) => setMerchantInfo({ ...merchantInfo, merchantState: e.target.value })}
                    placeholder="NY"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code *</Label>
                  <Input
                    required
                    value={merchantInfo.merchantPostalCode}
                    onChange={(e) => setMerchantInfo({ ...merchantInfo, merchantPostalCode: e.target.value })}
                    placeholder="10001"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Step 2: Bank Account */}
      {currentStep === 2 && (
        <form onSubmit={handleBankInfoSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Account Information
              </CardTitle>
              <CardDescription>
                Enter your bank account details for receiving payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <Lock className="h-4 w-4" />
                Your bank information is encrypted and stored securely.
              </div>

              <div className="space-y-2">
                <Label>Account Holder Name *</Label>
                <Input
                  required
                  value={bankInfo.accountHolderName}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountHolderName: e.target.value })}
                  placeholder="John Doe or Company Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Number *</Label>
                  <Input
                    required
                    type="password"
                    value={bankInfo.achAccountNumber}
                    onChange={(e) => setBankInfo({ ...bankInfo, achAccountNumber: e.target.value })}
                    placeholder="••••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Routing Number *</Label>
                  <Input
                    required
                    value={bankInfo.achRoutingNumber}
                    onChange={(e) => setBankInfo({ ...bankInfo, achRoutingNumber: e.target.value })}
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Step 3: Complete MPA / Active */}
      {currentStep === 3 && (
        <Card>
          <CardContent className="py-6">
            {selectedOrg?.fortisOnboarding?.appStatus === 'ACTIVE' ? (
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Payment Processing Active!</h2>
                <p className="text-muted-foreground mb-6">
                  Your Fortis merchant account is active and ready to accept payments.
                </p>
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            ) : selectedOrg?.fortisOnboarding?.appStatus === 'BANK_INFORMATION_SENT' && selectedOrg?.fortisOnboarding?.mpaLink ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-semibold mb-2">Complete Merchant Processing Agreement</h2>
                  <p className="text-muted-foreground text-sm">
                    Please complete the form below to finalize your merchant account setup.
                    A verification code will be sent to your email.
                  </p>
                </div>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <iframe
                    src={selectedOrg.fortisOnboarding.mpaLink}
                    className="w-full"
                    style={{ height: '700px', border: 'none' }}
                    title="Fortis MPA Form"
                    allow="payment"
                  />
                </div>
                <div className="flex justify-between items-center pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button variant="ghost" onClick={() => window.open(selectedOrg.fortisOnboarding!.mpaLink!, '_blank')}>
                    Open in New Tab
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : selectedOrg?.fortisOnboarding?.appStatus === 'BANK_INFORMATION_SENT' ? (
              <div className="text-center">
                <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Application Submitted</h2>
                <p className="text-muted-foreground mb-6">
                  Your application is being processed. Please wait...
                </p>
              </div>
            ) : (
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Status: {getStatusBadge(selectedOrg?.fortisOnboarding?.appStatus)}</h2>
                <p className="text-muted-foreground mb-6">
                  Please contact support if you need assistance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

