'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link2, CheckCircle, XCircle, Download, Upload } from 'lucide-react';

interface Integration {
  name: string;
  connected: boolean;
  lastSync?: string;
  icon: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    { name: 'Stripe', connected: false, icon: '💳' },
    { name: 'QuickBooks', connected: false, icon: '📊' },
    { name: 'FreshBooks', connected: false, icon: '📘' },
    { name: 'Planning Center', connected: false, icon: '⛪' },
    { name: 'Slack', connected: false, icon: '💬' },
    { name: 'Zapier', connected: false, icon: '⚡' },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || integrations);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    }
  };

  const handleConnect = async (integrationName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/${integrationName.toLowerCase()}/connect`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        } else {
          fetchIntegrations();
        }
      } else {
        alert(`Failed to connect to ${integrationName}`);
      }
    } catch (error) {
      alert(`Error connecting to ${integrationName}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (integrationName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${integrationName}?`)) return;

    try {
      const response = await fetch(`/api/integrations/${integrationName.toLowerCase()}/disconnect`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        fetchIntegrations();
      } else {
        alert(`Failed to disconnect from ${integrationName}`);
      }
    } catch (error) {
      alert(`Error disconnecting from ${integrationName}`);
    }
  };

  const handleSync = async (integrationName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/${integrationName.toLowerCase()}/sync`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        alert(`${integrationName} sync completed successfully`);
        fetchIntegrations();
      } else {
        alert(`Failed to sync ${integrationName}`);
      }
    } catch (error) {
      alert(`Error syncing ${integrationName}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-2 text-gray-600">
          Connect with your favorite tools and services
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-3xl">{integration.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    {integration.name}
                    {integration.connected ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  {integration.connected && integration.lastSync && (
                    <p className="text-xs text-gray-500 font-normal mt-1">
                      Last synced: {new Date(integration.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {integration.name === 'Stripe' && (
                <p className="text-sm text-gray-600">
                  Import customers, products, and invoices from Stripe
                </p>
              )}
              {integration.name === 'QuickBooks' && (
                <p className="text-sm text-gray-600">
                  Export transactions and invoices to QuickBooks for accounting
                </p>
              )}
              {integration.name === 'FreshBooks' && (
                <p className="text-sm text-gray-600">
                  Sync invoices and customers with FreshBooks
                </p>
              )}
              {integration.name === 'Planning Center' && (
                <p className="text-sm text-gray-600">
                  Sync people and export giving data to Planning Center
                </p>
              )}
              {integration.name === 'Slack' && (
                <p className="text-sm text-gray-600">
                  Get real-time notifications for transactions in Slack
                </p>
              )}
              {integration.name === 'Zapier' && (
                <p className="text-sm text-gray-600">
                  Connect with 1000+ apps through Zapier webhooks
                </p>
              )}

              {integration.connected ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleSync(integration.name)}
                    disabled={loading}
                  >
                    {integration.name === 'Stripe' && <Download className="h-4 w-4 mr-2" />}
                    {integration.name === 'QuickBooks' && <Upload className="h-4 w-4 mr-2" />}
                    {integration.name === 'Stripe' ? 'Import' : 'Sync'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDisconnect(integration.name)}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleConnect(integration.name)}
                  disabled={loading}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect {integration.name}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


