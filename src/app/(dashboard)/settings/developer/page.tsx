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
    { method: 'POST', path: '/api/v1/intentions', desc: 'Create a payment intention (Elements)', auth: 'publishable' },
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
                <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${ep.auth === 'secret' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                  {ep.auth === 'secret' ? 'lp_sk_' : 'lp_pk_'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
