'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function NewPaymentLinkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [formData, setFormData] = useState({
    organizationId: '',
    name: '',
    description: '',
    paymentMethods: 'both',
    status: 'active',
  });

  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: number | null;
    qty: number | null;
    unlimitedQty: boolean;
    productName?: string;
    price?: number;
  }>>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orgsRes, productsRes] = await Promise.all([
        fetch('/api/organizations'),
        fetch('/api/products')
      ]);

      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setOrganizations(data.organizations || []);
        if (data.organizations?.length > 0) {
          setFormData(prev => ({ ...prev, organizationId: data.organizations[0].id.toString() }));
        }
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        const productsList = (data.products || []).map((p: any) => ({
          ...p,
          price: Number(p.price), // Convert Decimal to number
        }));
        setProducts(productsList);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
          price: Number(product.price), // Ensure price is a number
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
    
    setLoading(true);

    try {
      const response = await fetch('/api/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId: parseInt(formData.organizationId),
          products: selectedProducts.filter(p => p.productId !== null),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        router.push(`/payment-links`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create payment link');
      }
    } catch (error) {
      alert('Error creating payment link');
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
          <h1 className="text-3xl font-bold text-gray-900">Create Payment Link</h1>
          <p className="mt-2 text-gray-600">Create a shareable payment collection page</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Link Details</CardTitle>
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
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-gray-300"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this payment link is for..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Methods</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-gray-300"
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
                  className="w-full h-10 px-3 rounded-md border border-gray-300"
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
            {selectedProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No products added yet.</p>
                <p className="text-sm mt-2">Click "Add Product" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedProducts.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 border rounded-lg">
                    <div className="col-span-5">
                      <label className="text-xs text-gray-500">Product *</label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-gray-300"
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
                      <label className="text-xs text-gray-500">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty || ''}
                        onChange={(e) => updateProduct(index, 'qty', parseInt(e.target.value))}
                        disabled={item.unlimitedQty}
                        placeholder="Qty"
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <label className="text-xs text-gray-500">Options</label>
                      <div className="flex items-center gap-2 h-10">
                        <input
                          type="checkbox"
                          id={`unlimited-${index}`}
                          checked={item.unlimitedQty}
                          onChange={(e) => updateProduct(index, 'unlimitedQty', e.target.checked)}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`unlimited-${index}`} className="text-sm">
                          Unlimited
                        </label>
                      </div>
                    </div>
                    
                    <div className="col-span-1">
                      <label className="text-xs text-gray-500 invisible">Del</label>
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

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading || selectedProducts.length === 0 || selectedProducts.every(p => !p.productId)}
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
