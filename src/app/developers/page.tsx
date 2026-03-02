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
  { id: 'customers',       label: 'Customers' },
  { id: 'payment-methods', label: 'Payment Methods' },
  { id: 'charges',         label: 'Charges' },
  { id: 'refunds',         label: 'Refunds' },
  { id: 'subscriptions',   label: 'Subscriptions' },
  { id: 'intentions',      label: 'Payment Intentions' },
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
              <strong>How card saving works:</strong> You never pass raw card numbers to the LunarPay API. Instead, use the Fortis Elements iframe (via a payment intention) to collect card data directly in the customer&apos;s browser. Fortis returns a <code className="bg-blue-100 px-1 rounded text-xs">ticket_id</code> — pass that to this endpoint to vault the card and get back a reusable <code className="bg-blue-100 px-1 rounded text-xs">paymentMethodId</code>.
            </div>

            <Endpoint ep={{
              method: 'POST', path: '/api/v1/customers/:id/payment-methods', key: 'secret',
              desc: 'Save a payment method for a customer using a ticket_id returned by Fortis Elements.',
              params: [{ name: 'id', type: 'number', required: true, desc: 'Customer ID' }],
              body: [
                { name: 'ticketId',   type: 'string',  required: true,  desc: 'ticket_id from Fortis Elements callback' },
                { name: 'nameHolder', type: 'string',  required: false, desc: 'Name on card' },
                { name: 'setDefault', type: 'boolean', required: false, desc: 'Set as default payment method (default: false)' },
              ],
              example: `curl -X POST ${BASE}/api/v1/customers/123/payment-methods \\
  -H "Authorization: Bearer lp_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "ticketId": "ticket_fts_abc123",
    "nameHolder": "Jane Smith",
    "setDefault": true
  }'`,
              response: `{
  "data": {
    "id": 456,
    "sourceType": "cc",
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
              Charge a saved payment method. The customer must have at least one saved payment method. All amounts are in <strong>cents</strong>.
            </p>

            <Endpoint ep={{
              method: 'POST', path: '/api/v1/charges', key: 'secret',
              desc: 'Charge a customer\'s saved payment method.',
              body: [
                { name: 'customerId',      type: 'number', required: true,  desc: 'Customer ID to charge' },
                { name: 'paymentMethodId', type: 'number', required: true,  desc: 'Payment method ID to charge' },
                { name: 'amount',          type: 'number', required: true,  desc: 'Amount in cents (e.g. 4999 = $49.99). Minimum 50.' },
                { name: 'description',     type: 'string', required: false, desc: 'Optional description shown on the transaction' },
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
    "status": "paid",
    "customerId": 123,
    "paymentMethodId": 456,
    "fortisTransactionId": "fts_txn_abc123",
    "description": "Pro plan — monthly",
    "createdAt": "2026-02-10T12:00:00.000Z"
  }
}`,
            }} />
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

          {/* Payment Intentions */}
          <Section id="intentions" title="Payment Intentions">
            <p className="text-sm text-gray-600 mb-4">
              Use your <span className="font-mono text-purple-600 text-xs">lp_pk_</span> publishable key to create a payment intention from your frontend.
              This returns a <code className="bg-gray-100 px-1 rounded text-xs">clientToken</code> you pass to the Fortis Elements iframe so customers can enter card details directly — without card data ever touching your servers.
            </p>

            <SubSection id="intentions-flow" title="Integration flow">
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside mb-4">
                <li>Your frontend calls <code className="bg-gray-100 px-1 rounded text-xs">POST /api/v1/intentions</code> with the publishable key</li>
                <li>Mount the Fortis Elements iframe using the returned <code className="bg-gray-100 px-1 rounded text-xs">clientToken</code></li>
                <li>Customer enters card — data goes directly browser → Fortis</li>
                <li>Fortis returns a <code className="bg-gray-100 px-1 rounded text-xs">ticket_id</code> to your frontend callback</li>
                <li>Send <code className="bg-gray-100 px-1 rounded text-xs">ticket_id</code> to your backend, then call <code className="bg-gray-100 px-1 rounded text-xs">POST /api/v1/customers/:id/payment-methods</code></li>
              </ol>
            </SubSection>

            <Endpoint ep={{
              method: 'POST', path: '/api/v1/intentions', key: 'publishable',
              desc: 'Create a Fortis Elements payment intention. Use your publishable key on the frontend.',
              body: [
                { name: 'amount',       type: 'number',  required: false, desc: 'Amount in cents for a one-time charge. Omit if only saving a card.' },
                { name: 'hasRecurring', type: 'boolean', required: false, desc: 'Set true when saving a card for future use or subscriptions (uses ticket intention).' },
              ],
              example: `// From your frontend
const res = await fetch("${BASE}/api/v1/intentions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer lp_pk_your_publishable_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    hasRecurring: true   // saving a card
  })
});

const { clientToken, intentionType, locationId } = await res.json();
// intentionType: "ticket" (for saving) or "transaction" (one-time)`,
              response: `{
  "clientToken": "eyJ...",
  "intentionType": "ticket",
  "locationId": "loc_abc123",
  "environment": "sandbox"
}`,
            }} />
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
