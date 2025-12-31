'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Link2, 
  CheckCircle, 
  XCircle, 
  Download, 
  Upload, 
  Loader2,
  ExternalLink,
  RefreshCw,
  Building2,
  CreditCard,
  MessageSquare,
  Zap
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

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIntegrations();
    
    // Check if we just connected
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

  const isConnected = (connectorId: string) => {
    return connections.some(c => c.serviceId === connectorId);
  };

  const getConnection = (connectorId: string) => {
    return connections.find(c => c.serviceId === connectorId);
  };

  // Other integrations (non-Apideck)
  const otherIntegrations = [
    { 
      id: 'stripe', 
      name: 'Stripe', 
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Import customers, products, and subscriptions from Stripe',
      category: 'payments'
    },
    { 
      id: 'slack', 
      name: 'Slack', 
      icon: <MessageSquare className="h-6 w-6" />,
      description: 'Get real-time notifications for transactions in Slack',
      category: 'notifications'
    },
    { 
      id: 'zapier', 
      name: 'Zapier', 
      icon: <Zap className="h-6 w-6" />,
      description: 'Connect with 5000+ apps through Zapier webhooks',
      category: 'automation'
    },
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
          Connect your accounting software and favorite tools
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
        </div>
      )}

      {/* Connected Integrations */}
      {connections.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Connected
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
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleSync(connection.serviceId, 'sync-customers')}
                      disabled={syncing === connection.serviceId}
                    >
                      {syncing === connection.serviceId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" />
                          Export
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map((connector) => {
            const connected = isConnected(connector.id);
            return (
              <Card 
                key={connector.id} 
                className={connected ? 'border-green-200 bg-green-50/30' : ''}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 border flex items-center justify-center text-lg">
                        📊
                      </div>
                      <div>
                        <h3 className="font-medium">{connector.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {connected ? (
                            <span className="text-green-600">Connected</span>
                          ) : (
                            'Not connected'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    {connected ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleSync(connector.id, 'import-customers')}
                          disabled={syncing === connector.id}
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${syncing === connector.id ? 'animate-spin' : ''}`} />
                          Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const conn = getConnection(connector.id);
                            if (conn) handleDisconnect(conn.serviceId, connector.name);
                          }}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleConnect(connector.id)}
                        disabled={connecting === connector.id}
                      >
                        {connecting === connector.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Link2 className="h-4 w-4 mr-2" />
                        )}
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Other Integrations */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Other Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherIntegrations.map((integration) => (
            <Card key={integration.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 border flex items-center justify-center">
                    {integration.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{integration.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
