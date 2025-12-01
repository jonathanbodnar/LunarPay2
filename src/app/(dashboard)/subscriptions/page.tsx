'use client';

import { Repeat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <p className="mt-2 text-gray-600">
          Manage recurring payments
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Repeat className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Subscriptions</h3>
          <p className="text-gray-500 text-center">
            Subscription management coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

