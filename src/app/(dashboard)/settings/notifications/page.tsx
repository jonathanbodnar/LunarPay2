'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Check } from 'lucide-react';

export default function NotificationsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    // Email notifications
    emailPaymentReceived: true,
    emailPaymentFailed: true,
    emailInvoicePaid: true,
    emailNewCustomer: true,
    emailSubscriptionCreated: true,
    emailSubscriptionCanceled: true,
    emailWeeklyDigest: false,
    // SMS notifications
    smsPaymentReceived: false,
    smsPaymentFailed: true,
    smsHighValuePayment: true,
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

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-foreground' : 'bg-muted'}`}
    >
      <div className={`w-5 h-5 rounded-full bg-background shadow-sm transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="mt-1 text-muted-foreground">
          Manage how you receive notifications about your account activity
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'emailPaymentReceived', label: 'Payment received', desc: 'When a payment is successfully processed' },
              { key: 'emailPaymentFailed', label: 'Payment failed', desc: 'When a payment attempt fails' },
              { key: 'emailInvoicePaid', label: 'Invoice paid', desc: 'When an invoice is marked as paid' },
              { key: 'emailNewCustomer', label: 'New customer', desc: 'When a new customer is added' },
              { key: 'emailSubscriptionCreated', label: 'Subscription created', desc: 'When a new subscription starts' },
              { key: 'emailSubscriptionCanceled', label: 'Subscription canceled', desc: 'When a subscription is canceled' },
              { key: 'emailWeeklyDigest', label: 'Weekly digest', desc: 'Summary of your weekly activity' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle
                  checked={(settings as any)[item.key]}
                  onChange={() => setSettings({ ...settings, [item.key]: !(settings as any)[item.key] })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'smsPaymentReceived', label: 'Payment received', desc: 'Get a text when payment is received' },
              { key: 'smsPaymentFailed', label: 'Payment failed', desc: 'Get a text when payment fails' },
              { key: 'smsHighValuePayment', label: 'High-value payments', desc: 'Get a text for payments over $1,000' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle
                  checked={(settings as any)[item.key]}
                  onChange={() => setSettings({ ...settings, [item.key]: !(settings as any)[item.key] })}
                />
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

