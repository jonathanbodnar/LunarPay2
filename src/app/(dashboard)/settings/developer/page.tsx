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

      {/* Full Documentation Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code className="h-4 w-4" /> API Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Full API reference, quick-start guide, code examples, and endpoint documentation for customers, charges, subscriptions, hosted checkout, payment schedules, onboarding, and the agency API.
          </p>
          <a
            href="/developers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            View API Documentation →
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
