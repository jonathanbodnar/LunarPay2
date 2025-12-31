'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface CustomerSelectProps {
  organizationId: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function CustomerSelect({ organizationId, value, onChange, required }: CustomerSelectProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });

  const selectedCustomer = customers.find(c => c.id.toString() === value);

  useEffect(() => {
    if (organizationId) {
      fetchCustomers();
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

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleCreateCustomer = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: parseInt(organizationId),
          ...newCustomer,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers([...customers, data.customer]);
        onChange(data.customer.id.toString());
        setShowCreateModal(false);
        setSearchTerm('');
        setNewCustomer({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
        });
      } else {
        alert('Failed to create customer');
      }
    } catch (error) {
      alert('Error creating customer');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    // Pre-fill name from search if possible
    const parts = searchTerm.trim().split(' ');
    setNewCustomer({
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      email: searchTerm.includes('@') ? searchTerm : '',
      phone: '',
      address: '',
    });
    setShowCreateModal(true);
    setIsOpen(false);
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.firstName} ${customer.lastName} ${customer.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <span className={selectedCustomer ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedCustomer 
              ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}${selectedCustomer.email ? ` (${selectedCustomer.email})` : ''}`
              : 'Select customer...'
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
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-60 overflow-y-auto">
              {/* Add New Customer option - always at top */}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="w-full px-3 py-2.5 text-left flex items-center gap-2 hover:bg-muted text-primary font-medium border-b border-border"
              >
                <Plus className="h-4 w-4" />
                Add New Customer
              </button>

              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      onChange(customer.id.toString());
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full px-3 py-2.5 text-left hover:bg-muted transition-colors ${
                      value === customer.id.toString() ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="font-medium text-sm">
                      {customer.firstName} {customer.lastName}
                    </div>
                    {customer.email && (
                      <div className="text-xs text-muted-foreground">{customer.email}</div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No customers found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hidden input for form validation */}
        <input type="hidden" value={value} required={required} />
      </div>

      {/* Create Customer Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  value={newCustomer.firstName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  value={newCustomer.lastName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                type="tel"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={loading || !newCustomer.firstName || !newCustomer.lastName || !newCustomer.email}
            >
              {loading ? 'Creating...' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
