'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Webhook, HelpCircle, Copy, ExternalLink } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function EditPaymentLinkPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentLinkHash, setPaymentLinkHash] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    paymentMethods: 'both',
    status: 'active',
    webhookUrl: '',
    organizationName: '',
  });

  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: number | null;
    qty: number | null;
    unlimitedQty: boolean;
    productName?: string;
    price?: number;
  }>>([]);

  useEffect(() => {
    if (params.id) {
      fetchPaymentLink();
      fetchProducts();
    }
  }, [params.id]);

  const fetchPaymentLink = async () => {
    try {
      const response = await fetch(`/api/payment-links/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const link = data.paymentLink;
        setFormData({
          name: link.name || '',
          description: link.description || '',
          paymentMethods: link.paymentMethods || 'both',
          status: link.status || 'active',
          webhookUrl: link.webhookUrl || '',
          organizationName: link.organization?.name || '',
        });
        setPaymentLinkHash(link.hash || '');
        setSelectedProducts(link.products?.map((p: any) => ({
          productId: p.product.id,
          qty: p.qty,
          unlimitedQty: p.unlimitedQty,
          productName: p.product.name,
          price: Number(p.product.price),
        })) || []);
      } else {
        alert('Payment link not found');
        router.push('/payment-links');
      }
    } catch (error) {
      console.error('Failed to fetch payment link:', error);
      alert('Failed to load payment link');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts((data.products || []).map((p: any) => ({
          ...p,
          price: Number(p.price),
        })));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, {
      productId: null,
      qty: 1,
      unlimitedQty: false,
    }]);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updated = [...selectedProducts];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        updated[index] = {
          ...updated[index],
          productId: product.id,
          productName: product.name,
          price: Number(product.price),
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setSelectedProducts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0 || selectedProducts.every(p => !p.productId)) {
      alert('Please add at least one product to the payment link');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/payment-links/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/payment-links');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update payment link');
      }
    } catch (error) {
      alert('Error updating payment link');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this payment link?')) return;
    
    try {
      const response = await fetch(`/api/payment-links/${params.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/payment-links');
      } else {
        alert('Failed to delete payment link');
      }
    } catch (error) {
      alert('Error deleting payment link');
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/payment-link/${paymentLinkHash}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Payment Link</h1>
            <p className="mt-1 text-muted-foreground">Update payment link details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={copyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open(`/payment-link/${paymentLinkHash}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Payment Link Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization</label>
              <Input value={formData.organizationName} disabled />
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
              <CardTitle className="text-base font-medium">Products</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No products added yet.</p>
                <p className="text-sm mt-2">Click "Add Product" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedProducts.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 border rounded-lg">
                    <div className="col-span-5">
                      <label className="text-xs text-muted-foreground">Product *</label>
                      <select
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                        value={item.productId || ''}
                        onChange={(e) => updateProduct(index, 'productId', e.target.value)}
                        required
                      >
                        <option value="">Select product...</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} (${Number(product.price).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-3">
                      <label className="text-xs text-muted-foreground">Available qty</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty || ''}
                        onChange={(e) => updateProduct(index, 'qty', parseInt(e.target.value) || null)}
                        disabled={item.unlimitedQty}
                        placeholder={item.unlimitedQty ? "∞" : "Qty"}
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <label className="text-xs text-muted-foreground">Limit</label>
                      <div className="flex items-center gap-2 h-10">
                        <input
                          type="checkbox"
                          id={`unlimited-${index}`}
                          checked={item.unlimitedQty}
                          onChange={(e) => updateProduct(index, 'unlimitedQty', e.target.checked)}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`unlimited-${index}`} className="text-sm text-muted-foreground">
                          No limit
                        </label>
                      </div>
                    </div>
                    
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              <CardTitle className="text-base font-medium">Webhook Integration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Webhook URL
                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                type="url"
                value={formData.webhookUrl}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                placeholder="https://your-server.com/webhook"
              />
              <p className="text-xs text-muted-foreground">
                We'll send a POST request with customer and payment data to this URL after each successful payment.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving || selectedProducts.length === 0}>
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

