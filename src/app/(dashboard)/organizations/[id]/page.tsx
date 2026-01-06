'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, ExternalLink, RefreshCw, Clock } from 'lucide-react';

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchOrganization();
    }
  }, [params.id]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/organizations/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!organization) {
    return <div>Organization not found</div>;
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
            <p className="mt-2 text-gray-600">{organization.website || 'No website'}</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/organizations/${organization.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Legal Name</p>
                <p className="font-medium">{organization.legalName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{organization.phoneNumber || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{organization.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Website</p>
                <p className="font-medium">{organization.website || '-'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">
                {organization.streetAddress || '-'}
                {organization.city && `, ${organization.city}`}
                {organization.state && `, ${organization.state}`}
                {organization.postal && ` ${organization.postal}`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Processing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Status</p>
              {getStatusBadge(organization.fortisOnboarding?.appStatus)}
            </div>

            {organization.fortisOnboarding?.appStatus === 'BANK_INFORMATION_SENT' && (
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Can take up to 24-48 hours</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={refreshStatus}
                  disabled={refreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Checking...' : 'Refresh Status'}
                </Button>
              </div>
            )}

            {organization.fortisOnboarding?.appStatus === 'PENDING' && (
              <Button
                className="w-full"
                onClick={() => router.push('/getting-started')}
              >
                Complete Setup
              </Button>
            )}

            {organization.fortisOnboarding?.appStatus === 'ACTIVE' && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm text-green-800">
                  ✓ Ready to accept payments
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-blue-600">{organization._count?.invoices || 0}</p>
              <p className="text-sm text-gray-500">Invoices</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{organization._count?.donors || 0}</p>
              <p className="text-sm text-gray-500">Customers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{organization._count?.funds || 0}</p>
              <p className="text-sm text-gray-500">Funds</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Funds</CardTitle>
          </CardHeader>
          <CardContent>
            {organization.funds && organization.funds.length > 0 ? (
              <div className="space-y-2">
                {organization.funds.map((fund: any) => (
                  <div key={fund.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{fund.name}</p>
                      {fund.description && <p className="text-sm text-gray-500">{fund.description}</p>}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${fund.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {fund.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No funds yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

