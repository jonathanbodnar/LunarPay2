'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Link as LinkIcon, Check } from 'lucide-react';

export default function CustomerPortalPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    portalEnabled: true,
    customDomain: '',
    allowSelfService: true,
    allowPaymentMethodUpdate: true,
    allowInvoiceDownload: true,
    allowSubscriptionCancel: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // TODO: Implement save API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Customer Portal</h1>
        <p className="mt-1 text-muted-foreground">
          Configure the self-service portal for your customers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Portal Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Enable Customer Portal</p>
                <p className="text-xs text-muted-foreground">Allow customers to access their portal</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, portalEnabled: !formData.portalEnabled })}
                className={`w-11 h-6 rounded-full transition-colors ${formData.portalEnabled ? 'bg-foreground' : 'bg-muted'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-background shadow-sm transform transition-transform ${formData.portalEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Domain</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={formData.customDomain}
                    onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                    placeholder="portal.yourdomain.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Point your domain's CNAME to portal.lunarpay.com
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Customer Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'allowSelfService', label: 'Self-service access', desc: 'Customers can log in and view their data' },
              { key: 'allowPaymentMethodUpdate', label: 'Update payment methods', desc: 'Customers can add/remove cards' },
              { key: 'allowInvoiceDownload', label: 'Download invoices', desc: 'Customers can download PDF invoices' },
              { key: 'allowSubscriptionCancel', label: 'Cancel subscriptions', desc: 'Customers can cancel their subscriptions' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, [item.key]: !(formData as any)[item.key] })}
                  className={`w-11 h-6 rounded-full transition-colors ${(formData as any)[item.key] ? 'bg-foreground' : 'bg-muted'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-background shadow-sm transform transition-transform ${(formData as any)[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? 'Saving...' : saved ? <><Check className="h-4 w-4" /> Saved!</> : 'Save Settings'}
        </Button>
      </form>
    </div>
  );
}

