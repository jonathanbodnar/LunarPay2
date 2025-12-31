'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { CustomerSelect } from '@/components/forms/CustomerSelect';
import { ProductSelect } from '@/components/forms/ProductSelect';

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    organizationId: '',
    donorId: '',
    dueDate: '',
    memo: '',
    footer: '',
    paymentOptions: 'both',
    coverFee: false,
    showPostPurchaseLink: false,
    postPurchaseUrl: '',
  });

  const [lineItems, setLineItems] = useState<Array<{productId: number | null, productName: string, qty: number, price: number}>>([
    { productId: null, productName: '', qty: 1, price: 0 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const orgsRes = await fetch('/api/organizations');
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        setOrganizations(orgsData.organizations || []);
        if (orgsData.organizations?.length > 0) {
          setFormData(prev => ({ ...prev, organizationId: orgsData.organizations[0].id.toString() }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { productId: null, productName: '', qty: 1, price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleProductSelect = (index: number, product: { id: number; name: string; price: number }) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      productId: product.id,
      productName: product.name,
      price: product.price,
    };
    setLineItems(updated);
  };

  const calculateTotal = () => {
    let total = lineItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
    if (formData.coverFee && total > 0) {
      // Estimate fee (simplified - should match server calculation)
      const feePercentage = 0.029; // 2.9%
      const feeFixed = 0.30;
      const estimatedFee = (total * feePercentage) + feeFixed;
      total += estimatedFee;
    }
    return total;
  };

  const handleSubmit = async (e: React.FormEvent, sendNow: boolean = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: parseInt(formData.organizationId),
          donorId: parseInt(formData.donorId),
          dueDate: formData.dueDate || null,
          memo: formData.memo,
          footer: formData.footer,
          paymentOptions: formData.paymentOptions,
          coverFee: formData.coverFee,
          postPurchaseUrl: formData.showPostPurchaseLink ? formData.postPurchaseUrl : null,
          sendNow,
          products: lineItems.filter(item => item.productName && item.price > 0),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/invoices/${data.invoice.id}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create invoice');
      }
    } catch (error) {
      alert('Error creating invoice');
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
          <h1 className="text-2xl font-semibold">Create Invoice</h1>
          <p className="mt-1 text-muted-foreground">Create a new invoice for a customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization *</label>
                <select
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background"
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
                <label className="text-sm font-medium">Customer *</label>
                {formData.organizationId ? (
                  <CustomerSelect
                    organizationId={formData.organizationId}
                    value={formData.donorId}
                    onChange={(value) => setFormData({ ...formData, donorId: value })}
                    required
                  />
                ) : (
                  <div className="h-10 px-3 rounded-lg border border-border bg-muted flex items-center text-muted-foreground text-sm">
                    Select an organization first
                  </div>
                )}
              </div>
            </div>

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
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background"
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
                className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-border bg-background text-sm"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="Add internal notes..."
              />
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
                    <label className="text-xs text-muted-foreground">Product/Description *</label>
                    {formData.organizationId ? (
                      <ProductSelect
                        organizationId={formData.organizationId}
                        value={item.productId}
                        onSelect={(product) => handleProductSelect(index, product)}
                      />
                    ) : (
                      <div className="h-10 px-3 rounded-lg border border-border bg-muted flex items-center text-muted-foreground text-sm">
                        Select organization
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Quantity *</label>
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateLineItem(index, 'qty', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs text-muted-foreground">Price *</label>
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
                    <label className="text-xs text-muted-foreground invisible">Del</label>
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
                    <label className="text-xs text-muted-foreground">Total</label>
                    <p className="font-medium">${(item.qty * item.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="coverFee"
                    checked={formData.coverFee}
                    onChange={(e) => setFormData({ ...formData, coverFee: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="coverFee" className="text-sm">
                    Let customer cover transaction fee
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPostPurchaseLink"
                    checked={formData.showPostPurchaseLink}
                    onChange={(e) => setFormData({ ...formData, showPostPurchaseLink: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="showPostPurchaseLink" className="text-sm">
                    Add post-purchase redirect link
                  </label>
                </div>
                
                {formData.showPostPurchaseLink && (
                  <div className="ml-6">
                    <Input
                      type="url"
                      placeholder="https://example.com/thank-you"
                      value={formData.postPurchaseUrl}
                      onChange={(e) => setFormData({ ...formData, postPurchaseUrl: e.target.value })}
                    />
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3">
                  <span className="text-lg font-semibold">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold">
                      ${calculateTotal().toFixed(2)}
                    </span>
                    {formData.coverFee && (
                      <p className="text-xs text-muted-foreground">Includes transaction fee</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            variant="outline"
            disabled={loading || !formData.donorId}
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading || !formData.donorId || lineItems.every(item => !item.productName)}
          >
            {loading ? 'Sending...' : 'Save & Send'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

