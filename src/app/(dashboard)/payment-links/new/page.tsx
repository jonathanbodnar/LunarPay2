'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Webhook, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { ProductSelect } from '@/components/forms/ProductSelect';
import { QuantitySelect } from '@/components/forms/QuantitySelect';

export default function NewPaymentLinkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    organizationId: '',
    name: '',
    description: '',
    paymentMethods: 'both',
    status: 'active',
    webhookUrl: '',
  });

  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: number | null;
    productName: string;
    qty: number;
    price: number;
    unlimitedQty: boolean;
  }>>([
    { productId: null, productName: '', qty: 1, price: 0, unlimitedQty: false }
  ]);

  const [webhookExpanded, setWebhookExpanded] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const orgsRes = await fetch('/api/organizations');
      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setOrganizations(data.organizations || []);
        if (data.organizations?.length > 0) {
          setFormData(prev => ({ ...prev, organizationId: data.organizations[0].id.toString() }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, {
      productId: null,
      productName: '',
      qty: 1,
      price: 0,
      unlimitedQty: false,
    }]);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedProducts(updated);
  };

  const handleProductSelect = (index: number, product: { id: number; name: string; price: number }) => {
    const updated = [...selectedProducts];
    updated[index] = {
      ...updated[index],
      productId: product.id,
      productName: product.name,
      price: Number(product.price),
    };
    setSelectedProducts(updated);
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, item) => sum + (item.qty * item.price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0 || selectedProducts.every(p => !p.productId)) {
      alert('Please add at least one product to the payment link');
      return;
    }

    if (!formData.organizationId) {
      alert('Please select an organization');
      return;
    }

    if (!formData.name.trim()) {
      alert('Please enter a name for the payment link');
      return;
    }
    
    setLoading(true);

    try {
      const payload = {
        organizationId: parseInt(formData.organizationId),
        name: formData.name,
        description: formData.description || undefined,
        paymentMethods: formData.paymentMethods,
        status: formData.status,
        webhookUrl: formData.webhookUrl || undefined,
        products: selectedProducts
          .filter(p => p.productId !== null)
          .map(p => ({
            productId: p.productId!,
            qty: p.unlimitedQty ? null : (p.qty || 1),
            unlimitedQty: p.unlimitedQty,
          })),
      };

      console.log('Creating payment link:', payload);

      const response = await fetch('/api/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/payment-links`);
      } else {
        console.error('Payment link creation failed:', data);
        alert(data.error || data.details?.map((d: any) => d.message).join(', ') || 'Failed to create payment link');
      }
    } catch (error) {
      console.error('Payment link error:', error);
      alert('Error creating payment link: ' + (error as Error).message);
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
          <h1 className="text-2xl font-semibold">Create Payment Link</h1>
          <p className="mt-1 text-muted-foreground">Create a shareable payment collection page</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Payment Link Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <label className="text-sm font-medium">Link Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Event Registration"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-border bg-background text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this payment link is for..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Methods</label>
                <select
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                  value={formData.paymentMethods}
                  onChange={(e) => setFormData({ ...formData, paymentMethods: e.target.value })}
                >
                  <option value="both">Credit Card & ACH</option>
                  <option value="cc">Credit Card Only</option>
                  <option value="ach">ACH Only</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Products *</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedProducts.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <label className="text-xs text-muted-foreground">Product *</label>
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
                  <div className="col-span-3">
                    <QuantitySelect
                      label="Quantity"
                      value={item.qty}
                      isUnlimited={item.unlimitedQty}
                      onChange={(val, isUnlimited) => {
                        updateProduct(index, 'qty', val || 1);
                        updateProduct(index, 'unlimitedQty', isUnlimited);
                      }}
                      showUnlimited={true}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs text-muted-foreground">Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price}
                      onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      disabled={selectedProducts.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Integration - Collapsible */}
        <Card>
          <CardHeader 
            className="cursor-pointer select-none"
            onClick={() => setWebhookExpanded(!webhookExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-medium">Webhook Integration</CardTitle>
                <span className="text-xs text-muted-foreground">(optional)</span>
              </div>
              {webhookExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {webhookExpanded && (
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook URL</label>
                <Input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder="https://your-server.com/webhook"
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll send a POST request with customer and payment data to this URL after each successful payment.
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Webhook Payload Example
                </p>
                <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`{
  "event": "payment.completed",
  "payment_link_id": 123,
  "payment_link_name": "Event Registration",
  "customer": {
    "email": "john@example.com",
    "name": "John Doe"
  },
  "payment": {
    "amount": 50.00,
    "currency": "USD",
    "method": "card",
    "transaction_id": "txn_abc123"
  },
  "products": [
    { "name": "General Admission", "qty": 2, "price": 25.00 }
  ],
  "timestamp": "2025-01-01T12:00:00Z"
}`}
                </pre>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading || selectedProducts.every(p => !p.productName || p.price <= 0)}
          >
            {loading ? 'Creating...' : 'Create Payment Link'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
