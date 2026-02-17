'use client';

import { useState, useEffect, useRef } from 'react';
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
  Lock,
  RefreshCw,
  Clock,
  Mail,
  Shield,
  Percent,
  Globe,
  FileText
} from 'lucide-react';
import { trackPurchase } from '@/lib/fbpixel';

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
    processorResponse: string | null; // JSON with additional fields
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
  const [mpaSubmitted, setMpaSubmitted] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

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

  // Track if we've already fired the purchase event
  const purchaseTracked = useRef(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Track Purchase event when onboarding is complete (ACTIVE status)
  useEffect(() => {
    if (
      selectedOrg?.fortisOnboarding?.appStatus === 'ACTIVE' && 
      !purchaseTracked.current
    ) {
      purchaseTracked.current = true;
      trackPurchase({ 
        organizationName: selectedOrg.name,
        value: 0,
        currency: 'USD'
      });
    }
  }, [selectedOrg]);

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

  const refreshApplicationStatus = async () => {
    setRefreshingStatus(true);
    setError('');
    try {
      // First, check status directly from Fortis
      if (selectedOrg?.id) {
        const fortisRes = await fetch(`/api/fortis/check-status?organizationId=${selectedOrg.id}`, { 
          credentials: 'include' 
        });
        if (fortisRes.ok) {
          const fortisData = await fortisRes.json();
          if (fortisData.appStatus === 'ACTIVE') {
            setSuccess('Your application has been approved!');
          } else if (fortisData.fortisStatus) {
            // Show Fortis status if available
            setSuccess(`Status: ${fortisData.fortisStatus}${fortisData.statusMessage ? ` - ${fortisData.statusMessage}` : ''}`);
          }
        }
      }

      // Then refresh organization data
      const res = await fetch('/api/organizations', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.organizations?.length > 0) {
          const org = data.organizations.find((o: Organization) => o.id === selectedOrg?.id) || data.organizations[0];
          setSelectedOrg(org);
          if (org.fortisOnboarding?.appStatus === 'ACTIVE') {
            setSuccess('Your application has been approved!');
          }
        }
      }
    } catch (err) {
      console.error('Failed to refresh status:', err);
      setError('Failed to check status. Please try again.');
    } finally {
      setRefreshingStatus(false);
    }
  };

  const loadOrgData = (org: Organization) => {
    // Parse additional fields from processorResponse JSON
    let additionalFields = {
      fedTaxId: '',
      ownershipType: '',
      ownerTitle: '',
      ownershipPercent: '100',
      dateOfBirth: '',
      addressLine2: '',
    };
    
    if (org.fortisOnboarding?.processorResponse) {
      try {
        const parsed = JSON.parse(org.fortisOnboarding.processorResponse);
        // Only use parsed data if it's not a Fortis API response (which would have different structure)
        if (parsed.ownershipPercent !== undefined || parsed.fedTaxId !== undefined) {
          additionalFields = { ...additionalFields, ...parsed };
        }
      } catch (e) {
        // processorResponse might contain Fortis API response, not our saved data
      }
    }

    // Pre-populate all saved data from organization and fortisOnboarding
    setMerchantInfo({
      signFirstName: org.fortisOnboarding?.signFirstName || '',
      signLastName: org.fortisOnboarding?.signLastName || '',
      signPhoneNumber: org.fortisOnboarding?.signPhoneNumber || '',
      email: org.fortisOnboarding?.email || '',
      dbaName: org.name || '',
      legalName: org.legalName || org.name || '',
      website: org.website || '',
      fedTaxId: additionalFields.fedTaxId || '',
      ownershipType: additionalFields.ownershipType || '',
      ownerTitle: additionalFields.ownerTitle || '',
      ownershipPercent: additionalFields.ownershipPercent || '100',
      dateOfBirth: additionalFields.dateOfBirth || '',
      merchantAddressLine1: org.fortisOnboarding?.merchantAddressLine1 || '',
      merchantAddressLine2: additionalFields.addressLine2 || '',
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
          fedTaxId: merchantInfo.fedTaxId,
          ownershipType: merchantInfo.ownershipType,
          ownerTitle: merchantInfo.ownerTitle,
          ownershipPercent: merchantInfo.ownershipPercent,
          dateOfBirth: merchantInfo.dateOfBirth,
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
        // Safely extract error message (API may return objects instead of strings)
        let errorMsg = 'Failed to submit to Fortis';
        if (typeof data.error === 'string') {
          errorMsg = data.error;
        } else if (data.error?.message && typeof data.error.message === 'string') {
          errorMsg = data.error.message;
        }
        // Append Fortis detail if available
        const detail = data.details?.result?.detail;
        if (detail) {
          if (typeof detail === 'string') {
            errorMsg += `: ${detail}`;
          } else if (typeof detail === 'object') {
            errorMsg += `: ${JSON.stringify(detail)}`;
          }
        }
        console.error('Fortis submission error:', data);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Fortis submission exception:', err);
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

  const FeeStructurePanel = () => (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-gradient-to-b from-blue-50/80 to-white">
        <CardContent className="pt-5 pb-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Percent className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Simple, Flat-Rate Pricing</h3>
              <p className="text-[11px] text-gray-500">No hidden fees. No surprises.</p>
            </div>
          </div>

          {/* Credit / Debit */}
          <div className="bg-white rounded-xl border border-gray-200 p-3.5">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Credit & Debit Cards</span>
            {/* Card brand icons */}
            <div className="flex items-center gap-1 mt-1.5 mb-2.5">
              <svg viewBox="0 0 48 32" className="h-5 w-auto shrink-0" fill="none"><rect width="48" height="32" rx="4" fill="#1A1F71"/><path d="M19.5 21H17L18.9 11H21.4L19.5 21Z" fill="white"/><path d="M28.7 11.2C28.2 11 27.3 10.8 26.2 10.8C23.7 10.8 21.9 12.1 21.9 14C21.9 15.4 23.1 16.2 24.1 16.7C25.1 17.2 25.4 17.5 25.4 17.9C25.4 18.6 24.5 18.9 23.7 18.9C22.6 18.9 22 18.7 21.1 18.3L20.7 18.1L20.3 20.6C21 20.9 22.1 21.2 23.3 21.2C26 21.2 27.7 19.9 27.7 17.9C27.7 16.8 27 15.9 25.5 15.2C24.6 14.7 24 14.4 24 14C24 13.6 24.4 13.2 25.3 13.2C26.1 13.2 26.7 13.4 27.1 13.5L27.4 13.7L28.7 11.2Z" fill="white"/><path d="M32 11H30C29.4 11 29 11.2 28.7 11.8L25 21H27.7L28.2 19.5H31.5L31.8 21H34.2L32 11ZM29 17.5L30.2 13.9L30.9 17.5H29Z" fill="white"/><path d="M16.6 11L14.1 17.9L13.8 16.5C13.3 15 11.9 13.3 10.3 12.5L12.6 21H15.3L19.3 11H16.6Z" fill="white"/><path d="M12.9 11H8.8L8.8 11.2C12 12 14.1 13.9 14.8 16.2L14 11.8C13.9 11.2 13.5 11 12.9 11Z" fill="#F9A533"/></svg>
              <svg viewBox="0 0 48 32" className="h-5 w-auto shrink-0" fill="none"><rect width="48" height="32" rx="4" fill="#252525"/><circle cx="19" cy="16" r="8" fill="#EB001B"/><circle cx="29" cy="16" r="8" fill="#F79E1B"/><path d="M24 9.8C25.8 11.2 27 13.4 27 16C27 18.6 25.8 20.8 24 22.2C22.2 20.8 21 18.6 21 16C21 13.4 22.2 11.2 24 9.8Z" fill="#FF5F00"/></svg>
              <svg viewBox="0 0 48 32" className="h-5 w-auto shrink-0" fill="none"><rect width="48" height="32" rx="4" fill="#fff" stroke="#E5E7EB"/><circle cx="24" cy="16" r="7" fill="#F47216"/></svg>
              <svg viewBox="0 0 48 32" className="h-5 w-auto shrink-0" fill="none"><rect width="48" height="32" rx="4" fill="#006FCF"/><path d="M10 13h5l1.5 3.5L18 13h5v10h-3.5v-6l-2 4h-2l-2-4v6H10V13z" fill="white"/></svg>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">2.75%</span>
              <span className="text-gray-400 font-medium">+</span>
              <span className="text-2xl font-bold text-gray-900">27&cent;</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">per transaction</p>
          </div>

          {/* ACH */}
          <div className="bg-white rounded-xl border border-gray-200 p-3.5">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">ACH / Bank Transfer</span>
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-2xl font-bold text-gray-900">1%</span>
              <span className="text-gray-400 font-medium">+</span>
              <span className="text-2xl font-bold text-gray-900">50&cent;</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">per transaction</p>
          </div>

          {/* Additional fees */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 bg-white rounded-lg border border-gray-200 p-3">
              <Globe className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-900">International Cards</p>
                <p className="text-[11px] text-gray-500">+2% added to credit/debit rate</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 bg-white rounded-lg border border-gray-200 p-3">
              <RefreshCw className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Auto-Update Expired Cards</p>
                <p className="text-[11px] text-gray-500">$10/mo + 30&cent; per update</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 bg-white rounded-lg border border-gray-200 p-3">
              <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Chargeback Fee</p>
                <p className="text-[11px] text-gray-500">$15 per occurrence</p>
              </div>
            </div>
          </div>

          {/* Rate Lock Guarantee */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex items-start gap-2.5">
            <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-green-800">Rate Lock Guarantee</p>
              <p className="text-[11px] text-green-700 leading-relaxed">
                We will never increase your rate or charge additional fees beyond what&apos;s listed here.
              </p>
            </div>
          </div>

          {/* Download PDF */}
          <a
            href="/api/fee-schedule"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Download Fee Schedule (PDF)
          </a>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
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
                          {parseInt(merchantInfo.ownershipPercent) < 100 && (
                            <p className="text-xs text-amber-600">
                              Additional owners will need to be added in the Fortis MPA form.
                            </p>
                          )}
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
          </div>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <FeeStructurePanel />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Bank Account */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
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
                          Processing...
                        </>
                      ) : (
                        <>
                          Review & Sign Application
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <FeeStructurePanel />
            </div>
          </div>
        </div>
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
              mpaSubmitted ? (
                // Thank you message after submitting MPA
                <div className="text-center py-8">
                  <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-4">Thank you!</h2>
                  <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                    We'll email you as soon as your application is approved. You may receive communication from Fortis (our banking partner) with additional questions.
                  </p>
                  <p className="text-sm text-muted-foreground mb-8 flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    This can take 24 to 48 hours.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={refreshApplicationStatus}
                      disabled={refreshingStatus}
                    >
                      {refreshingStatus ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh Status
                    </Button>
                    <Button onClick={() => router.push('/dashboard')}>
                      Go to Dashboard
                    </Button>
                  </div>
                  <button 
                    onClick={() => setMpaSubmitted(false)}
                    className="mt-6 text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Need to make changes? View application again
                  </button>
                </div>
              ) : (
                // Show MPA iframe with tips
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold mb-2">Complete Merchant Processing Agreement</h2>
                    <p className="text-muted-foreground text-sm">
                      Please review your application below and fill in any missing information, to finalize your merchant account setup with our partner, Fortis.{' '}
                      <strong>A verification code will be sent to your email from Fortis to access the form.</strong>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* MPA Iframe - Takes 3 columns */}
                    <div className="lg:col-span-3">
                      <div className="border rounded-lg overflow-hidden bg-white">
                        <iframe
                          src={selectedOrg.fortisOnboarding.mpaLink}
                          className="w-full"
                          style={{ height: '700px', border: 'none' }}
                          title="Fortis MPA Form"
                          allow="payment"
                        />
                      </div>
                    </div>
                    
                    {/* Tips Panel - Takes 1 column */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Who is Fortis?
                        </h3>
                        <p className="text-sm text-blue-800">
                          They're our banking partner that completes all underwriting.
                        </p>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                        <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Volume Fields
                        </h3>
                        <p className="text-sm text-amber-800">
                          Your high transaction amount cannot exceed the amount you enter in monthly volume or echeck fields.
                        </p>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Approval Process
                        </h3>
                        <p className="text-sm text-green-800">
                          This application approval will only take 24-48 hours, but once approved, you're in and can process without fear of political persecution!
                        </p>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Why So Thorough?
                        </h3>
                        <p className="text-sm text-purple-800">
                          Most processors let you process immediately, then when they get around to underwriting you will hold your funds until you complete the exact same process. We like to be upfront and transparent!
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <Button variant="outline" onClick={() => window.open(selectedOrg.fortisOnboarding!.mpaLink!, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                    <Button onClick={() => setMpaSubmitted(true)}>
                      I've Completed the Application
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )
            ) : selectedOrg?.fortisOnboarding?.appStatus === 'BANK_INFORMATION_SENT' ? (
              // Fallback for BANK_INFORMATION_SENT without mpaLink
              <div className="text-center py-8">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Thank you!</h2>
                <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                  We'll email you as soon as your application is approved. You may receive communication from Fortis (our banking partner) with additional questions.
                </p>
                <p className="text-sm text-muted-foreground mb-8 flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  This can take 24 to 48 hours.
                </p>
                <Button 
                  variant="outline" 
                  onClick={refreshApplicationStatus}
                  disabled={refreshingStatus}
                >
                  {refreshingStatus ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Application Status
                </Button>
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

