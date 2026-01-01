'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Globe, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  slug: string | null;
  portalSlug: string | null;
  portalEnabled: boolean;
  portalCustomDomain: string | null;
  portalTitle: string | null;
  portalDescription: string | null;
}

function CopyableValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-left hover:bg-background/50 px-1 -mx-1 rounded transition-colors group flex items-center gap-1"
      title="Click to copy"
    >
      <span className="text-muted-foreground">{label}:</span>{' '}
      <span className="text-foreground">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50" />
      )}
    </button>
  );
}

function DnsInstructions({ domain }: { domain: string }) {
  const subdomain = domain.split('.')[0];
  // For development, use Railway directly. For production, this should be portal.lunarpay.com
  const cnameTarget = 'lunarpay2-development.up.railway.app';
  
  return (
    <div className="text-xs text-muted-foreground space-y-3 mt-3">
      <p className="font-medium text-foreground">Setup Instructions:</p>
      
      <div className="bg-muted p-3 rounded space-y-2">
        <p className="font-medium text-foreground text-xs">Step 1: Add CNAME record to your DNS</p>
        <div className="font-mono text-xs space-y-1">
          <CopyableValue label="Type" value="CNAME" />
          <CopyableValue label="Name" value={subdomain} />
          <CopyableValue label="Value" value={cnameTarget} />
        </div>
      </div>

      <div className="bg-muted p-3 rounded space-y-2">
        <p className="font-medium text-foreground text-xs">Step 2: Add custom domain in Railway</p>
        <p className="text-xs">
          Go to your Railway dashboard → Settings → Custom Domains → Add <code className="bg-background px-1 rounded">{domain}</code>
        </p>
      </div>

      <p className="text-amber-600">
        ⚠️ SSL certificate will be automatically provisioned by Railway after both steps are complete.
      </p>
    </div>
  );
}

export default function CustomerPortalSettingsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    portalSlug: '',
    portalEnabled: false,
    portalCustomDomain: '',
    portalTitle: '',
    portalDescription: '',
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
        if (data.organizations?.length > 0) {
          selectOrganization(data.organizations[0]);
        }
      }
    } catch (err) {
      console.error('Fetch organizations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectOrganization = (org: Organization) => {
    setSelectedOrg(org);
    setFormData({
      portalSlug: org.portalSlug || org.slug || '',
      portalEnabled: org.portalEnabled || false,
      portalCustomDomain: org.portalCustomDomain || '',
      portalTitle: org.portalTitle || '',
      portalDescription: org.portalDescription || '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/organizations/${selectedOrg.id}/portal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Portal settings saved successfully!');
        
        // Update the organization in the list
        setOrganizations(prev => prev.map(org => 
          org.id === selectedOrg.id ? { ...org, ...data.organization } : org
        ));
        setSelectedOrg(prev => prev ? { ...prev, ...data.organization } : prev);
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        if (data.details && Array.isArray(data.details)) {
          // Handle Zod validation errors
          const messages = data.details.map((d: { message: string; path?: string[] }) => 
            d.path ? `${d.path.join('.')}: ${d.message}` : d.message
          ).join(', ');
          setError(messages || data.error || 'Failed to save portal settings');
        } else {
          setError(data.error || 'Failed to save portal settings');
        }
      }
    } catch (err) {
      setError('Error saving portal settings');
    } finally {
      setSaving(false);
    }
  };

  const getPortalUrl = () => {
    if (formData.portalCustomDomain) {
      return `https://${formData.portalCustomDomain}`;
    }
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/portal/${formData.portalSlug}`;
  };

  const copyPortalUrl = () => {
    navigator.clipboard.writeText(getPortalUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <h1 className="text-2xl font-semibold">Customer Portal</h1>
        <p className="mt-1 text-muted-foreground">
          Configure a self-service portal where your customers can manage their payment methods, 
          view subscriptions, and make purchases.
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
              if (org) selectOrganization(org);
            }}
          >
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          <Check className="h-5 w-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Portal Status
            </CardTitle>
            <CardDescription>Enable or disable the customer portal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Customer Portal</p>
                <p className="text-sm text-muted-foreground">
                  Allow customers to sign in and manage their account
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.portalEnabled}
                  onChange={(e) => setFormData({ ...formData, portalEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Portal URL
            </CardTitle>
            <CardDescription>Configure your portal link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Portal Slug</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.portalSlug}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    portalSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                  })}
                  placeholder="your-company"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your portal will be available at: {getPortalUrl()}
              </p>
            </div>

            {formData.portalSlug && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-mono flex-1 truncate">{getPortalUrl()}</span>
                <Button type="button" variant="ghost" size="sm" onClick={copyPortalUrl}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => window.open(getPortalUrl(), '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label>Custom Domain (Optional)</Label>
              <Input
                value={formData.portalCustomDomain}
                onChange={(e) => setFormData({ ...formData, portalCustomDomain: e.target.value })}
                placeholder="pay.yourcompany.com"
              />
              {formData.portalCustomDomain ? (
                <DnsInstructions domain={formData.portalCustomDomain} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Use your own domain for the customer portal (e.g., pay.yourcompany.com)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Portal Customization</CardTitle>
            <CardDescription>Customize the portal appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Portal Title</Label>
              <Input
                value={formData.portalTitle}
                onChange={(e) => setFormData({ ...formData, portalTitle: e.target.value })}
                placeholder="Customer Portal"
              />
            </div>

            <div className="space-y-2">
              <Label>Welcome Message</Label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-border bg-background text-sm"
                value={formData.portalDescription}
                onChange={(e) => setFormData({ ...formData, portalDescription: e.target.value })}
                placeholder="Welcome to our customer portal. Sign in to manage your account."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
