'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, ExternalLink, RefreshCw, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Organization {
  id: number;
  name: string;
  slug: string | null;
  phoneNumber: string | null;
  website: string | null;
  fortisOnboarding?: {
    appStatus: string | null;
    mpaLink: string | null;
  };
  _count: {
    invoices: number;
    donors: number;
    funds: number;
  };
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshingId, setRefreshingId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(data.error || 'Failed to fetch organizations');
      }

      setOrganizations(data.organizations);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async (orgId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshingId(orgId);
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      if (response.ok) {
        setOrganizations(data.organizations);
      }
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setRefreshingId(null);
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status || status === 'PENDING') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending Setup</span>;
    }
    if (status === 'BANK_INFORMATION_SENT') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Application Submitted</span>;
    }
    if (status === 'ACTIVE') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="mt-2 text-gray-600">
            Manage your organizations and payment settings
          </p>
        </div>
        <Button onClick={() => router.push('/organizations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Get started by creating your first organization
            </p>
            <Button onClick={() => router.push('/organizations/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/organizations/${org.id}`)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{org.name}</CardTitle>
                  {getStatusBadge(org.fortisOnboarding?.appStatus)}
                </div>
                <CardDescription>
                  {org.website || 'No website'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{org._count.donors}</p>
                      <p className="text-xs text-gray-500">Customers</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{org._count.invoices}</p>
                      <p className="text-xs text-gray-500">Invoices</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{org._count.funds}</p>
                      <p className="text-xs text-gray-500">Funds</p>
                    </div>
                  </div>

                  {org.fortisOnboarding?.appStatus === 'BANK_INFORMATION_SENT' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Can take up to 24-48 hours</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => refreshStatus(org.id, e)}
                        disabled={refreshingId === org.id}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshingId === org.id ? 'animate-spin' : ''}`} />
                        {refreshingId === org.id ? 'Checking...' : 'Refresh Status'}
                      </Button>
                    </div>
                  )}

                  {org.fortisOnboarding?.appStatus === 'PENDING' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/getting-started');
                      }}
                    >
                      Complete Setup
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

