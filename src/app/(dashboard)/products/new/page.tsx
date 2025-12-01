'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    organizationId: '',
    name: '',
    description: '',
    price: '',
    qty: '',
    isSubscription: false,
    subscriptionInterval: 'monthly',
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
        if (data.organizations?.length > 0) {
          setFormData(prev => ({ ...prev, organizationId: data.organizations[0].id.toString() }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: parseInt(formData.organizationId),
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          qty: formData.qty ? parseInt(formData.qty) : null,
          isSubscription: formData.isSubscription,
          subscriptionInterval: formData.isSubscription ? formData.subscriptionInterval : null,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/products');
      } else {
        alert('Failed to create product');
      }
    } catch (error) {
      alert('Error creating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
          <p className="mt-2 text-gray-600">Add a new product to your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization *</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-gray-300"
                value={formData.organizationId}
                onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                required
              >
                <option value="">Select organization...</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Product Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Conference Ticket"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-gray-300"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity (blank = unlimited)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isSubscription"
                  checked={formData.isSubscription}
                  onChange={(e) => setFormData({ ...formData, isSubscription: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="isSubscription" className="text-sm font-medium">
                  This is a subscription product
                </label>
              </div>

              {formData.isSubscription && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Billing Frequency</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-gray-300"
                    value={formData.subscriptionInterval}
                    onChange={(e) => setFormData({ ...formData, subscriptionInterval: e.target.value })}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

