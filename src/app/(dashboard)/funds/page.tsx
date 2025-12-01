'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Fund {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  organization: {
    id: number;
    name: string;
  };
}

export default function FundsPage() {
  const router = useRouter();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunds();
  }, []);

  const fetchFunds = async () => {
    try {
      const response = await fetch('/api/funds');
      if (response.ok) {
        const data = await response.json();
        setFunds(data.funds || []);
      }
    } catch (error) {
      console.error('Failed to fetch funds:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading funds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Funds</h1>
          <p className="mt-2 text-gray-600">
            Manage donation funds and categories
          </p>
        </div>
        <Button onClick={() => router.push('/funds/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Fund
        </Button>
      </div>

      {funds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No funds yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Create your first fund to categorize donations
            </p>
            <Button onClick={() => router.push('/funds/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Fund
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funds.map((fund) => (
            <Card key={fund.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/funds/${fund.id}`)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{fund.name}</CardTitle>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    fund.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {fund.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {fund.description && (
                  <p className="text-sm text-gray-600 mb-3">{fund.description}</p>
                )}
                <p className="text-xs text-gray-500">{fund.organization.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
