'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { QuantitySelect } from '@/components/forms/QuantitySelect';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    organizationId: '',
    name: '',
    description: '',
    price: '',
    qty: null as number | null,
    qtyUnlimited: true,
    recurrence: 'one_time', // one_time, periodically, custom
    billingPeriod: 'monthly', // daily, weekly, monthly, quarterly, yearly
    customSchedule: [] as Array<{ date: string; amount: string }>,
    showOnPortal: false,
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

  const addCustomScheduleItem = () => {
    setFormData({
      ...formData,
      customSchedule: [...formData.customSchedule, { date: '', amount: '' }],
    });
  };

  const removeCustomScheduleItem = (index: number) => {
    setFormData({
      ...formData,
      customSchedule: formData.customSchedule.filter((_, i) => i !== index),
    });
  };

  const updateCustomScheduleItem = (index: number, field: string, value: string) => {
    const updated = [...formData.customSchedule];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, customSchedule: updated });
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
          qty: formData.qtyUnlimited ? null : formData.qty,
          isSubscription: formData.recurrence !== 'one_time',
          subscriptionInterval: formData.recurrence === 'periodically' ? formData.billingPeriod : null,
          recurrence: formData.recurrence,
          customSchedule: formData.recurrence === 'custom' ? formData.customSchedule : null,
          showOnPortal: formData.showOnPortal,
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
                <label className="text-sm font-medium">Inventory</label>
                <QuantitySelect
                  value={formData.qty}
                  isUnlimited={formData.qtyUnlimited}
                  onChange={(val, isUnlimited) => setFormData({ 
                    ...formData, 
                    qty: val, 
                    qtyUnlimited: isUnlimited 
                  })}
                  showUnlimited={true}
                />
                <p className="text-xs text-muted-foreground">
                  Set inventory quantity or select unlimited for no limit.
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recurrence Type</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-gray-300"
                  value={formData.recurrence}
                  onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                >
                  <option value="one_time">One Time</option>
                  <option value="periodically">Periodically (Subscription)</option>
                  <option value="custom">Custom Schedule</option>
                </select>
              </div>

              {formData.recurrence === 'periodically' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Billing Frequency</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-gray-300"
                    value={formData.billingPeriod}
                    onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly (Every 3 Months)</option>
                    <option value="semiannual">Semi-Annual (Every 6 Months)</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}

              {formData.recurrence === 'custom' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Payment Schedule</label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addCustomScheduleItem}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Date
                    </Button>
                  </div>
                  {formData.customSchedule.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <Input
                          type="date"
                          value={item.date}
                          onChange={(e) => updateCustomScheduleItem(index, 'date', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={(e) => updateCustomScheduleItem(index, 'amount', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomScheduleItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {formData.customSchedule.length > 0 && (
                    <div className="text-sm text-gray-500">
                      Total:{' '}
                      ${formData.customSchedule.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show on Customer Portal</p>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to purchase this product from their portal
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.showOnPortal}
                      onChange={(e) => setFormData({ ...formData, showOnPortal: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <label className="text-sm font-medium">Digital Content Delivery (PDF)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    id="digitalContent"
                  />
                  <label htmlFor="digitalContent" className="cursor-pointer text-sm text-gray-600">
                    Click to upload PDF file (optional)
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    This file will be delivered to customers after purchase
                  </p>
                </div>
              </div>
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

