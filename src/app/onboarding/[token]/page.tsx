'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';

/**
 * Public merchant onboarding page: app.lunarpay.com/onboarding/<org token>
 *
 * The Fortis MPA (ClearApp) is a cookie-session app and Safari blocks
 * third-party cookies inside cross-site iframes, so the application is never
 * embedded here. It is always opened top-level in a new tab; this page only
 * explains the steps, records that the merchant signed it, and shows status.
 */

interface AgencyInfo {
  name: string;
  logo: string | null;
  primaryColor: string | null;
  hoverColor: string | null;
  /** Agency support address for merchant-facing contact links. */
  email?: string | null;
}

interface MpaData {
  status: string;
  appStatus?: string | null;
  mpaLink?: string | null;
  message?: string;
  organizationName?: string;
  organizationLogo?: string;
  agency?: AgencyInfo | null;
}

interface StatusActionResponse {
  status: boolean;
  appStatus: string | null;
  previousStatus: string | null;
  changed: boolean;
  message: string;
  mpaLink: string | null;
  /** 'fortis_error' means Fortis could not be reached — not "no update yet". */
  source?: string;
  error?: string;
}

function AgencyButton({ agency, children, onClick, href, target, rel, disabled, className = '' }: {
  agency?: AgencyInfo | null;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const bgColor = agency?.primaryColor || '#000000';
  const hoverBg = agency?.hoverColor || '#1f2937';
  const style = { backgroundColor: hovered && !disabled ? hoverBg : bgColor };
  const cls = `inline-flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-colors ${
    disabled ? 'opacity-60 cursor-not-allowed' : ''
  } ${className}`;

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={cls} style={style}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls} style={style}
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

  // "I've signed and submitted it"
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // "Check status"
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [checkNote, setCheckNote] = useState('');

  useEffect(() => {
    if (token) fetchMpaData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch {
      setError('Failed to load onboarding data');
    } finally {
      setLoading(false);
    }
  };

  /** Merge a mark-submitted / sync-status response into the page state. */
  const applyStatusResponse = useCallback((result: StatusActionResponse) => {
    setData((prev) => ({
      ...(prev || { status: result.appStatus || 'pending' }),
      status: result.appStatus === 'ACTIVE' ? 'active' : (result.appStatus || prev?.status || 'pending'),
      appStatus: result.appStatus,
      mpaLink: result.mpaLink ?? prev?.mpaLink ?? null,
    }));
  }, []);

  const postStatusAction = async (path: string): Promise<StatusActionResponse> => {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result?.status === false) {
      throw new Error(result?.error || result?.message || 'Request failed');
    }
    return result as StatusActionResponse;
  };

  const handleMarkSubmitted = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await postStatusAction('/api/onboarding/mark-submitted');
      applyStatusResponse(result);
    } catch (err) {
      setSubmitError((err as Error).message || 'We could not record your submission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setCheckError('');
    setCheckNote('');
    try {
      const result = await postStatusAction('/api/onboarding/sync-status');
      applyStatusResponse(result);
      if (result.source === 'fortis_error') {
        setCheckError('We could not reach Fortis to check your status. Please try again in a few minutes.');
      } else if (!result.changed) {
        setCheckNote(
          result.appStatus === 'APPROVED'
            ? 'Still finalizing — Fortis has approved the account and is finishing setup.'
            : 'No update yet — Fortis is still reviewing your application.'
        );
      }
    } catch (err) {
      setCheckError((err as Error).message || 'We could not check the status right now. Please try again.');
    } finally {
      setChecking(false);
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

  // Raw Fortis application status. `appStatus` is the contract field; the
  // `status` fallback covers the older response shape ('active' | raw status).
  const appStatus = data?.appStatus ?? (data?.status === 'active' ? 'ACTIVE' : data?.status ?? null);
  const mpaLink = data?.mpaLink || null;
  const agency = data?.agency;

  if (appStatus === 'ACTIVE' || data?.status === 'active') {
    return (
      <Shell data={data}>
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Account Active</h2>
            <p className="text-gray-500 mb-6">
              {data?.organizationName ? `${data.organizationName}'s` : 'Your'} merchant account is approved and ready to accept payments.
            </p>
            <AgencyButton agency={agency} href="/settings/payment-setup">
              Go to Dashboard
            </AgencyButton>
          </div>
        </div>
      </Shell>
    );
  }

  if (!mpaLink) {
    return (
      <Shell data={data}>
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold mb-2">Application Not Ready</h2>
            <p className="text-gray-500 mb-6">
              {data?.message || 'Please complete the earlier onboarding steps in your dashboard first.'}
            </p>
            <AgencyButton agency={agency} href="/settings/payment-setup">
              Go to Payment Setup
            </AgencyButton>
          </div>
        </div>
      </Shell>
    );
  }

  if (appStatus === 'DENIED') {
    return (
      <Shell data={data}>
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Application not approved</h2>
            <p className="text-gray-500 mb-2">
              Fortis was unable to approve this merchant application.
            </p>
            <p className="text-gray-500 mb-6">
              Please contact {agency?.name && agency.email ? `${agency.name} support` : 'support'} and we will help you with next steps.
            </p>
            <AgencyButton agency={agency} href={`mailto:${agency?.email || 'support@lunarpay.com'}`}>
              Contact support
            </AgencyButton>
          </div>
        </div>
      </Shell>
    );
  }

  if (appStatus === 'PENDING_REVIEW' || appStatus === 'APPROVED') {
    const approved = appStatus === 'APPROVED';
    return (
      <Shell data={data}>
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
                approved ? 'bg-green-100' : 'bg-amber-100'
              }`}
            >
              {approved ? (
                <ShieldCheck className="w-8 h-8 text-green-600" />
              ) : (
                <Clock className="w-8 h-8 text-amber-600" />
              )}
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              {approved ? 'Approved by Fortis — finalizing your account' : 'Application received — under review by Fortis'}
            </h2>
            <p className="text-gray-500 mb-2">
              {approved
                ? 'Fortis has approved your application and is provisioning your merchant account. This final step usually completes within 24–48 hours.'
                : 'Thank you! Fortis, our banking partner, is now underwriting your application. This typically takes 24–48 hours.'}
            </p>
            <p className="text-gray-500 mb-6">
              We will email you as soon as your account is ready to accept payments. You may also hear from Fortis directly if they have any questions.
            </p>

            <div className="flex flex-col items-center gap-3">
              <AgencyButton agency={agency} onClick={handleCheckStatus} disabled={checking} className="text-sm py-2.5">
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {checking ? 'Checking…' : 'Check status'}
              </AgencyButton>
              {checkNote && <p className="text-sm text-gray-500">{checkNote}</p>}
              {checkError && <p className="text-sm text-red-600">{checkError}</p>}
              {mpaLink && (
                <a
                  href={mpaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Need to reopen the application?
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // BANK_INFORMATION_SENT (or any other non-terminal status with an MPA link):
  // the merchant still needs to open, verify and sign the application.
  const stepBadgeStyle = { backgroundColor: agency?.primaryColor || '#000000' };

  return (
    <Shell data={data}>
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold mb-2">Complete Your Merchant Application</h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Your merchant application with Fortis is ready to review and sign. It only takes a few minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main card */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
              <ol className="space-y-5 mb-8">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full text-white text-sm font-semibold flex items-center justify-center" style={stepBadgeStyle}>1</span>
                  <div>
                    <p className="font-medium text-gray-900">Open the application</p>
                    <p className="text-sm text-gray-500">It opens in a new tab on Fortis&apos;s secure site.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full text-white text-sm font-semibold flex items-center justify-center" style={stepBadgeStyle}>2</span>
                  <div>
                    <p className="font-medium text-gray-900">Verify, review and sign</p>
                    <p className="text-sm text-gray-500">
                      Enter the verification code Fortis emails you, review the pre-filled application and sign it.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full text-white text-sm font-semibold flex items-center justify-center" style={stepBadgeStyle}>3</span>
                  <div>
                    <p className="font-medium text-gray-900">Come back here and confirm</p>
                    <p className="text-sm text-gray-500">
                      Let us know you&apos;ve signed it so we can track your approval with Fortis.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <AgencyButton agency={agency} href={mpaLink} target="_blank" rel="noopener noreferrer" className="text-sm py-2.5">
                  <ExternalLink className="h-4 w-4" />
                  Open the merchant application
                </AgencyButton>
                <button
                  type="button"
                  onClick={handleMarkSubmitted}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {submitting ? 'Saving…' : "I've signed and submitted it"}
                </button>
              </div>
              {submitError && <p className="text-sm text-red-600 mt-3">{submitError}</p>}

              <p className="text-xs text-gray-400 mt-6">
                Please don&apos;t embed or frame the application — open it directly. Safari and some other browsers will not load it inside another page.
              </p>
            </div>
          </div>

          {/* Tips Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">Who is Fortis?</h3>
              <p className="text-sm text-blue-800">
                They&apos;re our banking partner that completes all underwriting.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-900 mb-2 text-sm">Approval Process</h3>
              <p className="text-sm text-green-800">
                This application approval will only take 24–48 hours, but once approved, you&apos;re ready to process payments!
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
      </div>
    </Shell>
  );
}

/** Branded header + footer around every post-load state. */
function Shell({ data, children }: { data: MpaData | null; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {data?.agency?.logo ? (
              <img src={data.agency.logo} alt={data.agency.name} className="h-10 object-contain" />
            ) : (
              <Image src="/logo.png" alt="LunarPay" width={120} height={45} />
            )}
            {data?.organizationName && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-600 truncate">{data.organizationName}</span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-400 hidden sm:block">Merchant Processing Agreement</span>
        </div>
      </header>

      {children}

      <Footer agencyName={data?.agency?.name} />
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
