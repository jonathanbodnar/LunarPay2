'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Product {
  id: number;
  name: string;
  price: number;
  isSubscription: boolean;
  subscriptionInterval?: string;
}

interface ProductSelectProps {
  organizationId: string;
  value: number | null;
  onSelect: (product: { id: number; name: string; price: number }) => void;
}

export function ProductSelect({ organizationId, value, onSelect }: ProductSelectProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    isSubscription: false,
    subscriptionInterval: 'monthly',
  });

  useEffect(() => {
    if (organizationId) {
      fetchProducts();
    }
  }, [organizationId]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products.filter((p: Product) => p.id !== 0) || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleCreateProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: parseInt(organizationId),
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          description: newProduct.description,
          isSubscription: newProduct.isSubscription,
          subscriptionInterval: newProduct.isSubscription ? newProduct.subscriptionInterval : null,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setProducts([...products, data.product]);
        onSelect({
          id: data.product.id,
          name: data.product.name,
          price: Number(data.product.price),
        });
        setShowCreateModal(false);
        setNewProduct({
          name: '',
          price: '',
          description: '',
          isSubscription: false,
          subscriptionInterval: 'monthly',
        });
      } else {
        const errorData = await response.json();
        console.error('Product creation failed:', errorData);
        alert(`Failed to create product: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Product creation error:', error);
      alert(`Error creating product: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search products or create new..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          <select
            className="w-full h-10 px-3 rounded-md border border-gray-300"
            value={value || ''}
            onChange={(e) => {
              if (!e.target.value) return;
              const product = products.find(p => p.id === parseInt(e.target.value));
              if (product) {
                onSelect({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                });
              }
            }}
          >
            <option value="">Select product...</option>
            {filteredProducts.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} (${product.price.toFixed(2)})
                {product.isSubscription && ` - ${product.subscriptionInterval}`}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setNewProduct({ ...newProduct, name: searchTerm });
            setShowCreateModal(true);
          }}
          className="h-10 mt-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Name *</label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Conference Ticket"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-gray-300"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Product description..."
              />
            </div>
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isSubscription"
                  checked={newProduct.isSubscription}
                  onChange={(e) => setNewProduct({ ...newProduct, isSubscription: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="isSubscription" className="text-sm font-medium">
                  This is a subscription product
                </label>
              </div>
              {newProduct.isSubscription && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Billing Frequency</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-gray-300"
                    value={newProduct.subscriptionInterval}
                    onChange={(e) => setNewProduct({ ...newProduct, subscriptionInterval: e.target.value })}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={loading || !newProduct.name || !newProduct.price}
            >
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


