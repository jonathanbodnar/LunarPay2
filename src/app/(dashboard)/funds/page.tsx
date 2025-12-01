'use client';

import { FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function FundsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Funds</h1>
        <p className="mt-2 text-gray-600">
          Manage donation funds and categories
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Funds</h3>
          <p className="text-gray-500 text-center">
            Fund management coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

