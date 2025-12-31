'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Link2, 
  CheckCircle, 
  XCircle, 
  Download, 
  Loader2,
  ExternalLink,
  RefreshCw,
  Building2,
  CreditCard,
  Zap,
  ArrowRight,
  Bell,
  FileText,
  Users,
  Receipt,
  AlertTriangle,
  Key,
  X
} from 'lucide-react';

interface Connector {
  id: string;
  name: string;
  icon: string;
  category: string;
}

interface Connection {
  id: string;
  serviceId: string;
  name: string;
  icon?: string;
}

interface ZapierWebhook {
  id: number;
  triggerType: string;
  webhookUrl: string;
  isActive: boolean;
}

interface StripeStatus {
  connected: boolean;
  lastSync: string | null;
  stats: {
    lastImport?: {
      customers: { imported: number; skipped: number };
      products: { imported: number; skipped: number };
      subscriptions: { imported: number; skipped: number };
      invoices: { imported: number; skipped: number };
      payments: { imported: number; skipped: number };
    };
  } | null;
}

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [zapierWebhooks, setZapierWebhooks] = useState<ZapierWebhook[]>([]);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus>({ connected: false, lastSync: null, stats: null });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Stripe connect modal
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeApiKey, setStripeApiKey] = useState('');

  useEffect(() => {
    fetchIntegrations();
    fetchZapierInfo();
    fetchStripeStatus();
    
    if (searchParams.get('connected') === 'true') {
      setSuccess('Integration connected successfully!');
      setTimeout(() => setSuccess(''), 5000);
    }
  }, [searchParams]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations/apideck', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConnectors(data.connectors || []);
        setConnections(data.connections || []);
      }
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchZapierInfo = async () => {
    try {
      const response = await fetch('/api/integrations/zapier', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setZapierWebhooks(data.webhooks || []);
      }
    } catch (err) {
      console.error('Failed to fetch Zapier info:', err);
    }
  };

  const fetchStripeStatus = async () => {
    try {
      const response = await fetch('/api/integrations/stripe', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch Stripe status:', err);
    }
  };

  const handleConnect = async (connectorId?: string) => {
    setConnecting(connectorId || 'all');
    setError('');
    
    try {
      const response = await fetch('/api/integrations/apideck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectorId }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sessionUrl) {
          window.location.href = data.sessionUrl;
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to start connection');
      }
    } catch (err) {
      setError('Error connecting integration');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (serviceId: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect ${name}?`)) return;

    try {
      const response = await fetch(`/api/integrations/apideck?serviceId=${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess(`${name} disconnected successfully`);
        setTimeout(() => setSuccess(''), 3000);
        fetchIntegrations();
      } else {
        setError('Failed to disconnect integration');
      }
    } catch (err) {
      setError('Error disconnecting integration');
    }
  };

  const handleSync = async (serviceId: string, action: string) => {
    setSyncing(serviceId);
    setError('');
    
    try {
      const response = await fetch('/api/integrations/apideck/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, action }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (action === 'import-customers') {
          setSuccess(`Imported ${data.imported} customers (${data.skipped} already existed)`);
        } else if (action === 'sync-customers') {
          setSuccess(`Synced ${data.synced} of ${data.total} customers`);
        } else {
          setSuccess('Sync completed successfully');
        }
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError('Sync failed');
      }
    } catch (err) {
      setError('Error syncing data');
    } finally {
      setSyncing(null);
    }
  };

  const handleStripeConnect = async () => {
    if (!stripeApiKey.startsWith('sk_')) {
      setError('Please enter a valid Stripe secret key (starts with sk_)');
      return;
    }

    setConnecting('stripe');
    setError('');

    try {
      const response = await fetch('/api/integrations/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: stripeApiKey }),
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess('Stripe connected successfully! You can now import your data.');
        setShowStripeModal(false);
        setStripeApiKey('');
        fetchStripeStatus();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to connect Stripe');
      }
    } catch (err) {
      setError('Error connecting Stripe');
    } finally {
      setConnecting(null);
    }
  };

  const handleStripeDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Stripe?')) return;

    try {
      const response = await fetch('/api/integrations/stripe', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess('Stripe disconnected');
        fetchStripeStatus();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to disconnect Stripe');
      }
    } catch (err) {
      setError('Error disconnecting Stripe');
    }
  };

  const handleStripeSync = async () => {
    setSyncing('stripe');
    setError('');

    try {
      const response = await fetch('/api/integrations/stripe/sync', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const { summary } = data;
        setSuccess(
          `Import complete: ${summary.customers.imported} customers, ` +
          `${summary.products.imported} products, ` +
          `${summary.subscriptions.imported} subscriptions, ` +
          `${summary.invoices.imported} invoices, ` +
          `${summary.payments.imported} payments`
        );
        fetchStripeStatus();
        setTimeout(() => setSuccess(''), 8000);
      } else {
        const data = await response.json();
        setError(data.error || 'Import failed');
      }
    } catch (err) {
      setError('Error importing from Stripe');
    } finally {
      setSyncing(null);
    }
  };

  const isConnected = (connectorId: string) => {
    return connections.some(c => c.serviceId === connectorId);
  };

  // Zapier triggers info
  const zapierTriggers = [
    { icon: <Users className="h-4 w-4" />, name: 'New Customer' },
    { icon: <FileText className="h-4 w-4" />, name: 'New Invoice' },
    { icon: <Receipt className="h-4 w-4" />, name: 'New Transaction' },
    { icon: <RefreshCw className="h-4 w-4" />, name: 'New Subscription' },
    { icon: <AlertTriangle className="h-4 w-4" />, name: 'Payment Failed' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="mt-1 text-muted-foreground">
          Import from Stripe, connect accounting software, or automate with Zapier
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stripe Import */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Import from Stripe
        </h2>
        <Card className={stripeStatus.connected ? 'border-green-200 bg-green-50/30' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#635BFF] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">Stripe</h3>
                  {stripeStatus.connected && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Connected</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Import your customers, products, subscriptions, invoices, and payment history from Stripe
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded">Customers</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">Products</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">Subscriptions</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">Invoices</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">Payments</span>
                </div>
                {stripeStatus.lastSync && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last imported: {new Date(stripeStatus.lastSync).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {stripeStatus.connected ? (
                  <>
                    <Button
                      onClick={handleStripeSync}
                      disabled={syncing === 'stripe'}
                    >
                      {syncing === 'stripe' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {syncing === 'stripe' ? 'Importing...' : 'Import Data'}
                    </Button>
                    <Button variant="outline" onClick={handleStripeDisconnect}>
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setShowStripeModal(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    Connect Stripe
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Connect Modal */}
      {showStripeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Connect Stripe</h3>
              <button onClick={() => setShowStripeModal(false)}>
                <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your Stripe secret API key to import your data. You can find this in your{' '}
              <a 
                href="https://dashboard.stripe.com/apikeys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Stripe Dashboard → Developers → API keys
              </a>
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Secret Key</label>
                <Input
                  type="password"
                  placeholder="sk_live_..."
                  value={stripeApiKey}
                  onChange={(e) => setStripeApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use your live secret key (starts with sk_live_) to import real data
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleStripeConnect}
                  disabled={connecting === 'stripe' || !stripeApiKey}
                >
                  {connecting === 'stripe' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Connect
                </Button>
                <Button variant="outline" onClick={() => setShowStripeModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected Integrations */}
      {connections.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Connected Accounting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((connection) => (
              <Card key={connection.id} className="border-green-200 bg-green-50/30">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{connection.name}</h3>
                        <p className="text-xs text-green-600">Connected</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleSync(connection.serviceId, 'import-customers')}
                      disabled={syncing === connection.serviceId}
                    >
                      {syncing === connection.serviceId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          Import
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect(connection.serviceId, connection.name)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Accounting Integrations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Accounting Software
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleConnect()}
            disabled={connecting !== null}
          >
            {connecting === 'all' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Connect Any
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {connectors.map((connector) => {
            const connected = isConnected(connector.id);
            return (
              <Card 
                key={connector.id} 
                className={`cursor-pointer transition-all hover:border-primary/50 ${connected ? 'border-green-200 bg-green-50/30' : ''}`}
                onClick={() => !connected && handleConnect(connector.id)}
              >
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 border flex items-center justify-center text-lg">
                      📊
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{connector.name}</h3>
                      {connected ? (
                        <p className="text-xs text-green-600">Connected</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Click to connect</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Zapier Integration */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          Automation
        </h2>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center">
                  <Zap className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Zapier Integration</h3>
                  <p className="text-orange-100 text-sm">Connect LunarPay to 5,000+ apps</p>
                </div>
              </div>
              <p className="text-orange-50 text-sm mb-4">
                Automate your workflows by connecting LunarPay to your favorite apps. 
                Trigger actions when events happen, or push data into LunarPay from other tools.
              </p>
              <Button 
                className="bg-white text-orange-600 hover:bg-orange-50"
                onClick={() => window.open('https://zapier.com/apps/webhook/integrations', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Set Up Zap
              </Button>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Triggers (LunarPay → Other Apps)
                  </h4>
                  <div className="space-y-2">
                    {zapierTriggers.map((trigger, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        {trigger.icon}
                        <span>{trigger.name}</span>
                        <ArrowRight className="h-3 w-3 ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Actions (Other Apps → LunarPay)
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Create Customer</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Create Invoice</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Receipt className="h-4 w-4" />
                      <span>Create Product</span>
                    </div>
                  </div>
                </div>
              </div>
              {zapierWebhooks.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-3">Active Zaps</h4>
                  <div className="space-y-2">
                    {zapierWebhooks.map((webhook) => (
                      <div key={webhook.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="capitalize">{webhook.triggerType.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{webhook.webhookUrl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  );
}
