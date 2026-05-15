import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Developer API — LunarPay',
  description: 'LunarPay API documentation. Accept payments, manage customers, run subscriptions, and issue refunds through the LunarPay API.',
};

// ─── helpers ────────────────────────────────────────────────────────────────

function Method({ m }: { m: string }) {
  const colors: Record<string, string> = {
    GET:    'bg-green-100 text-green-700',
    POST:   'bg-blue-100 text-blue-700',
    PUT:    'bg-yellow-100 text-yellow-800',
    PATCH:  'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono ${colors[m] ?? 'bg-gray-100 text-gray-700'}`}>
      {m}
    </span>
  );
}

function KeyBadge({ type }: { type: 'secret' | 'publishable' }) {
  return type === 'secret'
    ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200 font-mono">lp_sk_</span>
    : <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200 font-mono">lp_pk_</span>;
}

function Code({ children }: { children: string }) {
  return (
    <code className="bg-gray-900 text-gray-100 rounded-lg block p-4 text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed">
      {children}
    </code>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-20">
      <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ─── endpoint row ────────────────────────────────────────────────────────────

interface EP {
  method: string;
  path: string;
  desc: string;
  key: 'secret' | 'publishable';
  params?: { name: string; type: string; required: boolean; desc: string }[];
  body?: { name: string; type: string; required: boolean; desc: string }[];
  example?: string;
  response?: string;
}

function Endpoint({ ep }: { ep: EP }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <Method m={ep.method} />
        <code className="text-sm font-mono text-gray-800 flex-1">{ep.path}</code>
        <KeyBadge type={ep.key} />
      </div>
      <div className="px-4 py-4 space-y-4">
        <p className="text-sm text-gray-600">{ep.desc}</p>

        {ep.params && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Path Parameters</p>
            <div className="space-y-1">
              {ep.params.map(p => (
                <div key={p.name} className="flex items-start gap-3 text-sm">
                  <code className="font-mono text-blue-700 w-28 shrink-0">{p.name}</code>
                  <span className="text-gray-400 text-xs mt-0.5 w-16 shrink-0">{p.type}</span>
                  <span className={`text-xs mt-0.5 w-16 shrink-0 ${p.required ? 'text-red-500' : 'text-gray-400'}`}>{p.required ? 'required' : 'optional'}</span>
                  <span className="text-gray-600 text-xs mt-0.5">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ep.body && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body</p>
            <div className="space-y-1">
              {ep.body.map(p => (
                <div key={p.name} className="flex items-start gap-3 text-sm">
                  <code className="font-mono text-blue-700 w-40 shrink-0">{p.name}</code>
                  <span className="text-gray-400 text-xs mt-0.5 w-16 shrink-0">{p.type}</span>
                  <span className={`text-xs mt-0.5 w-16 shrink-0 ${p.required ? 'text-red-500' : 'text-gray-400'}`}>{p.required ? 'required' : 'optional'}</span>
                  <span className="text-gray-600 text-xs mt-0.5">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ep.example && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Example Request</p>
            <Code>{ep.example}</Code>
          </div>
        )}

        {ep.response && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Example Response</p>
            <Code>{ep.response}</Code>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── nav items ───────────────────────────────────────────────────────────────

const NAV = [
  { id: 'quickstart',      label: 'Quick Start' },
  { id: 'authentication',  label: 'Authentication' },
  { id: 'errors',          label: 'Errors' },
  { id: 'hosted-checkout', label: 'Hosted Checkout' },
  { id: 'customers',       label: 'Customers' },
  { id: 'payment-methods', label: 'Payment Methods' },
  { id: 'charges',         label: 'Charges' },
  { id: 'holds',           label: 'Holds & Captures' },
  { id: 'refunds',         label: 'Refunds' },
  { id: 'subscriptions',   label: 'Subscriptions' },
  { id: 'schedules',       label: 'Payment Schedules' },
  { id: 'intentions',      label: 'Payment Intentions' },
  { id: 'elements-styling', label: 'Styling Elements' },
  { id: 'onboarding',      label: 'Onboarding' },
  { id: 'agency',          label: 'Agency API' },
  { id: 'reference',       label: 'Quick Reference' },
];

// ─── page ────────────────────────────────────────────────────────────────────

export default function DevelopersPage() {
  const BASE = 'https://app.lunarpay.com';

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-gray-900 text-sm">LunarPay</Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-600 font-medium">API Documentation</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link href="/register" className="text-sm bg-black text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              Get API Keys
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 flex gap-10 py-10">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 hidden lg:block">
          <nav className="sticky top-24 space-y-0.5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Reference</p>
            {NAV.map(n => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="block text-sm text-gray-600 hover:text-gray-900 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              >
                {n.label}
              </a>
            ))}
            <div className="pt-4 border-t border-gray-100 mt-4">
              <Link
                href="/settings/developer"
                className="block text-sm text-blue-600 hover:text-blue-700 py-1 px-2"
              >
                → Manage API Keys
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 max-w-3xl space-y-12">

          {/* Hero */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              REST API · v1
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">LunarPay API</h1>
            <p className="text-gray-600 leading-relaxed">
              Accept payments, manage customers, save cards, run subscriptions, and issue refunds from your own application.
              LunarPay routes all transactions through Fortis — a PCI-compliant payment processor — so you never handle raw card numbers.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border">
                <span className="font-mono text-xs">Base URL</span>
                <code className="text-blue-700 font-mono text-xs">{BASE}</code>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border">
                <span className="text-green-600">✓</span>
                <span className="text-xs">PCI SAQ-A compliant</span>
              </div>
            </div>
          </div>

          {/* Quick Start */}
          <Section id="quickstart" title="Quick Start">
            <p className="text-sm text-gray-600 mb-4">
              Follow these steps to charge a customer for the first time.
            </p>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">1. Get your API keys</p>
                <p className="text-sm text-gray-600 mb-3">
                  Sign in → <Link href="/settings/developer" className="text-blue-600 hover:underline">Settings → Developer API</Link> → Generate API Keys.
                  You&apos;ll receive a <span className="font-mono text-orange-600 text-xs">lp_sk_...</span> secret key and a <span className="font-mono text-purple-600 text-xs">lp_pk_...</span> publishable key.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">2. Create a customer</p>
                <Code>{`curl -X POST ${BASE}/api/v1/customers \\
  -H "Authorization: Bearer lp_sk_your_secret_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com"
  }'`}</Code>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">3. Collect card details (frontend)</p>
                <p className="text-sm text-gray-600 mb-2">
                  Create a payment intention with your publishable key, then use Fortis Elements to collect card data. Card numbers go directly from the browser to Fortis — LunarPay never sees them.
                </p>
                <Code>{`// 1. Get a clientToken from your server
const res = await fetch("${BASE}/api/v1/intentions", {
  method: "POST",
  headers: { "Authorization": "Bearer lp_pk_your_publishable_key" },
  body: JSON.stringify({ hasRecurring: true }) // for saving cards
});
const { clientToken } = await res.json();

// 2. Initialize Fortis Elements with the clientToken
// (see Fortis Elements docs for full integration)
// Fortis returns a ticket_id when the user enters their card`}</Code>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">4. Save the card (backend)</p>
                <Code>{`curl -X POST ${BASE}/api/v1/customers/123/payment-methods \\
  -H "Authorization: Bearer lp_sk_your_secret_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ticketId": "ticket_abc123from_fortis_elements",
    "setDefault": true
  }'`}</Code>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">5. Charge the customer</p>
                <Code>{`curl -X POST ${BASE}/api/v1/charges \\
  -H "Authorization: Bearer lp_sk_your_secret_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": 123,
    "paymentMethodId": 456,
    "amount": 4999,
    "description": "Pro plan — monthly"
  }'`}</Code>
              </div>
            </div>
          </Section>

          {/* Authentication */}
          <Section id="authentication" title="Authentication">
            <p className="text-sm text-gray-600 mb-4">
              All API requests must include an <code className="bg-gray-100 px-1 rounded text-xs">Authorization</code> header with your API key.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border border-orange-200 bg-orange-50 rounded-xl p-4">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">Secret Key</p>
                <code className="text-sm font-mono text-orange-800">lp_sk_...</code>
                <p className="text-xs text-orange-700 mt-2">Use on your server only. Never expose in frontend code. Required for charges, refunds, subscriptions, and customer management.</p>
              </div>
              <div className="border border-purple-200 bg-purple-50 rounded-xl p-4">
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">Publishable Key</p>
                <code className="text-sm font-mono text-purple-800">lp_pk_...</code>
                <p className="text-xs text-purple-700 mt-2">Safe to include in frontend code. Only used for creating payment intentions for Fortis Elements.</p>
              </div>
            </div>

            <Code>{`Authorization: Bearer lp_sk_your_secret_key`}</Code>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
              <strong>Requirement:</strong> Your LunarPay account must have completed payment setup (Step 2 — Fortis onboarding) before the API will allow charges. API key generation works immediately after registration.
            </div>
          </Section>

          {/* Errors */}
          <Section id="errors" title="Errors">
            <p className="text-sm text-gray-600 mb-4">
              LunarPay returns standard HTTP status codes. All error responses follow this shape:
            </p>
            <Code>{`{
  "error": "Human-readable error message",
  "details": { ... }  // optional, present for validation errors
}`}</Code>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 w-20">Code</th>
                    <th className="px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['200', 'Success'],
                    ['201', 'Created — resource successfully created'],
                    ['400', 'Bad Request — validation error or invalid input'],
                    ['401', 'Unauthorized — missing or invalid API key'],
                    ['402', 'Payment Required — charge was declined by the processor'],
                    ['403', 'Forbidden — account not approved for payments yet'],
                    ['404', 'Not Found — resource not found or not owned by your account'],
                    ['500', 'Server Error — something went wrong on our end'],
                    ['503', 'Service Unavailable — payment processor credentials not configured'],
                  ].map(([code, desc]) => (
                    <tr key={code} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border border-gray-200">
                        <code className="text-xs font-mono font-semibold text-gray-800">{code}</code>
                      </td>
                      <td className="px-3 py-2 border border-gray-200 text-xs text-gray-600">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Customers */}
          <Section id="customers" title="Customers">
            <p className="text-sm text-gray-600 mb-6">
              Customers (called &quot;donors&quot; internally) represent the people paying your merchants. All amounts are in <strong>cents</strong> (integers).
            </p>

            <Endpoint ep={{
              method: 'POST', path: '/api/v1/customers', key: 'secret',
              desc: 'Create a new customer. If a customer with the same email already exists for your account, the record is updated and returned with created: false.',
              body: [
                { name: 'firstName', type: 'string', required: false, desc: 'First name' },
                { name: 'lastName',  type: 'string', required: false, desc: 'Last name' },
                { name: 'email',     type: 'string', required: false, desc: 'Email address (used for upsert matching)' },
                { name: 'phone',     type: 'string', required: false, desc: 'Phone number' },
                { name: 'address',   type: 'string', required: false, desc: 'Street address' },
                { name: 'city',      type: 'string', required: false, desc: 'City' },
                { name: 'state',     type: 'string', required: false, desc: 'State / province' },
                { name: 'zip',       type: 'string', required: false, desc: 'Postal code' },
                { name: 'country',   type: 'string', required: false, desc: 'Country' },
              ],
              example: `curl -X POST ${BASE}/api/v1/customers \\
  -H "Authorization: Bearer lp_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "5551234567"
  }'`,
              response: `{
  "data": {
    "id": 123,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "5551234567",
    "amountAcum": "0.00",
    "createdAt": "2026-02-10T12:00:00.000Z",
    "updatedAt": "2026-02-10T12:00:00.000Z"
  },
  "created": true
}`,
            }} />

            <Endpoint ep={{
              method: 'GET', path: '/api/v1/customers', key: 'secret',
              desc: 'List all customers for your account. Supports pagination and search.',
              params: [
                { name: 'page',   type: 'number', required: false, desc: 'Page number (default: 1)' },
                { name: 'limit',  type: 'number', required: false, desc: 'Per page, max 100 (default: 20)' },
                { name: 'search', type: 'string', required: false, desc: 'Search by name or email' },
              ],
              example: `curl "${BASE}/api/v1/customers?page=1&limit=20&search=jane" \\
  -H "Authorization: Bearer lp_sk_..."`,
              response: `{
  "data": [ { "id": 123, "firstName": "Jane", ... } ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "pages": 1 }
}`,
            }} />

            <Endpoint ep={{
              method: 'GET', path: '/api/v1/customers/:id', key: 'secret',
              desc: 'Retrieve a single customer by ID.',
              params: [{ name: 'id', type: 'number', required: true, desc: 'Customer ID' }],
              example: `curl ${BASE}/api/v1/customers/123 \\
  -H "Authorization: Bearer lp_sk_..."`,
            }} />

            <Endpoint ep={{
              method: 'PUT', path: '/api/v1/customers/:id', key: 'secret',
              desc: 'Update a customer\'s details.',
              params: [{ name: 'id', type: 'number', required: true, desc: 'Customer ID' }],
              body: [
                { name: 'firstName', type: 'string', required: false, desc: 'First name' },
                { name: 'lastName',  type: 'string', required: false, desc: 'Last name' },
                { name: 'email',     type: 'string', required: false, desc: 'Email address' },
                { name: 'phone',     type: 'string', required: false, desc: 'Phone number' },
              ],
            }} />
          </Section>

          {/* Payment Methods */}
          <Section id="payment-methods" title="Payment Methods">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 mb-6">
              <strong>How card &amp; bank saving works:</strong> You never pass raw card numbers or bank account details to the LunarPay API. Instead, use the Fortis Elements iframe (via a payment intention) to collect payment data directly in the customer&apos;s browser. Fortis returns a <code className="bg-blue-100 px-1 rounded text-xs">ticket_id</code> — pass that to this endpoint to vault the card or bank account and get back a reusable <code className="bg-blue-100 px-1 rounded text-xs">paymentMethodId</code>.
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-900 mb-6">
              <strong>Credit cards vs ACH (eCheck):</strong> LunarPay supports both. To save a bank account instead of a card, request an ACH intention (<code className="bg-emerald-100 px-1 rounded text-xs">paymentMethod: &quot;ach&quot;</code>) and pass <code className="bg-emerald-100 px-1 rounded text-xs">paymentMethod: &quot;ach&quot;</code> when saving the payment method. ACH requires the merchant to have ACH enabled on their Fortis account during onboarding.
            </div>

            <Endpoint ep={{
              method: 'POST', path: '/api/v1/customers/:id/payment-methods', key: 'secret',
              desc: 'Save a payment method (credit card or bank account) for a customer using a ticket_id returned by Fortis Elements.',
              params: [{ name: 'id', type: 'number', required: true, desc: 'Customer ID' }],
              body: [
                { name: 'ticketId',      type: 'string',  required: true,  desc: 'ticket_id from Fortis Elements callback' },
                { name: 'paymentMethod', type: 'string',  required: false, desc: '"cc" (default) or "ach". Must match the tab the customer used in Fortis Elements.' },
                { name: 'nameHolder',    type: 'string',  required: false, desc: 'Name on card or account' },
                { name: 'setDefault',    type: 'boolean', required: false, desc: 'Set as default payment method (default: false)' },
              ],
              example: `# Save a credit card
curl -X POST ${BASE}/api/v1/customers/123/payment-methods \\
  -H "Authorization: Bearer lp_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "ticketId": "ticket_fts_abc123",
    "paymentMethod": "cc",
    "nameHolder": "Jane Smith",
    "setDefault": true
  }'

# Save a bank account (ACH / eCheck)
curl -X POST ${BASE}/api/v1/customers/123/payment-methods \\
  -H "Authorization: Bearer lp_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "ticketId": "ticket_fts_ach_xyz",
    "paymentMethod": "ach",
    "nameHolder": "Jane Smith",
    "setDefault": false
  }'`,
              response: `{
  "data": {
    "id": 456,
    "sourceType": "cc",      // "cc" or "ach"
    "bankType": null,        // "checking" or "savings" for ACH; null for CC
    "lastDigits": "4242",
    "nameHolder": "Jane Smith",
    "isDefault": true,
    "expMonth": "12",
    "expYear": "2028",
    "createdAt": "2026-02-10T12:00:00.000Z"
  }
}`,
            }} />

            <Endpoint ep={{
              method: 'GET', path: '/api/v1/customers/:id/payment-methods', key: 'secret',
              desc: 'List all active payment methods for a customer.',
              params: [{ name: 'id', type: 'number', required: true, desc: 'Customer ID' }],
            }} />

            <Endpoint ep={{
              method: 'DELETE', path: '/api/v1/customers/:id/payment-methods/:pmId', key: 'secret',
              desc: 'Deactivate a saved payment method. The card is not deleted from the Fortis vault, just marked inactive in LunarPay.',
              params: [
                { name: 'id',   type: 'number', required: true, desc: 'Customer ID' },
                { name: 'pmId', type: 'number', required: true, desc: 'Payment method ID' },
              ],
            }} />
          </Section>

          {/* Charges */}
          <Section id="charges" title="Charges">
            <p className="text-sm text-gray-600 mb-6">
              Charge a saved payment method. The customer must have at least one saved payment method. All amounts are in <strong>cents</strong>. The charge is automatically routed to the correct Fortis product based on whether the saved payment method is a credit card or a bank account — you don&apos;t need to specify.
            </p>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900 mb-6">
              <strong>ACH settlement:</strong> ACH charges return <code className="bg-amber-100 px-1 rounded text-xs">status: &quot;pending&quot;</code> immediately. Final settlement (success or return) happens 3–5 business days later and is delivered to your registered webhook. Credit card charges return <code className="bg-amber-100 px-1 rounded text-xs">status: &quot;paid&quot;</code> instantly.
            </div>

            <Endpoint ep={{
              method: 'POST', path: '/api/v1/charges', key: 'secret',
              desc: 'Charge a customer\'s saved payment method. Works for both credit card and ACH payment methods.',
              body: [
                { name: 'customerId',      type: 'number',  required: true,  desc: 'Customer ID to charge' },
                { name: 'paymentMethodId', type: 'number',  required: true,  desc: 'Payment method ID to charge (CC or ACH)' },
                { name: 'amount',          type: 'number',  required: true,  desc: 'Amount in cents (e.g. 4999 = $49.99). Minimum 50.' },
                { name: 'description',     type: 'string',  required: false, desc: 'Optional description shown on the transaction' },
                { name: 'capture',         type: 'boolean', required: false, desc: 'Default true. Set false to place an authorization hold without settling. CC only — ACH rejects capture: false.' },
              ],
              example: `curl -X POST ${BASE}/api/v1/charges \\
  -H "Authorization: Bearer lp_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": 123,
    "paymentMethodId": 456,
    "amount": 4999,
    "description": "Pro plan — monthly"
  }'`,
              response: `{
  "data": {
    "id": "789",
    "amount": 4999,
    "status": "paid",            // "paid" | "pending" | "authorized"
    "captured": true,            // false for auth-only holds
    "paymentMethod": "cc",       // "cc" or "ach"
    "customerId": 123,
    "paymentMethodId": 456,
    "fortisTransactionId": "fts_txn_abc123",
    "description": "Pro plan — monthly",
    "createdAt": "2026-02-10T12:00:00.000Z"
  }
}`,
            }} />
          </Section>

          {/* Holds & Captures */}
          <Section id="holds" title="Holds & Captures">
            <p className="text-sm text-gray-600 mb-4">
              Place an authorization hold (also called an auth-only) to reserve funds on a card without settling the charge. The funds are not actually moved until you call <code className="bg-gray-100 px-1 rounded text-xs">/capture</code>. Use this for hotel deposits, equipment rentals, deferred shipping, or any flow where the final amount or fulfillment is unknown at the time of payment.
            </p>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900 mb-4">
              <strong>Authorization window:</strong> Fortis holds typically expire after <strong>7 days</strong> if not captured. After expiry the hold drops off the customer&apos;s card on its own — but you should still capture or void explicitly so the customer&apos;s available balance is freed immediately. Auth-only is <strong>credit card only</strong>; ACH does not support holds.
            </div>

            <SubSection id="holds-flow" title="The flow">
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside mb-2">
                <li>Save a card via <code className="bg-gray-100 px-1 rounded text-xs">POST /api/v1/customers/:id/payment-methods</code></li>
                <li>Authorize a hold: <code className="bg-gray-100 px-1 rounded text-xs">POST /api/v1/charges</code> with <code className="bg-gray-100 px-1 rounded text-xs">capture: false</code> — returns a charge with <code className="bg-gray-100 px-1 rounded text-xs">status: &quot;authorized&quot;</code></li>
                <li>Either <code className="bg-gray-100 px-1 rounded text-xs">POST /api/v1/charges/:id/capture</code> to settle (full or partial), OR <code className="bg-gray-100 px-1 rounded text-xs">POST /api/v1/charges/:id/void</code> to release the hold</li>
              </ol>
            </SubSection>

            <SubSection id="holds-authorize" title="1. Place an authorization hold">
              <Endpoint ep={{
                method: 'POST', path: '/api/v1/charges', key: 'secret',
                desc: 'Same endpoint as a normal charge — just pass capture: false. Returns a charge with status "authorized" instead of "paid".',
                body: [
                  { name: 'customerId',      type: 'number',  required: true,  desc: 'Customer ID' },
                  { name: 'paymentMethodId', type: 'number',  required: true,  desc: 'Credit card payment method ID (ACH is rejected)' },
                  { name: 'amount',          type: 'number',  required: true,  desc: 'Amount to hold in cents. You can capture less than this; you cannot capture more.' },
                  { name: 'description',     type: 'string',  required: false, desc: 'Optional description' },
                  { name: 'capture',         type: 'boolean', required: true,  desc: 'Must be false for auth-only' },
                ],
                example: `curl -X POST ${BASE}/api/v1/charges \\
  -H "Authorization: Bearer lp_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": 123,
    "paymentMethodId": 456,
    "amount": 10000,
    "description": "Equipment deposit",
    "capture": false
  }'`,
                response: `{
  "data": {
    "id": "789",
    "amount": 10000,
    "status": "authorized",
    "captured": false,
    "paymentMethod": "cc",
    "customerId": 123,
    "paymentMethodId": 456,
    "fortisTransactionId": "fts_txn_abc123",
    "description": "Equipment deposit",
    "createdAt": "2026-02-10T12:00:00.000Z",
    "note": "Hold placed. Capture within your authorization window (typically 7 days) via POST /api/v1/charges/:id/capture, or release the hold via POST /api/v1/charges/:id/void."
  }
}`,
              }} />
            </SubSection>

            <SubSection id="holds-capture" title="2. Capture (settle) the hold">
              <Endpoint ep={{
                method: 'POST', path: '/api/v1/charges/:id/capture', key: 'secret',
                desc: 'Settle a previously authorized charge. Omit amount to capture the full authorized amount; pass amount for a partial capture. The captured amount becomes the charge\'s final totalAmount.',
                params: [{ name: 'id', type: 'string', required: true, desc: 'Charge ID returned from the auth-only call' }],
                body: [
                  { name: 'amount', type: 'number', required: false, desc: 'Amount to capture in cents. Must be ≤ authorized amount. Omit for full capture.' },
                ],
                example: `# Full capture of the held amount
curl -X POST ${BASE}/api/v1/charges/789/capture \\
  -H "Authorization: Bearer lp_sk_..."

# Partial capture — held $100, capturing $80
curl -X POST ${BASE}/api/v1/charges/789/capture \\
  -H "Authorization: Bearer lp_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "amount": 8000 }'`,
                response: `{
  "data": {
    "id": "789",
    "capturedAmount": 8000,
    "authorizedAmount": 10000,
    "partial": true,
    "status": "paid"
  }
}`,
              }} />
            </SubSection>

            <SubSection id="holds-void" title="3. Void (release) the hold">
              <Endpoint ep={{
                method: 'POST', path: '/api/v1/charges/:id/void', key: 'secret',
                desc: 'Release an authorization hold without capturing any funds, or cancel a captured sale that hasn\'t settled yet. Voids carry no Fortis fee and do not appear on the customer\'s statement. After settlement, use refund instead.',
                params: [{ name: 'id', type: 'string', required: true, desc: 'Charge ID' }],
                example: `curl -X POST ${BASE}/api/v1/charges/789/void \\
  -H "Authorization: Bearer lp_sk_..."`,
                response: `{
  "data": {
    "id": "789",
    "status": "voided",
    "priorStatus": "authorized"   // "authorized" or "paid"
  }
}`,
              }} />
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
                <strong>Void vs refund:</strong> A void cancels a transaction before it settles (same business day for captured sales, anytime within the auth window for holds). It&apos;s free and invisible to the customer. A refund happens after settlement, costs a processor fee, and shows up on the customer&apos;s statement as a separate credit. The void endpoint automatically returns a helpful error if the charge has already settled, prompting you to use refund instead.
              </div>
            </SubSection>
          </Section>

          {/* Refunds */}
          <Section id="refunds" title="Refunds">
            <Endpoint ep={{
              method: 'POST', path: '/api/v1/charges/:id/refund', key: 'secret',
              desc: 'Refund a charge, partially or in full. Omit amount for a full refund.',
              params: [{ name: 'id', type: 'string', required: true, desc: 'Charge ID returned when the charge was created' }],
              body: [
                { name: 'amount', type: 'number', required: false, desc: 'Amount to refund in cents. Omit for full refund.' },
              ],
              example: `# Full refund
curl -X POST ${BASE}/api/v1/charges/789/refund \\
  -H "Authorization: Bearer lp_sk_..."

# Partial refund of $10.00
curl -X POST ${BASE}/api/v1/charges/789/refund \\
  -H "Authorization: Bearer lp_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "amount": 1000 }'`,
              response: `{
  "data": {
    "chargeId": "789",
    "refundedAmount": 4999,
    "fullRefund": true,
    "status": "refunded"
  }
}`,
            }} />
          </Section>

          {/* Subscriptions */}
          <Section id="subscriptions" title="Subscriptions">
            <p className="text-sm text-gray-600 mb-6">
              Subscriptions charge a saved payment method on a recurring schedule. LunarPay processes them automatically via its daily cron job.
            </p>

            <Endpoint ep={{
              method: 'POST', path: '/api/v1/subscriptions', key: 'secret',
              desc: 'Create a recurring subscription for a customer.',
              body: [
                { name: 'customerId',      type: 'number', required: true,  desc: 'Customer ID' },
                { name: 'paymentMethodId', type: 'number', required: true,  desc: 'Payment method to charge' },
                { name: 'amount',          type: 'number', required: true,  desc: 'Amount per cycle in cents. Minimum 50.' },
                { name: 'frequency',       type: 'string', required: true,  desc: 'weekly | monthly | quarterly | yearly' },
                { name: 'startOn',         type: 'string', required: false, desc: 'ISO 8601 start date. Defaults to today.' },
              ],
              example: `curl -X POST ${BASE}/api/v1/subscriptions \\
  -H "Authorization: Bearer lp_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": 123,
    "paymentMethodId": 456,
    "amount": 4999,
    "frequency": "monthly",
    "startOn": "2026-03-01T00:00:00Z"
  }'`,
              response: `{
  "data": {
    "id": 101,
    "customerId": 123,
    "paymentMethodId": 456,
    "amount": 4999,
    "frequency": "monthly",
    "status": "active",
    "startOn": "2026-03-01T00:00:00.000Z",
    "nextPaymentOn": "2026-04-01T00:00:00.000Z",
    "createdAt": "2026-02-10T12:00:00.000Z"
  }
}`,
            }} />

            <Endpoint ep={{
              method: 'GET', path: '/api/v1/subscriptions', key: 'secret',
              desc: 'List subscriptions. Filter by status with ?status=active or ?status=cancelled.',
              params: [
                { name: 'status', type: 'string', required: false, desc: 'active | cancelled (default: all)' },
                { name: 'page',   type: 'number', required: false, desc: 'Page number (default: 1)' },
                { name: 'limit',  type: 'number', required: false, desc: 'Per page, max 100 (default: 20)' },
              ],
            }} />

            <Endpoint ep={{
              method: 'GET', path: '/api/v1/subscriptions/:id', key: 'secret',
              desc: 'Retrieve a single subscription.',
              params: [{ name: 'id', type: 'number', required: true, desc: 'Subscription ID' }],
            }} />

            <Endpoint ep={{
              method: 'PATCH', path: '/api/v1/subscriptions/:id', key: 'secret',
              desc: 'Update a subscription\'s amount, frequency, or next billing date.',
              params: [{ name: 'id', type: 'number', required: true, desc: 'Subscription ID' }],
              body: [
                { name: 'amount',        type: 'number', required: false, desc: 'New amount in cents' },
                { name: 'frequency',     type: 'string', required: false, desc: 'weekly | monthly | quarterly | yearly' },
                { name: 'nextPaymentOn', type: 'string', required: false, desc: 'ISO 8601 date for next billing' },
              ],
            }} />

            <Endpoint ep={{
              method: 'DELETE', path: '/api/v1/subscriptions/:id', key: 'secret',
              desc: 'Cancel a subscription immediately. No further charges will be made.',
              params: [{ name: 'id', type: 'number', required: true, desc: 'Subscription ID' }],
              response: `{ "success": true, "status": "cancelled" }`,
            }} />
          </Section>

          {/* Hosted Checkout */}
          <Section id="hosted-checkout" title="Hosted Checkout">
            <p className="text-sm text-gray-600 mb-4">
              Create a hosted payment page on <code className="bg-gray-100 px-1 rounded text-xs">app.lunarpay.com</code> without embedding any payment form on your site.
              No domain whitelisting needed — the Fortis payment form runs entirely on the LunarPay domain.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              <strong>Flow:</strong> Create a session → redirect customer to the returned URL → customer pays → redirect back to your <code className="bg-gray-100 px-1 rounded text-xs">success_url</code> → poll session status.
            </p>

            <Endpoint ep={{
              method: 'POST', path: '/api/v1/checkout/sessions', key: 'secret',
              desc: 'Create a hosted checkout session. Returns a URL to redirect the customer to.',
              body: [
                { name: 'amount',          type: 'number', required: true,  desc: 'Amount in dollars (e.g. 49.99)' },
                { name: 'description',     type: 'string', required: false, desc: 'Description shown on the payment page' },
                { name: 'customer_email',  type: 'string', required: false, desc: 'Pre-fill customer email' },
                { name: 'customer_name',   type: 'string', required: false, desc: 'Pre-fill customer name' },
                { name: 'payment_methods', type: 'array',  required: false, desc: 'Methods to allow: ["cc"], ["ach"], or ["cc","ach"] (default).' },
                { name: 'mode',            type: 'string', required: false, desc: '"payment" (default), "subscription", or "installments". See below.' },
                { name: 'recurring',       type: 'object', required: false, desc: 'Required when mode="subscription". { frequency: "weekly"|"monthly"|"quarterly"|"yearly", amount?, start_on?, trial?: boolean }' },
                { name: 'installments',    type: 'object', required: false, desc: 'Required when mode="installments". { count: 2..60, frequency, amount?, start_on? }' },
                { name: 'success_url',     type: 'string', required: true,  desc: 'URL to redirect after successful payment' },
                { name: 'cancel_url',      type: 'string', required: false, desc: 'URL to redirect if customer cancels' },
                { name: 'metadata',        type: 'object', required: false, desc: 'Arbitrary key-value metadata (e.g. proposal_id)' },
                { name: 'expires_in',      type: 'number', required: false, desc: 'Seconds until session expires (default: 3600)' },
              ],
              example: `curl -X POST ${BASE}/api/v1/checkout/sessions \\
  -H "Authorization: Bearer lp_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 49.99,
    "description": "Wedding Venue Deposit",
    "customer_email": "bride@example.com",
    "customer_name": "Jane Smith",
    "payment_methods": ["cc", "ach"],
    "success_url": "https://yourdomain.com/payment/success",
    "cancel_url": "https://yourdomain.com/payment/cancel",
    "metadata": { "proposal_id": "abc123" },
    "expires_in": 3600
  }'`,
              response: `{
  "id": 1,
  "token": "cs_abc...",
  "url": "https://app.lunarpay.com/pay/cs_abc...",
  "status": "open",
  "amount": 49.99,
  "payment_methods": ["cc", "ach"],
  "expires_at": "2026-03-16T19:00:00Z"
}`,
            }} />

            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-900">
              <strong>ACH on hosted checkout:</strong> When <code className="bg-emerald-100 px-1 rounded">&quot;ach&quot;</code> is in <code className="bg-emerald-100 px-1 rounded">payment_methods</code>, the hosted page shows a bank-account tab alongside card. ACH charges return <code className="bg-emerald-100 px-1 rounded">pending</code> and settle via webhook 3–5 business days later. Requires the merchant to have ACH enabled on their Fortis account.
            </div>

            <SubSection id="hosted-checkout-modes" title="Subscriptions and installments in one call">
              <p className="text-sm text-gray-700 mb-3">
                Pass <code className="bg-gray-100 px-1 rounded">mode</code> to have LunarPay automatically create the recurring resource after the first charge succeeds. The customer pays once on the hosted page; LunarPay vaults the card, runs the first charge, and creates the subscription / payment schedule against that saved card. The <code className="bg-gray-100 px-1 rounded">checkout.session.completed</code> webhook delivers the IDs you need.
              </p>
              <Code>{`// Recurring weekly subscription, $30/wk
POST /api/v1/checkout/sessions
{
  "amount": 30.00,
  "description": "StoryVenue Weekly Plan",
  "mode": "subscription",
  "recurring": {
    "frequency": "weekly"
  },
  "customer_email": "owner@storyvenue.com",
  "success_url": "https://storypay.app/billing/done",
  "metadata": { "plan_id": "weekly-30" }
}

// 3-payment installment plan, $200 total
POST /api/v1/checkout/sessions
{
  "amount": 66.67,
  "description": "Proposal #84321 - Payment 1 of 3",
  "mode": "installments",
  "installments": {
    "count": 3,
    "frequency": "monthly"
  },
  "customer_email": "client@example.com",
  "success_url": "https://storypay.app/proposals/84321/done"
}`}</Code>
              <p className="text-xs text-gray-600 mt-3">
                <strong>Defaults:</strong> if you omit <code className="bg-gray-100 px-1 rounded">amount</code> on the recurring/installments object, every period is the same as the first charge. If you omit <code className="bg-gray-100 px-1 rounded">start_on</code>, the next period is one frequency-interval after today.
              </p>
              <Code>{`// Trial subscription: save card, no charge, bill later
POST /api/v1/checkout/sessions
{
  "amount": 15.00,
  "description": "14-day trial - then $15/mo",
  "mode": "subscription",
  "recurring": {
    "frequency": "monthly",
    "trial": true
  },
  "customer_email": "user@example.com",
  "success_url": "https://yourapp.com/welcome"
}
// Response includes "status": "trial_started"
// No money is collected. The subscription's first charge
// runs on start_on (default: 1 frequency period from now).
// Webhook event: checkout.session.completed
//   transaction.amount = 0, transaction.id = ""`}</Code>
            </SubSection>

            <SubSection id="hosted-checkout-redirect" title="Redirect the customer">
              <Code>{`// Redirect, popup, or iframe:
window.location.href = session.url;

// Or open as popup:
window.open(session.url, '_blank', 'width=500,height=700');`}</Code>
            </SubSection>

            <Endpoint ep={{
              method: 'GET', path: '/api/v1/checkout/sessions/:id', key: 'secret',
              desc: 'Check the status of a checkout session. Poll this after the customer is redirected back.',
              params: [{ name: 'id', type: 'number', required: true, desc: 'Session ID' }],
              example: `curl ${BASE}/api/v1/checkout/sessions/1 \\
  -H "Authorization: Bearer lp_sk_..."`,
              response: `{
  "id": 1,
  "status": "completed",
  "amount": 49.99,
  "transaction_id": 789,
  "fortis_transaction_id": "fts_txn_abc123",
  "paid_at": "2026-03-16T18:30:00Z"
}`,
            }} />

            <Endpoint ep={{
              method: 'GET', path: '/api/v1/checkout/sessions', key: 'secret',
              desc: 'List all checkout sessions for your account.',
              params: [
                { name: 'status', type: 'string', required: false, desc: 'Filter by status: open, completed, expired' },
                { name: 'limit',  type: 'number', required: false, desc: 'Per page, max 100 (default: 20)' },
              ],
            }} />

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
              <strong>Important:</strong> After payment, the customer is redirected to your <code className="bg-yellow-100 px-1 rounded">success_url</code> with <code className="bg-yellow-100 px-1 rounded">?session_id=ID</code> appended. Always verify the session status server-side before fulfilling orders.
            </div>
          </Section>

          {/* Payment Intentions */}
          <Section id="intentions" title="Payment Intentions">
            <p className="text-sm text-gray-600 mb-4">
              Use your <span className="font-mono text-purple-600 text-xs">lp_pk_</span> publishable key to create a payment intention from your frontend.
              This returns a <code className="bg-gray-100 px-1 rounded text-xs">clientToken</code> you pass to the Fortis Elements iframe so customers can enter card details directly — without card data ever touching your servers.
            </p>

            <SubSection id="intentions-flow" title="Integration flow">
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside mb-4">
                <li>Your frontend calls <code className="bg-gray-100 px-1 rounded text-xs">POST /api/v1/intentions</code> with the publishable key</li>
                <li>Mount the Fortis Elements iframe using the returned <code className="bg-gray-100 px-1 rounded text-xs">clientToken</code> — always use <code className="bg-gray-100 px-1 rounded text-xs">showSubmitButton: true</code></li>
                <li>Customer enters card — data goes directly browser → Fortis</li>
                <li>Customer clicks the Fortis Pay button; on success Fortis fires <code className="bg-gray-100 px-1 rounded text-xs">ticket_success</code> with a <code className="bg-gray-100 px-1 rounded text-xs">ticket_id</code> — show your loading overlay here</li>
                <li>Send <code className="bg-gray-100 px-1 rounded text-xs">ticket_id</code> to your backend, then call <code className="bg-gray-100 px-1 rounded text-xs">POST /api/v1/customers/:id/payment-methods</code></li>
              </ol>
            </SubSection>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-900 mb-4">
              <strong>Choosing which methods Elements shows:</strong> Use <code className="bg-emerald-100 px-1 rounded text-xs">paymentMethods</code> (array) to declare which tabs the Fortis Elements iframe should expose to your customer.
              <ul className="list-disc list-inside mt-2 space-y-0.5">
                <li><code className="bg-emerald-100 px-1 rounded text-xs">[&quot;cc&quot;]</code> — credit/debit card tab only (suppresses ACH/eCheck)</li>
                <li><code className="bg-emerald-100 px-1 rounded text-xs">[&quot;ach&quot;]</code> — bank account / eCheck tab only (suppresses card)</li>
                <li><code className="bg-emerald-100 px-1 rounded text-xs">[&quot;cc&quot;,&quot;ach&quot;]</code> (default if omitted) — both tabs visible</li>
              </ul>
              The legacy <code className="bg-emerald-100 px-1 rounded text-xs">paymentMethod</code> (singular) shorthand is still supported (<code className="bg-emerald-100 px-1 rounded text-xs">&quot;cc&quot;</code> / <code className="bg-emerald-100 px-1 rounded text-xs">&quot;ach&quot;</code> / <code className="bg-emerald-100 px-1 rounded text-xs">&quot;any&quot;</code>) for backward compatibility. When the customer submits, the Fortis response includes the <code className="bg-emerald-100 px-1 rounded text-xs">payment_method</code> they used — pass that when saving the payment method.
            </div>

            <Endpoint ep={{
              method: 'POST', path: '/api/v1/intentions', key: 'publishable',
              desc: 'Create a Fortis Elements payment intention. Use your publishable key on the frontend.',
              body: [
                { name: 'amount',         type: 'number',  required: false, desc: 'Amount in cents for a one-time charge. Omit if only saving a payment method.' },
                { name: 'hasRecurring',   type: 'boolean', required: false, desc: 'Set true when saving a card/bank for future use or subscriptions (uses ticket intention).' },
                { name: 'paymentMethods', type: 'array',   required: false, desc: 'Array of methods to expose: ["cc"], ["ach"], or ["cc","ach"] (default). Use ["cc"] to hide ACH from Elements.' },
                { name: 'paymentMethod',  type: 'string',  required: false, desc: 'Legacy shorthand: "cc", "ach", or "any" (default). paymentMethods (plural) takes precedence if both are sent.' },
              ],
              example: `// From your frontend — hide ACH, show card only
const res = await fetch("${BASE}/api/v1/intentions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer lp_pk_your_publishable_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amount: 4999,
    paymentMethods: ["cc"]   // ACH tab will not appear in Elements
  })
});

const { clientToken, intentionType, paymentMethod, locationId } = await res.json();
// intentionType: "ticket" (for saving) or "transaction" (one-time)
// paymentMethod: "cc", "ach", or "any" — reflects what the intention was scoped to`,
              response: `{
  "clientToken": "eyJ...",
  "intentionType": "transaction",
  "paymentMethod": "cc",
  "locationId": "loc_abc123",
  "productTransactionId": "pt_cc_xyz",  // set when you pinned a method
  "environment": "sandbox"
}`,
            }} />
          </Section>

          {/* Styling Fortis Elements */}
          <Section id="elements-styling" title="Styling Fortis Elements">
            <p className="text-sm text-gray-600 mb-4">
              When you embed Fortis Elements on your own domain (via the <code className="bg-gray-100 px-1 rounded text-xs">clientToken</code> from <code className="bg-gray-100 px-1 rounded text-xs">POST /api/v1/intentions</code>), the card number, expiry, CVV, and bank account fields are cross-origin iframes hosted by Fortis — you cannot reach them with CSS. Instead, pass an <code className="bg-gray-100 px-1 rounded text-xs">appearance</code> object when creating the element to control colors, fonts, and shape.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              If you use LunarPay's hosted checkout pages (payment links, invoices, <code className="bg-gray-100 px-1 rounded text-xs">/v1/checkout/sessions</code>), these styles are applied automatically based on the merchant's branding settings — no work needed on your side.
            </p>

            <SubSection id="elements-appearance" title="Appearance options">
              <div className="overflow-x-auto">
                <table className="text-xs w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="p-2 border border-gray-200 font-medium">Option</th>
                      <th className="p-2 border border-gray-200 font-medium">Type</th>
                      <th className="p-2 border border-gray-200 font-medium">LunarPay Default</th>
                      <th className="p-2 border border-gray-200 font-medium">What it affects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['colorButtonActionBackground', 'string', 'Merchant primary color', '⭐ Submit / Pay button background — this is the main CTA button color'],
                      ['colorButtonActionText', 'string', 'Merchant button text color', '⭐ Submit / Pay button text color'],
                      ['colorButtonSelectedBackground', 'string', 'Merchant primary color', 'Selected CC/ACH payment method tab background'],
                      ['colorButtonSelectedText', 'string', 'Merchant button text color', 'Text on the selected CC/ACH payment method tab'],
                      ['colorButtonText', 'string', '#4a5568', 'Text on unselected payment method tabs'],
                      ['colorButtonBackground', 'string', '#f7fafc', 'Background of unselected payment method tabs'],
                      ['colorBackground', 'string', '#ffffff', 'Form background'],
                      ['colorFieldBackground', 'string', '', 'Input field background color'],
                      ['colorFieldBorder', 'string', '', 'Input field border color'],
                      ['colorText', 'string', '#1a202c', 'Input text and label color'],
                      ['colorTitleText', 'string', '', 'Section title text color'],
                      ['colorLink', 'string', '', 'Link color'],
                      ['fontFamily', 'string', 'SourceSans', 'Font inside the iframes. Must be one of: Roboto, Montserrat, OpenSans, Raleway, SourceCode, SourceSans'],
                      ['fontSize', 'string', '16px', 'Text size'],
                      ['borderRadius', 'string', '8px', 'Corner rounding on inputs and container'],
                      ['borderWidth', 'string', '', 'Input field border width'],
                    ].map(([opt, type, def, desc], i) => (
                      <tr key={i} className="odd:bg-white even:bg-gray-50">
                        <td className="p-2 border border-gray-200 font-mono">{opt}</td>
                        <td className="p-2 border border-gray-200">{type}</td>
                        <td className="p-2 border border-gray-200">{def}</td>
                        <td className="p-2 border border-gray-200">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubSection>

            <SubSection id="elements-config-options" title="Configuration options">
              <div className="overflow-x-auto">
                <table className="text-xs w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="p-2 border border-gray-200 font-medium">Option</th>
                      <th className="p-2 border border-gray-200 font-medium">Default</th>
                      <th className="p-2 border border-gray-200 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['container', 'required', 'CSS selector for the mount div (e.g. "#payment-form")'],
                      ['theme', '"default"', 'Fortis theme preset'],
                      ['environment', '"sandbox"', '"sandbox" or "production" — must match the clientToken'],
                      ['view', '"default"', 'Layout style'],
                      ['language', '"en-us"', 'Language for labels and validation messages'],
                      ['defaultCountry', '"US"', 'Default country for phone/address fields'],
                      ['floatingLabels', 'true', 'Labels animate above inputs on focus'],
                      ['showSubmitButton', 'true', 'Always keep true — form.submit() is a no-op when false. Use ticket_success to detect submission and overlay your own loading UI.'],
                      ['showValidationAnimation', 'true', 'Red/green borders on field validation'],
                      ['hideTotal', 'false', 'Hide the amount display above the form'],
                      ['hideAgreementCheckbox', 'false', 'Hide the terms agreement checkbox'],
                      ['showReceipt', 'false', 'Show a receipt after successful payment'],
                    ].map(([opt, def, desc], i) => (
                      <tr key={i} className="odd:bg-white even:bg-gray-50">
                        <td className="p-2 border border-gray-200 font-mono">{opt}</td>
                        <td className="p-2 border border-gray-200 font-mono">{def}</td>
                        <td className="p-2 border border-gray-200">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubSection>

            <SubSection id="elements-styling-example" title="Full example">
              <Code>{`// 1. Create a client token from your backend
const intention = await fetch("/api/v1/intentions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer lp_pk_...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ amount: 4999, paymentMethods: ["cc", "ach"] })
});
const { clientToken } = await intention.json();

// 2. Load the Fortis SDK
const script = document.createElement("script");
script.src = "https://js.fortis.tech/commercejs-v1.0.0.min.js";
// Use sandbox URL for testing:
// script.src = "https://js.sandbox.fortis.tech/commercejs-v1.0.0.min.js";
document.head.appendChild(script);

// 3. Create the payment form with your brand colors
//    Leave showSubmitButton: true — Fortis renders the Pay button.
//    form.submit() is a no-op when showSubmitButton is false, so do NOT
//    use a custom button to trigger submission.
const elements = Commerce.elements(clientToken, { environment: "production" });
elements.create({
  container: "#payment-form",
  theme: "default",
  environment: "production",
  view: "default",
  language: "en-us",
  defaultCountry: "US",
  floatingLabels: true,
  showSubmitButton: true,         // Fortis button submits the form — required
  showValidationAnimation: true,
  hideTotal: true,
  hideAgreementCheckbox: true,
  appearance: {
    colorButtonActionBackground: "#your-brand-color", // Pay button background
    colorButtonActionText: "#ffffff",                  // Pay button text
    colorButtonSelectedBackground: "#your-brand-color",
    colorButtonSelectedText: "#ffffff",
    colorButtonText: "#4a5568",
    colorButtonBackground: "#f7fafc",
    colorBackground: "#ffffff",
    colorText: "#1a202c",
    fontFamily: "SourceSans",   // exact SDK value — "Source Sans Pro" is NOT valid
    fontSize: "16px",
    borderRadius: "8px",
  },
});

// 4. When the customer clicks Pay, Fortis validates and fires ticket_success.
//    Show your own processing overlay here, then call your backend.
elements.eventBus.on("ticket_success", async (payload) => {
  // Show a loading overlay while the server processes
  document.getElementById("processing-overlay").style.display = "flex";

  try {
    const res = await fetch("/api/your-charge-endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: payload }),
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = "/success";
    } else {
      showError(data.error || "Payment failed");
    }
  } catch (err) {
    showError("Network error — please try again");
  } finally {
    document.getElementById("processing-overlay").style.display = "none";
  }
});

elements.eventBus.on("error", (err) => {
  console.error("Payment error:", err.message);
});`}</Code>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <strong>Important — do not use a custom submit button:</strong> <code className="bg-amber-100 px-1 rounded">form.submit()</code> is a no-op when <code className="bg-amber-100 px-1 rounded">showSubmitButton: false</code>.
                Always keep <code className="bg-amber-100 px-1 rounded">showSubmitButton: true</code> so Fortis renders its own Pay button.
                To show a loading state, display an overlay <em>after</em> <code className="bg-amber-100 px-1 rounded">ticket_success</code> fires — your server call runs at that point, not before.
              </div>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
                <strong>Styling note:</strong> The <code className="bg-blue-100 px-1 rounded">appearance</code> object is the only way to style the card fields — they are cross-origin iframes. CSS on your page cannot reach them. If you use LunarPay hosted checkout (<code className="bg-blue-100 px-1 rounded">/v1/checkout/sessions</code>), styling is applied automatically.
              </div>
            </SubSection>
          </Section>

          {/* Payment Schedules */}
          <Section id="schedules" title="Payment Schedules">
            <p className="text-sm text-gray-600 mb-6">
              Schedule multiple payments with specific amounts and dates for a customer. Each payment is automatically charged on its due date via the LunarPay daily cron.
            </p>

            <Endpoint ep={{
              method: 'POST', path: '/api/v1/payment-schedules', key: 'secret',
              desc: 'Create a payment schedule with one or more dated payments.',
              body: [
                { name: 'customerId',      type: 'number', required: true,  desc: 'Customer ID' },
                { name: 'paymentMethodId', type: 'number', required: true,  desc: 'Payment method to charge' },
                { name: 'description',     type: 'string', required: false, desc: 'Schedule description' },
                { name: 'payments',        type: 'array',  required: true,  desc: 'Array of { amount (cents), date (YYYY-MM-DD) }. Up to 100.' },
              ],
              example: `curl -X POST ${BASE}/api/v1/payment-schedules \\
  -H "Authorization: Bearer lp_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": 42,
    "paymentMethodId": 7,
    "description": "3-part payment plan",
    "payments": [
      { "amount": 50000, "date": "2026-04-01" },
      { "amount": 30000, "date": "2026-05-15" },
      { "amount": 20000, "date": "2026-06-30" }
    ]
  }'`,
              response: `{
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
}`,
            }} />

            <Endpoint ep={{
              method: 'GET', path: '/api/v1/payment-schedules', key: 'secret',
              desc: 'List all payment schedules. Filter by status.',
              params: [
                { name: 'status', type: 'string', required: false, desc: 'active | completed | cancelled' },
              ],
            }} />

            <Endpoint ep={{
              method: 'GET', path: '/api/v1/payment-schedules/:id', key: 'secret',
              desc: 'Get full schedule details including all individual payments and their statuses.',
              params: [{ name: 'id', type: 'number', required: true, desc: 'Schedule ID' }],
            }} />

            <Endpoint ep={{
              method: 'DELETE', path: '/api/v1/payment-schedules/:id', key: 'secret',
              desc: 'Cancel a payment schedule. Remaining pending payments will not be charged.',
              params: [{ name: 'id', type: 'number', required: true, desc: 'Schedule ID' }],
            }} />

            <div className="text-xs text-gray-500 mt-4 space-y-1">
              <p>Schedule statuses: <code className="bg-gray-100 px-1 rounded">active</code> → <code className="bg-gray-100 px-1 rounded">completed</code> | <code className="bg-gray-100 px-1 rounded">cancelled</code></p>
              <p>Payment statuses: <code className="bg-gray-100 px-1 rounded">pending</code> → <code className="bg-gray-100 px-1 rounded">paid</code> | <code className="bg-gray-100 px-1 rounded">failed</code> | <code className="bg-gray-100 px-1 rounded">cancelled</code></p>
            </div>
          </Section>

          {/* Onboarding */}
          <Section id="onboarding" title="Onboarding">
            <p className="text-sm text-gray-600 mb-6">
              Check your merchant account&apos;s onboarding status and access the Fortis MPA application form.
            </p>

            <Endpoint ep={{
              method: 'GET', path: '/api/v1/onboarding/status', key: 'secret',
              desc: 'Get your merchant onboarding status. Poll this to check if Fortis has approved your account.',
              example: `curl ${BASE}/api/v1/onboarding/status \\
  -H "Authorization: Bearer lp_sk_..."`,
              response: `{
  "organizationId": 42,
  "organizationName": "Acme Corp",
  "status": "ACTIVE",
  "isActive": true,
  "stepCompleted": 2,
  "mpaLink": "https://...",
  "mpaEmbedUrl": "https://app.lunarpay.com/onboarding/abc123",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-02T00:00:00.000Z"
}`,
            }} />

            <div className="text-xs text-gray-500 mt-2 mb-6 space-y-1">
              <p>Status values: <code className="bg-gray-100 px-1 rounded">PENDING</code> → <code className="bg-gray-100 px-1 rounded">BANK_INFORMATION_SENT</code> → <code className="bg-gray-100 px-1 rounded">PENDING_REVIEW</code> → <code className="bg-gray-100 px-1 rounded">ACTIVE</code></p>
              <p><code className="bg-gray-100 px-1 rounded">isActive: true</code> means the merchant can process payments.</p>
            </div>

            <SubSection id="onboarding-mpa" title="MPA Embed Page">
              <p className="text-sm text-gray-600 mb-3">
                The Fortis Merchant Processing Agreement form must be served from <code className="bg-gray-100 px-1 rounded text-xs">app.lunarpay.com</code> (iframe domain restriction). Use the <code className="bg-gray-100 px-1 rounded text-xs">mpaEmbedUrl</code> from the status endpoint, or construct it directly:
              </p>
              <Code>{`https://app.lunarpay.com/onboarding/{org_token}`}</Code>
            </SubSection>

            <SubSection id="onboarding-mpa-api" title="MPA Embed API (Public)">
              <p className="text-sm text-gray-600 mb-3">
                No authentication required — the org token acts as the identifier.
              </p>
              <Code>{`GET ${BASE}/api/onboarding/mpa-embed?token={org_token}

// Response:
{
  "status": "BANK_INFORMATION_SENT",
  "mpaLink": "https://fortis.example.com/...",
  "organizationName": "Acme Corp",
  "organizationLogo": "..."
}`}</Code>
            </SubSection>
          </Section>

          {/* Agency API */}
          <Section id="agency" title="Agency API">
            <p className="text-sm text-gray-600 mb-4">
              Agency keys (<code className="bg-gray-100 px-1 rounded text-xs font-mono">lp_agency_...</code>) let you register and onboard merchants programmatically.
              Each merchant gets their own <code className="bg-gray-100 px-1 rounded text-xs font-mono">lp_sk_</code> / <code className="bg-gray-100 px-1 rounded text-xs font-mono">lp_pk_</code> keys for payment processing.
            </p>

            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl text-sm text-cyan-800 mb-6">
              <strong>Agency keys are different from merchant keys.</strong> Use <code className="bg-cyan-100 px-1 rounded text-xs">Authorization: Bearer lp_agency_...</code> for all agency endpoints. Merchant keys are returned when you register a merchant.
            </div>

            <SubSection id="agency-register" title="1. Register a Merchant">
              <Code>{`POST ${BASE}/api/v1/agency/merchants
Authorization: Bearer lp_agency_your_key
Content-Type: application/json

{
  "email": "venue@example.com",
  "password": "securepass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-0100",
  "businessName": "Doe Wedding Venue"
}

// Response:
{
  "data": {
    "merchantId": 123,
    "publishableKey": "lp_pk_...",
    "secretKey": "lp_sk_...",
    "orgToken": "abc123..."
  }
}`}</Code>
            </SubSection>

            <SubSection id="agency-onboard" title="2. Submit Onboarding to Fortis">
              <Code>{`POST ${BASE}/api/v1/agency/merchants/:id/onboard
Authorization: Bearer lp_agency_your_key
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-0100",
  "email": "venue@example.com",
  "dbaName": "Doe Wedding Venue",
  "legalName": "Doe Venues LLC",
  "addressLine1": "123 Main St",
  "city": "Austin",
  "state": "TX",
  "postalCode": "78701",
  "routingNumber": "021000021",
  "accountNumber": "123456789",
  "accountHolderName": "John Doe",
  "ccMonthlyVolumeRange": 3,
  "ccAverageTicketRange": 2,
  "ccHighTicket": 5000,
  "ecMonthlyVolumeRange": 2,
  "ecAverageTicketRange": 1,
  "ecHighTicket": 3000
}

// Response includes mpaEmbedUrl — redirect the merchant there
// to complete the Fortis MPA form.`}</Code>
              <div className="mt-4 overflow-x-auto">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Volume Range Values</p>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 w-20">Range</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200">Monthly Volume</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200">Average Ticket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ['1', 'Up to $5,000', 'Up to $15'],
                      ['2', '$5,001 – $10,000', '$16 – $25'],
                      ['3', '$10,001 – $25,000', '$26 – $50'],
                      ['4', '$25,001 – $50,000', '$51 – $100'],
                      ['5', '$50,001 – $100,000', '$101 – $200'],
                      ['6', '$100,001 – $250,000', '$201 – $500'],
                      ['7', '$250,001+', '$500+'],
                    ].map(([range, vol, avg]) => (
                      <tr key={range} className="hover:bg-gray-50">
                        <td className="px-3 py-2 border border-gray-200"><code className="text-xs font-mono font-semibold text-gray-800">{range}</code></td>
                        <td className="px-3 py-2 border border-gray-200 text-xs text-gray-600">{vol}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs text-gray-600">{avg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-2">High ticket fields (<code className="bg-gray-100 px-1 rounded">ccHighTicket</code>, <code className="bg-gray-100 px-1 rounded">ecHighTicket</code>) are dollar amounts (1–30,000).</p>
              </div>
            </SubSection>

            <SubSection id="agency-status" title="3. Check Status / Get Keys">
              <Code>{`GET ${BASE}/api/v1/agency/merchants/:id
Authorization: Bearer lp_agency_your_key

// Returns merchant details, API keys, and onboarding status`}</Code>
            </SubSection>

            <SubSection id="agency-list" title="List All Merchants">
              <Code>{`GET ${BASE}/api/v1/agency/merchants
Authorization: Bearer lp_agency_your_key

// Returns all merchants registered under your agency`}</Code>
            </SubSection>

            <SubSection id="agency-webhooks" title="4. Configure Webhooks">
              <p className="text-sm text-gray-600 mb-3">
                Register a webhook to be notified when a merchant&apos;s Fortis application is approved or denied.
              </p>
              <Code>{`PUT ${BASE}/api/v1/agency/webhook
Authorization: Bearer lp_agency_your_key
Content-Type: application/json

{
  "webhookUrl": "https://yourdomain.com/webhooks/lunarpay"
}

// Response — save the secret for signature verification:
{
  "data": {
    "webhookUrl": "https://yourdomain.com/webhooks/lunarpay",
    "webhookSecret": "whsec_abc123..."
  }
}`}</Code>
            </SubSection>

            <SubSection id="agency-webhook-payload" title="Webhook Events">
              <p className="text-sm text-gray-700 mb-2"><strong>merchant.approved / merchant.denied</strong></p>
              <Code>{`// POST to your webhook URL
{
  "event": "merchant.approved",   // or "merchant.denied"
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
  "keys": {                        // only on merchant.approved
    "publishableKey": "lp_pk_...",
    "secretKey": "lp_sk_..."
  },
  "timestamp": "2026-03-21T20:00:00.000Z"
}`}</Code>

              <p className="text-sm text-gray-700 mt-4 mb-2"><strong>checkout.session.completed</strong></p>
              <p className="text-xs text-gray-600 mb-2">
                Fires when any of your merchants&apos; hosted checkout sessions completes successfully. Use <code className="bg-gray-100 px-1 rounded">customer.id</code> + <code className="bg-gray-100 px-1 rounded">payment_method.id</code> to make follow-up <code className="bg-gray-100 px-1 rounded">/v1/subscriptions</code> or <code className="bg-gray-100 px-1 rounded">/v1/payment-schedules</code> calls. If the session was created with <code className="bg-gray-100 px-1 rounded">mode</code>, the <code className="bg-gray-100 px-1 rounded">resources</code> object tells you what was already created for you.
              </p>
              <Code>{`{
  "event": "checkout.session.completed",
  "session": {
    "id": 39, "token": "cs_abc...",
    "amount": 30.00, "currency": "USD",
    "description": "StoryVenue Weekly Plan",
    "customer_email": "owner@storyvenue.com",
    "customer_name": "Jane Smith",
    "metadata": { "plan_id": "weekly-30" },
    "mode": "subscription",
    "paid_at": "2026-04-30T14:22:00.000Z"
  },
  "merchant": {
    "id": 41, "organizationId": 124,
    "businessName": "StoryVenue"
  },
  "transaction": {
    "id": "667",
    "fortis_transaction_id": "fts_txn_...",
    "amount": 30.00, "payment_method": "cc"
  },
  "customer": { "id": 241, "email": "owner@storyvenue.com" },
  "payment_method": { "id": 243, "type": "cc", "last4": "5089" },
  "resources": {
    "subscription_id": 87,           // populated when mode="subscription"
    "payment_schedule_id": null      // populated when mode="installments"
  },
  "timestamp": "2026-04-30T14:22:00.123Z"
}`}</Code>
            </SubSection>

            <SubSection id="agency-verify-signature" title="Verifying Webhook Signatures">
              <p className="text-sm text-gray-600 mb-3">
                Every webhook includes an <code className="bg-gray-100 px-1 rounded text-xs">X-LunarPay-Signature</code> header. Verify it with your webhook secret:
              </p>
              <Code>{`const crypto = require('crypto');
const expected = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex');

if (expected !== req.headers['x-lunarpay-signature']) {
  return res.status(401).send('Invalid signature');
}`}</Code>
            </SubSection>

            <SubSection id="agency-manage-webhook" title="Manage Webhook">
              <Code>{`// Get current webhook config
GET ${BASE}/api/v1/agency/webhook
Authorization: Bearer lp_agency_your_key

// Remove webhook
DELETE ${BASE}/api/v1/agency/webhook
Authorization: Bearer lp_agency_your_key`}</Code>
            </SubSection>

            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700">
              <strong>Full flow:</strong> Register merchant → Submit onboarding → Merchant completes MPA form → Fortis approves (24–48h) → <strong>Webhook fires</strong> → <code className="bg-gray-100 px-1 rounded">isActive: true</code> → Merchant can process payments with their own keys.
            </div>
          </Section>

          {/* Endpoint Quick Reference */}
          <Section id="reference" title="Endpoint Quick Reference">
            <p className="text-sm text-gray-600 mb-4">Base URL: <code className="bg-gray-100 px-1 rounded">{BASE}</code></p>
            <div className="space-y-1">
              {[
                { method: 'POST', path: '/api/v1/customers', desc: 'Create or upsert a customer', auth: 'secret' },
                { method: 'GET',  path: '/api/v1/customers', desc: 'List customers', auth: 'secret' },
                { method: 'PUT',  path: '/api/v1/customers/:id', desc: 'Update a customer', auth: 'secret' },
                { method: 'POST', path: '/api/v1/customers/:id/payment-methods', desc: 'Save a payment method (CC or ACH)', auth: 'secret' },
                { method: 'GET',  path: '/api/v1/customers/:id/payment-methods', desc: 'List payment methods', auth: 'secret' },
                { method: 'DELETE', path: '/api/v1/customers/:id/payment-methods/:pmId', desc: 'Remove a payment method', auth: 'secret' },
                { method: 'POST', path: '/api/v1/charges', desc: 'Charge a saved payment method (CC or ACH) — capture: false for auth-only hold', auth: 'secret' },
                { method: 'POST', path: '/api/v1/charges/:id/capture', desc: 'Capture (settle) an authorized hold, full or partial', auth: 'secret' },
                { method: 'POST', path: '/api/v1/charges/:id/void', desc: 'Void an authorization hold or unsettled sale', auth: 'secret' },
                { method: 'POST', path: '/api/v1/charges/:id/refund', desc: 'Refund a settled charge', auth: 'secret' },
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
                { method: 'GET',  path: '/api/onboarding/mpa-embed?token=:token', desc: 'Get Fortis MPA embed link', auth: 'public' },
                { method: 'POST', path: '/api/v1/agency/merchants', desc: 'Register a new merchant', auth: 'agency' },
                { method: 'GET',  path: '/api/v1/agency/merchants', desc: 'List agency merchants', auth: 'agency' },
                { method: 'GET',  path: '/api/v1/agency/merchants/:id', desc: 'Get merchant details + keys', auth: 'agency' },
                { method: 'POST', path: '/api/v1/agency/merchants/:id/onboard', desc: 'Submit merchant onboarding', auth: 'agency' },
                { method: 'GET',  path: '/api/v1/agency/webhook', desc: 'Get webhook configuration', auth: 'agency' },
                { method: 'PUT',  path: '/api/v1/agency/webhook', desc: 'Set or update webhook URL', auth: 'agency' },
                { method: 'DELETE', path: '/api/v1/agency/webhook', desc: 'Remove webhook', auth: 'agency' },
              ].map((ep, i) => {
                const mc: Record<string, string> = {
                  GET: 'text-green-600 bg-green-50', POST: 'text-blue-600 bg-blue-50',
                  PUT: 'text-yellow-600 bg-yellow-50', PATCH: 'text-yellow-600 bg-yellow-50',
                  DELETE: 'text-red-600 bg-red-50',
                };
                const ac: Record<string, { bg: string; label: string }> = {
                  secret: { bg: 'bg-orange-50 text-orange-600', label: 'lp_sk_' },
                  publishable: { bg: 'bg-purple-50 text-purple-600', label: 'lp_pk_' },
                  agency: { bg: 'bg-cyan-50 text-cyan-600', label: 'lp_agency_' },
                  public: { bg: 'bg-green-50 text-green-600', label: 'public' },
                };
                const a = ac[ep.auth] ?? ac.secret;
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${mc[ep.method] ?? ''}`}>{ep.method}</span>
                    <code className="text-xs font-mono text-gray-800 flex-1">{ep.path}</code>
                    <span className="text-xs text-gray-500 hidden sm:block flex-1">{ep.desc}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${a.bg}`}>{a.label}</span>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Footer note */}
          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-sm text-gray-500">
              Questions? Contact us at{' '}
              <a href="mailto:support@lunarpay.com" className="text-blue-600 hover:underline">support@lunarpay.com</a>
              {' '}or{' '}
              <Link href="/register" className="text-blue-600 hover:underline">sign up</Link> to get your API keys.
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
