'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface AgencyInfo {
  name: string;
  logo: string | null;
  primaryColor: string | null;
  hoverColor: string | null;
}

interface MpaData {
  status: string;
  mpaLink?: string;
  message?: string;
  organizationName?: string;
  organizationLogo?: string;
  agency?: AgencyInfo | null;
}

function AgencyButton({ agency, children, onClick, href, className = '' }: {
  agency?: AgencyInfo | null;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const bgColor = agency?.primaryColor || '#000000';
  const hoverBg = agency?.hoverColor || '#1f2937';
  const style = { backgroundColor: hovered ? hoverBg : bgColor };
  const cls = `inline-block px-6 py-3 text-white rounded-lg font-medium transition-colors ${className}`;

  if (href) {
    return (
      <a href={href} className={cls} style={style}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls} style={style}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {children}
    </button>
  );
}

export default function OnboardingMpaPage() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<MpaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (token) fetchMpaData();
  }, [token]);

  const fetchMpaData = async () => {
    try {
      const response = await fetch(`/api/onboarding/mpa-embed?token=${encodeURIComponent(token)}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to load onboarding');
        return;
      }

      setData(result);
    } catch (err) {
      setError('Failed to load onboarding data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (data?.status === 'active') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Account Active</h2>
            <p className="text-gray-500 mb-6">
              {data.organizationName ? `${data.organizationName}'s` : 'Your'} merchant account is approved and ready to accept payments.
            </p>
            <AgencyButton agency={data?.agency} href="/settings/payment-setup">
              Go to Dashboard
            </AgencyButton>
          </div>
        </div>
        <Footer agencyName={data?.agency?.name} />
      </div>
    );
  }

  if (!data?.mpaLink) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold mb-2">Application Not Ready</h2>
            <p className="text-gray-500 mb-6">
              {data?.message || 'Please complete the earlier onboarding steps in your dashboard first.'}
            </p>
            <AgencyButton agency={data?.agency} href="/settings/payment-setup">
              Go to Payment Setup
            </AgencyButton>
          </div>
        </div>
        <Footer agencyName={data?.agency?.name} />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
            <p className="text-gray-500 mb-2">
              We'll email you as soon as your application is approved. You may receive communication from Fortis (our banking partner) with additional questions.
            </p>
            <p className="text-sm text-gray-400 mb-6">This typically takes 24–48 hours.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setCompleted(false)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Need to make changes? View application again
              </button>
              <AgencyButton agency={data?.agency} href="/settings/payment-setup">
                Go to Dashboard
              </AgencyButton>
            </div>
          </div>
        </div>
        <Footer agencyName={data?.agency?.name} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.agency?.logo ? (
              <img src={data.agency.logo} alt={data.agency.name} className="h-10 object-contain" />
            ) : (
              <Image src="/logo.png" alt="LunarPay" width={120} height={45} />
            )}
            {data.organizationName && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-600">{data.organizationName}</span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-400 hidden sm:block">Merchant Processing Agreement</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold mb-2">Complete Your Merchant Application</h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Review and fill in any missing information below to finalize your merchant account with Fortis.{' '}
            <strong>A verification code will be sent to your email.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* MPA Iframe */}
          <div className="lg:col-span-3">
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <iframe
                src={data.mpaLink}
                className="w-full"
                style={{ height: '700px', border: 'none' }}
                title="Fortis MPA Form"
                allow="payment"
              />
            </div>
          </div>

          {/* Tips Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">Who is Fortis?</h3>
              <p className="text-sm text-blue-800">
                They're our banking partner that completes all underwriting.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
              <h3 className="font-semibold text-amber-900 mb-2 text-sm">Volume Fields</h3>
              <p className="text-sm text-amber-800">
                Your high transaction amount cannot exceed the amount you enter in monthly volume or echeck fields.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-900 mb-2 text-sm">Approval Process</h3>
              <p className="text-sm text-green-800">
                This application approval will only take 24–48 hours, but once approved, you're ready to process payments!
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h3 className="font-semibold text-purple-900 mb-2 text-sm">Why So Thorough?</h3>
              <p className="text-sm text-purple-800">
                Most processors let you process immediately, then hold your funds during underwriting. We prefer to be upfront and transparent!
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6">
          <button
            onClick={() => window.open(data.mpaLink!, '_blank')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </button>
          <AgencyButton agency={data.agency} onClick={() => setCompleted(true)} className="text-sm py-2.5">
            I've Completed the Application →
          </AgencyButton>
        </div>
      </div>

      <Footer agencyName={data.agency?.name} />
    </div>
  );
}

function Footer({ agencyName }: { agencyName?: string }) {
  return (
    <footer className="py-6 text-center">
      <a
        href="https://lunarpay.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span className="text-xs">{agencyName ? `${agencyName} is powered by` : 'Powered by'}</span>
        <Image src="/logo.png" alt="LunarPay" width={60} height={22} className="opacity-60 hover:opacity-100 transition-opacity" />
      </a>
    </footer>
  );
}
