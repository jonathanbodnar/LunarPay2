'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Product {
  id: number;
  name: string;
  price: number;
  isSubscription: boolean;
  subscriptionInterval?: string;
  customerChoosesPrice?: boolean;
}

interface ProductSelectProps {
  organizationId: string;
  value: number | null;
  onSelect: (product: { id: number; name: string; price: number; customerChoosesPrice?: boolean }) => void;
}

export function ProductSelect({ organizationId, value, onSelect }: ProductSelectProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    isSubscription: false,
    subscriptionInterval: 'monthly',
    customerChoosesPrice: false,
  });

  const selectedProduct = products.find(p => p.id === value);
  const selectedIsCustomPrice = selectedProduct?.customerChoosesPrice ?? false;

  useEffect(() => {
    if (organizationId) {
      fetchProducts();
    }
  }, [organizationId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        const productsList = (data.products || []).filter((p: any) => p.id !== 0).map((p: any) => ({
          ...p,
          price: Number(p.price),
        }));
        setProducts(productsList);
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
          price: newProduct.customerChoosesPrice ? 0 : parseFloat(newProduct.price),
          description: newProduct.description,
          isSubscription: newProduct.isSubscription,
          subscriptionInterval: newProduct.isSubscription ? newProduct.subscriptionInterval : null,
          customerChoosesPrice: newProduct.customerChoosesPrice,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const createdProduct = {
          ...data.product,
          price: Number(data.product.price),
        };
        setProducts([...products, createdProduct]);
        onSelect({
          id: createdProduct.id,
          name: createdProduct.name,
          price: createdProduct.price,
          customerChoosesPrice: createdProduct.customerChoosesPrice,
        });
        setShowCreateModal(false);
        setSearchTerm('');
        setNewProduct({
          name: '',
          price: '',
          description: '',
          isSubscription: false,
          subscriptionInterval: 'monthly',
          customerChoosesPrice: false,
        });
      } else {
        const errorData = await response.json();
        alert(`Failed to create product: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error creating product: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setNewProduct({ ...newProduct, name: searchTerm });
    setShowCreateModal(true);
    setIsOpen(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Single-line dropdown trigger */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <span className={selectedProduct ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedProduct 
              ? selectedIsCustomPrice
                ? `${selectedProduct.name} (Customer sets price)`
                : `${selectedProduct.name} (${formatPrice(selectedProduct.price)})`
              : 'Select product...'
            }
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-60 overflow-y-auto">
              {/* Add New Product option - always at top */}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="w-full px-3 py-2.5 text-left flex items-center gap-2 hover:bg-muted text-primary font-medium border-b border-border"
              >
                <Plus className="h-4 w-4" />
                Add New Product
              </button>

              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      onSelect({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        customerChoosesPrice: product.customerChoosesPrice,
                      });
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full px-3 py-2.5 text-left hover:bg-muted transition-colors ${
                      value === product.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{product.name}</span>
                      {product.customerChoosesPrice ? (
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Customer sets price</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{formatPrice(product.price)}</span>
                      )}
                    </div>
                    {product.isSubscription && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {product.subscriptionInterval} subscription
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No products found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
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
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <input
                type="checkbox"
                id="customerChoosesPrice"
                checked={newProduct.customerChoosesPrice}
                onChange={(e) => setNewProduct({ ...newProduct, customerChoosesPrice: e.target.checked, price: e.target.checked ? '' : newProduct.price })}
                className="h-4 w-4 accent-blue-600"
              />
              <label htmlFor="customerChoosesPrice" className="text-sm font-medium text-blue-800 cursor-pointer">
                Customer chooses price
              </label>
              <span className="text-xs text-blue-600 ml-1">(customer enters amount at checkout)</span>
            </div>
            {!newProduct.customerChoosesPrice && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Price *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="0.00"
                  required={!newProduct.customerChoosesPrice}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-sm"
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
                    className="w-full h-10 px-3 rounded-md border border-border bg-background"
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
              disabled={loading || !newProduct.name || (!newProduct.customerChoosesPrice && !newProduct.price)}
            >
              {loading ? 'Creating...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
