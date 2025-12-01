'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    dueDate: '',
    memo: '',
    footer: '',
    paymentOptions: 'both',
    coverFee: false,
  });

  const [lineItems, setLineItems] = useState<Array<{
    id?: number;
    productName: string;
    qty: number;
    price: number;
  }>>([]);

  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const inv = data.invoice;
        setInvoice(inv);
        setFormData({
          dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
          memo: inv.memo || '',
          footer: inv.footer || '',
          paymentOptions: inv.paymentOptions || 'both',
          coverFee: inv.coverFee || false,
        });
        setLineItems(inv.products.map((p: any) => ({
          id: p.id,
          productName: p.productName,
          qty: p.qty,
          price: Number(p.price),
        })));
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { productName: '', qty: 1, price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          products: lineItems,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        router.push(`/invoices/${params.id}`);
      } else {
        alert('Failed to update invoice');
      }
    } catch (error) {
      alert('Error updating invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Options</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-gray-300"
                  value={formData.paymentOptions}
                  onChange={(e) => setFormData({ ...formData, paymentOptions: e.target.value })}
                >
                  <option value="both">Credit Card & ACH</option>
                  <option value="cc">Credit Card Only</option>
                  <option value="ach">ACH Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Memo / Notes</label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-gray-300"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Footer</label>
              <textarea
                className="w-full min-h-[60px] px-3 py-2 rounded-md border border-gray-300"
                value={formData.footer}
                onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="coverFee"
                checked={formData.coverFee}
                onChange={(e) => setFormData({ ...formData, coverFee: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="coverFee" className="text-sm font-medium">
                Ask customer to cover processing fee
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <label className="text-xs text-gray-500">Description *</label>
                    <Input
                      value={item.productName}
                      onChange={(e) => updateLineItem(index, 'productName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Qty *</label>
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateLineItem(index, 'qty', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs text-gray-500">Price *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price}
                      onChange={(e) => updateLineItem(index, 'price', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="col-span-1 text-right">
                    <label className="text-xs text-gray-500">Total</label>
                    <p className="font-medium">${(item.qty * item.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
