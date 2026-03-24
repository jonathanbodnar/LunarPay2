'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Key, Copy, RefreshCw, Eye, EyeOff, CheckCircle, AlertTriangle, Code, Loader2,
} from 'lucide-react';

export default function DeveloperSettingsPage() {
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [hasKeys, setHasKeys] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState<'publishable' | 'secret' | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null); // shown once on regen
  const [confirmRegen, setConfirmRegen] = useState<'publishable' | 'secret' | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/settings/api-keys', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPublishableKey(data.publishableKey);
        setSecretKey(data.secretKey);
        setHasKeys(data.hasKeys);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const generateKeys = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/settings/api-keys', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPublishableKey(data.publishableKey);
        setSecretKey(data.secretKey);
        setHasKeys(true);
      }
    } catch { /* silent */ } finally { setGenerating(false); }
  };

  const regenerateKey = async (type: 'publishable' | 'secret') => {
    setRegenerating(type);
    setConfirmRegen(null);
    try {
      const res = await fetch('/api/settings/api-keys/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json();
        if (type === 'publishable') {
          setPublishableKey(data.key);
        } else {
          setSecretKey(data.key);
          if (data.fullKey) {
            setNewSecretKey(data.fullKey);
            setShowSecret(true);
          }
        }
      }
    } catch { /* silent */ } finally { setRegenerating(null); }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const ENDPOINTS = [
    { method: 'POST', path: '/api/v1/customers', desc: 'Create or upsert a customer', auth: 'secret' },
    { method: 'GET',  path: '/api/v1/customers', desc: 'List customers', auth: 'secret' },
    { method: 'PUT',  path: '/api/v1/customers/:id', desc: 'Update a customer', auth: 'secret' },
    { method: 'POST', path: '/api/v1/customers/:id/payment-methods', desc: 'Save a payment method', auth: 'secret' },
    { method: 'GET',  path: '/api/v1/customers/:id/payment-methods', desc: 'List payment methods', auth: 'secret' },
    { method: 'DELETE', path: '/api/v1/customers/:id/payment-methods/:pmId', desc: 'Remove a payment method', auth: 'secret' },
    { method: 'POST', path: '/api/v1/charges', desc: 'Charge a saved payment method', auth: 'secret' },
    { method: 'POST', path: '/api/v1/charges/:id/refund', desc: 'Refund a charge', auth: 'secret' },
    { method: 'POST', path: '/api/v1/subscriptions', desc: 'Create a subscription', auth: 'secret' },
    { method: 'GET',  path: '/api/v1/subscriptions', desc: 'List subscriptions', auth: 'secret' },
    { method: 'PATCH', path: '/api/v1/subscriptions/:id', desc: 'Update a subscription', auth: 'secret' },
    { method: 'DELETE', path: '/api/v1/subscriptions/:id', desc: 'Cancel a subscription', auth: 'secret' },
    { method: 'POST', path: '/api/v1/payment-schedules', desc: 'Create a payment schedule', auth: 'secret' },
    { method: 'GET',  path: '/api/v1/payment-schedules', desc: 'List payment schedules', auth: 'secret' },
    { method: 'GET',  path: '/api/v1/payment-schedules/:id', desc: 'Get schedule details', auth: 'secret' },
    { method: 'DELETE', path: '/api/v1/payment-schedules/:id', desc: 'Cancel a payment schedule', auth: 'secret' },
    { method: 'POST', path: '/api/v1/checkout/sessions', desc: 'Create hosted checkout session', auth: 'secret' },
    { method: 'GET',  path: '/api/v1/checkout/sessions', desc: 'List checkout sessions', auth: 'secret' },
    { method: 'GET',  path: '/api/v1/checkout/sessions/:id', desc: 'Get checkout session status', auth: 'secret' },
    { method: 'POST', path: '/api/v1/intentions', desc: 'Create a payment intention (Elements)', auth: 'publishable' },
    { method: 'GET',  path: '/api/v1/onboarding/status', desc: 'Get merchant onboarding status', auth: 'secret' },
    { method: 'GET',  path: '/api/onboarding/mpa-embed?token=:token', desc: 'Get Fortis MPA embed link for onboarding', auth: 'public' },
    { method: 'POST', path: '/api/v1/agency/merchants', desc: 'Register a new merchant', auth: 'agency' },
    { method: 'GET',  path: '/api/v1/agency/merchants', desc: 'List agency merchants', auth: 'agency' },
    { method: 'GET',  path: '/api/v1/agency/merchants/:id', desc: 'Get merchant details + keys', auth: 'agency' },
    { method: 'POST', path: '/api/v1/agency/merchants/:id/onboard', desc: 'Submit merchant onboarding to Fortis', auth: 'agency' },
    { method: 'GET',  path: '/api/v1/agency/webhook', desc: 'Get current webhook configuration', auth: 'agency' },
    { method: 'PUT',  path: '/api/v1/agency/webhook', desc: 'Set or update webhook URL', auth: 'agency' },
    { method: 'DELETE', path: '/api/v1/agency/webhook', desc: 'Remove webhook', auth: 'agency' },
  ];

  const methodColor = (m: string) => {
    if (m === 'GET') return 'text-green-600 bg-green-50';
    if (m === 'POST') return 'text-blue-600 bg-blue-50';
    if (m === 'PUT' || m === 'PATCH') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Code className="h-6 w-6" /> Developer API
        </h1>
        <p className="text-muted-foreground mt-1">
          Use the LunarPay API to accept payments, manage customers, and run subscriptions from your own application.
        </p>
      </div>

      {/* API Keys Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" /> API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasKeys ? (
            <div className="text-center py-6">
              <Key className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Generate your API keys to start integrating with the LunarPay API.
              </p>
              <Button onClick={generateKeys} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Generate API Keys
              </Button>
            </div>
          ) : (
            <>
              {newSecretKey && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800">Save your secret key now — it won't be shown again.</p>
                    <code className="mt-1 block text-xs bg-white border border-yellow-200 rounded p-2 font-mono break-all">{newSecretKey}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => copyToClipboard(newSecretKey, 'new-secret')}
                    >
                      {copied === 'new-secret' ? <CheckCircle className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copy
                    </Button>
                  </div>
                </div>
              )}

              {/* Publishable Key */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Publishable Key</label>
                <p className="text-xs text-muted-foreground mb-2">Safe to expose client-side. Use for Fortis Elements integration.</p>
                <div className="flex items-center gap-2">
                  <Input value={publishableKey ?? ''} readOnly className="font-mono text-sm" />
                  <Button size="icon" variant="outline" onClick={() => copyToClipboard(publishableKey!, 'pk')}>
                    {copied === 'pk' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  {confirmRegen === 'publishable' ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="destructive" onClick={() => regenerateKey('publishable')} disabled={!!regenerating}>
                        {regenerating === 'publishable' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmRegen(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button size="icon" variant="outline" onClick={() => setConfirmRegen('publishable')} title="Regenerate">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Secret Key */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Secret Key</label>
                <p className="text-xs text-muted-foreground mb-2">Keep this private. Use for server-side charges, refunds, and subscriptions.</p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={newSecretKey || secretKey || ''}
                      type={showSecret ? 'text' : 'password'}
                      readOnly
                      className="font-mono text-sm pr-10"
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {(newSecretKey || showSecret) && (
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(newSecretKey || secretKey || '', 'sk')}>
                      {copied === 'sk' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                  {confirmRegen === 'secret' ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="destructive" onClick={() => regenerateKey('secret')} disabled={!!regenerating}>
                        {regenerating === 'secret' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmRegen(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button size="icon" variant="outline" onClick={() => setConfirmRegen('secret')} title="Regenerate">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Include your key in the <code className="bg-muted px-1 rounded text-foreground">Authorization</code> header:</p>
          <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto">
{`Authorization: Bearer lp_sk_your_secret_key

# Example with curl:
curl https://app.lunarpay.com/api/v1/customers \\
  -H "Authorization: Bearer lp_sk_your_secret_key"`}
          </pre>
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded text-blue-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-xs">Your account must have completed payment setup (Step 2) before API charges are enabled.</p>
          </div>
        </CardContent>
      </Card>

      {/* Hosted Checkout Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hosted Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Create a hosted payment page on <code className="bg-muted px-1 rounded">app.lunarpay.com</code> without embedding any payment form on your site.
            No domain whitelisting needed — Fortis runs entirely on the LunarPay domain.
          </p>
          <p>
            <strong className="text-foreground">Flow:</strong> Create a session → redirect customer to the returned URL → customer pays → gets redirected back to your <code className="bg-muted px-1 rounded">success_url</code> → poll session status.
          </p>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">1. Create Checkout Session</label>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto mt-1">
{`POST /api/v1/checkout/sessions
Authorization: Bearer lp_sk_your_secret_key
Content-Type: application/json

{
  "amount": 49.99,
  "description": "Wedding Venue Deposit",
  "customer_email": "bride@example.com",
  "customer_name": "Jane Smith",
  "success_url": "https://yourdomain.com/payment/success",
  "cancel_url": "https://yourdomain.com/payment/cancel",
  "metadata": { "proposal_id": "abc123" },
  "expires_in": 3600
}`}
            </pre>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Response</label>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto mt-1">
{`{
  "id": 1,
  "token": "cs_abc...",
  "url": "https://app.lunarpay.com/pay/cs_abc...",
  "status": "open",
  "amount": 49.99,
  "expires_at": "2026-03-16T19:00:00Z"
}`}
            </pre>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2. Redirect Customer</label>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto mt-1">
{`// Redirect, popup, or iframe:
window.location.href = session.url;

// Or open as popup:
window.open(session.url, '_blank', 'width=500,height=700');`}
            </pre>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">3. Check Status</label>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto mt-1">
{`GET /api/v1/checkout/sessions/:id
Authorization: Bearer lp_sk_your_secret_key

// Response includes: status (open/completed/expired),
// transaction_id, fortis_transaction_id, paid_at`}
            </pre>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded text-blue-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-xs">After payment, the customer is redirected to your <code className="bg-muted px-1 rounded">success_url</code> with <code className="bg-muted px-1 rounded">?session_id=ID</code> appended. Always verify the session status server-side before fulfilling orders.</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Schedules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Schedules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Schedule multiple payments with specific amounts and dates for a customer. Each payment is automatically charged on its due date.
          </p>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Create a Schedule</label>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto mt-1">
{`POST https://app.lunarpay.com/api/v1/payment-schedules
Authorization: Bearer lp_sk_your_secret_key
Content-Type: application/json

{
  "customerId": 42,
  "paymentMethodId": 7,
  "description": "3-part payment plan",
  "payments": [
    { "amount": 50000, "date": "2026-04-01" },
    { "amount": 30000, "date": "2026-05-15" },
    { "amount": 20000, "date": "2026-06-30" }
  ]
}`}
            </pre>
            <p className="text-xs mt-2">Amounts are in cents. Dates are <code className="bg-muted px-1 rounded text-foreground">YYYY-MM-DD</code>. Up to 100 payments per schedule.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Response</label>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto mt-1">
{`{
  "data": {
    "id": 1,
    "customerId": 42,
    "paymentMethodId": 7,
    "status": "active",
    "totalAmount": 100000,
    "paidAmount": 0,
    "paymentsTotal": 3,
    "paymentsCompleted": 0,
    "payments": [
      { "id": 1, "amount": 50000, "date": "2026-04-01", "status": "pending" },
      { "id": 2, "amount": 30000, "date": "2026-05-15", "status": "pending" },
      { "id": 3, "amount": 20000, "date": "2026-06-30", "status": "pending" }
    ]
  }
}`}
            </pre>
          </div>
          <p className="text-xs">
            Schedule statuses: <code className="bg-muted px-1 rounded text-foreground">active</code> → <code className="bg-muted px-1 rounded text-foreground">completed</code> | <code className="bg-muted px-1 rounded text-foreground">cancelled</code>.
            Payment statuses: <code className="bg-muted px-1 rounded text-foreground">pending</code> → <code className="bg-muted px-1 rounded text-foreground">paid</code> | <code className="bg-muted px-1 rounded text-foreground">failed</code> | <code className="bg-muted px-1 rounded text-foreground">cancelled</code>.
          </p>
        </CardContent>
      </Card>

      {/* Agency API */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agency API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Agency keys (<code className="bg-muted px-1 rounded text-foreground">lp_agency_...</code>) let you register and onboard merchants programmatically.
            Each merchant gets their own <code className="bg-muted px-1 rounded text-foreground">lp_sk_</code> / <code className="bg-muted px-1 rounded text-foreground">lp_pk_</code> keys for payment processing.
          </p>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">1. Register a Merchant</label>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto mt-1">
{`POST /api/v1/agency/merchants
Authorization: Bearer lp_agency_your_key
{
  "email": "venue@example.com",
  "password": "securepass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-0100",
  "businessName": "Doe Wedding Venue"
}`}
            </pre>
            <p className="text-xs mt-1">Returns <code className="bg-muted px-1 rounded text-foreground">merchantId</code>, <code className="bg-muted px-1 rounded text-foreground">publishableKey</code>, <code className="bg-muted px-1 rounded text-foreground">secretKey</code>, and <code className="bg-muted px-1 rounded text-foreground">orgToken</code>.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2. Submit Onboarding to Fortis</label>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto mt-1">
{`POST /api/v1/agency/merchants/:id/onboard
Authorization: Bearer lp_agency_your_key
{
  "firstName": "John", "lastName": "Doe",
  "phone": "555-0100", "email": "venue@example.com",
  "dbaName": "Doe Wedding Venue",
  "legalName": "Doe Venues LLC",
  "addressLine1": "123 Main St",
  "city": "Austin", "state": "TX", "postalCode": "78701",
  "routingNumber": "021000021",
  "accountNumber": "123456789",
  "accountHolderName": "John Doe"
}`}
            </pre>
            <p className="text-xs mt-1">Returns the <code className="bg-muted px-1 rounded text-foreground">mpaEmbedUrl</code> — redirect the merchant there to complete the Fortis MPA form.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">3. Check Status / Get Keys</label>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto mt-1">
{`GET /api/v1/agency/merchants/:id
Authorization: Bearer lp_agency_your_key

# Returns merchant details, API keys, and onboarding status`}
            </pre>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">4. Configure Webhooks</label>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto mt-1">
{`PUT /api/v1/agency/webhook
Authorization: Bearer lp_agency_your_key
{
  "webhookUrl": "https://storypay.io/webhooks/lunarpay"
}

# Response — save the secret for signature verification:
{
  "data": {
    "webhookUrl": "https://storypay.io/webhooks/lunarpay",
    "webhookSecret": "whsec_abc123..."
  }
}`}
            </pre>
            <p className="text-xs mt-1">When a merchant is approved or denied by Fortis, LunarPay will <code className="bg-muted px-1 rounded text-foreground">POST</code> to your webhook URL.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Webhook Payload</label>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto mt-1">
{`{
  "event": "merchant.approved",  // or "merchant.denied"
  "merchant": {
    "id": 123,
    "email": "venue@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "businessName": "Doe Wedding Venue",
    "organizationId": 42
  },
  "onboarding": {
    "status": "ACTIVE",
    "previousStatus": "BANK_INFORMATION_SENT"
  },
  "keys": {                       // only on merchant.approved
    "publishableKey": "lp_pk_...",
    "secretKey": "lp_sk_..."
  },
  "timestamp": "2026-03-21T20:00:00.000Z"
}`}
            </pre>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Verifying Signatures</label>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto mt-1">
{`// Header: X-LunarPay-Signature
const crypto = require('crypto');
const expected = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex');
if (expected !== req.headers['x-lunarpay-signature']) {
  return res.status(401).send('Invalid signature');
}`}
            </pre>
          </div>
          <p className="text-xs">
            Flow: Register → Onboard → Merchant completes MPA → Fortis approves (24-48h) → <strong>Webhook fires</strong> → <code className="bg-muted px-1 rounded text-foreground">isActive: true</code> → Merchant can process payments with their own keys.
          </p>
        </CardContent>
      </Card>

      {/* Onboarding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Onboarding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Check Merchant Status</label>
            <p className="text-xs mt-1 mb-2">Poll this endpoint to check if your merchant account is approved and ready to process payments.</p>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto">
{`GET https://app.lunarpay.com/api/v1/onboarding/status
Authorization: Bearer lp_sk_your_secret_key

# Returns:
{
  "organizationId": 42,
  "organizationName": "Acme Corp",
  "status": "ACTIVE",
  "isActive": true,
  "stepCompleted": 2,
  "mpaLink": "https://...",
  "mpaEmbedUrl": "https://app.lunarpay.com/onboarding/abc123",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-02T00:00:00.000Z"
}`}
            </pre>
            <p className="text-xs mt-2">
              Status values: <code className="bg-muted px-1 rounded text-foreground">PENDING</code> → <code className="bg-muted px-1 rounded text-foreground">BANK_INFORMATION_SENT</code> → <code className="bg-muted px-1 rounded text-foreground">ACTIVE</code>
            </p>
          </div>
          <hr />
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">MPA Embed Page</label>
            <p className="text-xs mt-1 mb-2">The Fortis application form must be served from <code className="bg-muted px-1 rounded text-foreground">app.lunarpay.com</code> (iframe domain restriction). Use the <code className="bg-muted px-1 rounded text-foreground">mpaEmbedUrl</code> from the status endpoint, or construct it directly:</p>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto">
{`https://app.lunarpay.com/onboarding/{org_token}`}
            </pre>
          </div>
          <hr />
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">MPA Embed API (Public)</label>
            <p className="text-xs mt-1 mb-2">No authentication required — the org token acts as the identifier.</p>
            <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto">
{`GET https://app.lunarpay.com/api/onboarding/mpa-embed?token={org_token}

# Returns:
{
  "status": "BANK_INFORMATION_SENT",
  "mpaLink": "https://fortis.example.com/...",
  "organizationName": "Acme Corp",
  "organizationLogo": "..."
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Base URL: <code className="bg-muted px-1 rounded">https://app.lunarpay.com</code></p>
          <div className="space-y-1">
            {ENDPOINTS.map((ep, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${methodColor(ep.method)}`}>
                  {ep.method}
                </span>
                <code className="text-xs font-mono text-foreground flex-1">{ep.path}</code>
                <span className="text-xs text-muted-foreground hidden sm:block flex-1">{ep.desc}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${ep.auth === 'secret' ? 'bg-orange-50 text-orange-600' : ep.auth === 'agency' ? 'bg-cyan-50 text-cyan-600' : ep.auth === 'public' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                  {ep.auth === 'secret' ? 'lp_sk_' : ep.auth === 'agency' ? 'lp_agency_' : ep.auth === 'public' ? 'public' : 'lp_pk_'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
