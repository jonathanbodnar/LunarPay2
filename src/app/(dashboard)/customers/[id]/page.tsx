'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Mail, Phone, MapPin, CreditCard, Plus, 
  ChevronDown, DollarSign, RefreshCw, FileText, X,
  Building2, Landmark
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentMethod {
  id: number;
  lastFour: string;
  cardBrand: string | null;
  accountType: string | null;
  isDefault: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  isSubscription: boolean;
  subscriptionInterval: string | null;
  subscriptionIntervalCount: number | null;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(false);
  
  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  
  // Data for modals
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptionProducts, setSubscriptionProducts] = useState<Product[]>([]);
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    selectedPaymentMethod: '',
    useNewCard: false,
    paymentType: 'card' as 'card' | 'bank',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: '',
    routingNumber: '',
    accountNumber: '',
    accountName: '',
    accountType: 'checking',
    savePaymentMethod: true,
  });
  
  // Subscription form state
  const [subscriptionForm, setSubscriptionForm] = useState({
    productId: '',
    selectedPaymentMethod: '',
    useNewCard: false,
    paymentType: 'card' as 'card' | 'bank',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: '',
    routingNumber: '',
    accountNumber: '',
    accountName: '',
    accountType: 'checking',
    savePaymentMethod: true,
  });
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCustomer();
      fetchPaymentMethods();
      fetchProducts();
    }
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}/payment-methods`);
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        const allProducts = data.products || [];
        setProducts(allProducts);
        setSubscriptionProducts(allProducts.filter((p: Product) => p.isSubscription));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!paymentForm.selectedPaymentMethod && !paymentForm.useNewCard) {
      alert('Please select a payment method or enter new card details');
      return;
    }
    
    setProcessing(true);
    try {
      // TODO: Integrate with payment processor
      alert('Payment processing will be integrated with Fortis');
      setShowPaymentModal(false);
      resetPaymentForm();
    } catch (error) {
      alert('Payment failed: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddSubscription = async () => {
    if (!subscriptionForm.productId) {
      alert('Please select a subscription product');
      return;
    }
    
    if (!subscriptionForm.selectedPaymentMethod && !subscriptionForm.useNewCard) {
      alert('Please select a payment method or enter new card details');
      return;
    }
    
    setProcessing(true);
    try {
      // TODO: Integrate with payment processor for subscription
      alert('Subscription creation will be integrated with Fortis');
      setShowSubscriptionModal(false);
      resetSubscriptionForm();
    } catch (error) {
      alert('Subscription failed: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateInvoice = () => {
    // Navigate to invoice creation with customer pre-selected
    router.push(`/invoices/new?customerId=${customer.id}&organizationId=${customer.organizationId}`);
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: '',
      selectedPaymentMethod: '',
      useNewCard: false,
      paymentType: 'card',
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardName: '',
      routingNumber: '',
      accountNumber: '',
      accountName: '',
      accountType: 'checking',
      savePaymentMethod: true,
    });
  };

  const resetSubscriptionForm = () => {
    setSubscriptionForm({
      productId: '',
      selectedPaymentMethod: '',
      useNewCard: false,
      paymentType: 'card',
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardName: '',
      routingNumber: '',
      accountNumber: '',
      accountName: '',
      accountType: 'checking',
      savePaymentMethod: true,
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>;
  }

  if (!customer) {
    return <div>Customer not found</div>;
  }

  const selectedSubscriptionProduct = subscriptionProducts.find(
    p => p.id === Number(subscriptionForm.productId)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="mt-1 text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <div className="relative">
            <Button onClick={() => setActionsOpen(!actionsOpen)}>
              <Plus className="h-4 w-4 mr-2" />
              Add
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            
            {actionsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setActionsOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg z-20">
                  <button
                    className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-2 rounded-t-lg"
                    onClick={() => {
                      setShowPaymentModal(true);
                      setActionsOpen(false);
                    }}
                  >
                    <DollarSign className="h-4 w-4" />
                    Add Payment
                  </button>
                  <button
                    className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => {
                      setShowSubscriptionModal(true);
                      setActionsOpen(false);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Add Subscription
                  </button>
                  <button
                    className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-2 rounded-b-lg"
                    onClick={() => {
                      handleCreateInvoice();
                      setActionsOpen(false);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Create Invoice
                  </button>
                </div>
              </>
            )}
          </div>
          
          <Button variant="outline" onClick={() => router.push(`/customers/${customer.id}/edit`)}>
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.phone || '-'}</p>
                </div>
              </div>
            </div>

            {(customer.address || customer.city || customer.state) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {customer.address}<br />
                    {customer.city}, {customer.state} {customer.zip}
                  </p>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Organization</p>
              <p className="font-medium">{customer.organization?.name || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(Number(customer.amountAcum || 0))}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Net Amount</p>
              <p className="text-lg font-medium">
                {formatCurrency(Number(customer.netAcum || 0))}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-lg font-medium">{customer._count?.transactions || 0}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Payment Methods</p>
              <p className="text-lg font-medium">{customer._count?.sources || 0}</p>
            </div>

            {customer.firstDate && (
              <div>
                <p className="text-sm text-muted-foreground">First Payment</p>
                <p className="font-medium">{formatDate(customer.firstDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No transactions yet
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Methods</CardTitle>
            <Button variant="outline" size="sm" onClick={() => {
              setPaymentForm(prev => ({ ...prev, useNewCard: true }));
              setShowPaymentModal(true);
            }}>
              <CreditCard className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No saved payment methods
            </p>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {method.cardBrand || method.accountType || 'Card'} •••• {method.lastFour}
                      </p>
                      {method.isDefault && (
                        <span className="text-xs text-muted-foreground">Default</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Payment</h2>
              <button onClick={() => { setShowPaymentModal(false); resetPaymentForm(); }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              {paymentMethods.length > 0 && !paymentForm.useNewCard && (
                <div>
                  <label className="block text-sm font-medium mb-2">Saved Payment Methods</label>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <label key={method.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={paymentForm.selectedPaymentMethod === method.id.toString()}
                          onChange={(e) => setPaymentForm({ ...paymentForm, selectedPaymentMethod: e.target.value })}
                        />
                        <CreditCard className="h-4 w-4" />
                        <span>{method.cardBrand || method.accountType} •••• {method.lastFour}</span>
                      </label>
                    ))}
                    <button
                      type="button"
                      className="w-full p-3 border rounded-lg text-left text-sm text-muted-foreground hover:bg-muted"
                      onClick={() => setPaymentForm({ ...paymentForm, useNewCard: true, selectedPaymentMethod: '' })}
                    >
                      + Use a different payment method
                    </button>
                  </div>
                </div>
              )}

              {/* New Payment Method Form */}
              {(paymentMethods.length === 0 || paymentForm.useNewCard) && (
                <>
                  {/* Payment Type Tabs */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Type</label>
                    <div className="flex border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                          paymentForm.paymentType === 'card' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                        onClick={() => setPaymentForm({ ...paymentForm, paymentType: 'card' })}
                      >
                        <CreditCard className="h-4 w-4" />
                        Card
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                          paymentForm.paymentType === 'bank' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                        onClick={() => setPaymentForm({ ...paymentForm, paymentType: 'bank' })}
                      >
                        <Landmark className="h-4 w-4" />
                        Bank
                      </button>
                    </div>
                  </div>

                  {paymentForm.paymentType === 'card' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Card Number</label>
                        <Input
                          value={paymentForm.cardNumber}
                          onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: formatCardNumber(e.target.value) })}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Expiry</label>
                          <Input
                            value={paymentForm.expiry}
                            onChange={(e) => setPaymentForm({ ...paymentForm, expiry: formatExpiry(e.target.value) })}
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">CVV</label>
                          <Input
                            value={paymentForm.cvv}
                            onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                            placeholder="123"
                            maxLength={4}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Name on Card</label>
                        <Input
                          value={paymentForm.cardName}
                          onChange={(e) => setPaymentForm({ ...paymentForm, cardName: e.target.value })}
                          placeholder="John Smith"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Routing Number</label>
                        <Input
                          value={paymentForm.routingNumber}
                          onChange={(e) => setPaymentForm({ ...paymentForm, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                          placeholder="123456789"
                          maxLength={9}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Account Number</label>
                        <Input
                          value={paymentForm.accountNumber}
                          onChange={(e) => setPaymentForm({ ...paymentForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                        <Input
                          value={paymentForm.accountName}
                          onChange={(e) => setPaymentForm({ ...paymentForm, accountName: e.target.value })}
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Account Type</label>
                        <select
                          className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                          value={paymentForm.accountType}
                          onChange={(e) => setPaymentForm({ ...paymentForm, accountType: e.target.value })}
                        >
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={paymentForm.savePaymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, savePaymentMethod: e.target.checked })}
                    />
                    <span className="text-sm">Save payment method for future use</span>
                  </label>

                  {paymentMethods.length > 0 && (
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:underline"
                      onClick={() => setPaymentForm({ ...paymentForm, useNewCard: false })}
                    >
                      ← Use saved payment method
                    </button>
                  )}
                </>
              )}
            </div>
            
            <div className="p-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowPaymentModal(false); resetPaymentForm(); }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAddPayment} disabled={processing}>
                {processing ? 'Processing...' : `Charge ${paymentForm.amount ? formatCurrency(Number(paymentForm.amount)) : '$0.00'}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Subscription</h2>
              <button onClick={() => { setShowSubscriptionModal(false); resetSubscriptionForm(); }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Subscription Product *</label>
                {subscriptionProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 border rounded-lg bg-muted">
                    No subscription products available. Create a subscription product first.
                  </p>
                ) : (
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                    value={subscriptionForm.productId}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, productId: e.target.value })}
                  >
                    <option value="">Select a subscription...</option>
                    {subscriptionProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(Number(product.price))}/{product.subscriptionInterval}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedSubscriptionProduct && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedSubscriptionProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(Number(selectedSubscriptionProduct.price))} / {selectedSubscriptionProduct.subscriptionInterval}
                  </p>
                </div>
              )}

              {/* Payment Method Selection */}
              {paymentMethods.length > 0 && !subscriptionForm.useNewCard && (
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <label key={method.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                        <input
                          type="radio"
                          name="subPaymentMethod"
                          value={method.id}
                          checked={subscriptionForm.selectedPaymentMethod === method.id.toString()}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, selectedPaymentMethod: e.target.value })}
                        />
                        <CreditCard className="h-4 w-4" />
                        <span>{method.cardBrand || method.accountType} •••• {method.lastFour}</span>
                      </label>
                    ))}
                    <button
                      type="button"
                      className="w-full p-3 border rounded-lg text-left text-sm text-muted-foreground hover:bg-muted"
                      onClick={() => setSubscriptionForm({ ...subscriptionForm, useNewCard: true, selectedPaymentMethod: '' })}
                    >
                      + Use a different payment method
                    </button>
                  </div>
                </div>
              )}

              {/* New Payment Method Form */}
              {(paymentMethods.length === 0 || subscriptionForm.useNewCard) && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Type</label>
                    <div className="flex border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                          subscriptionForm.paymentType === 'card' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                        onClick={() => setSubscriptionForm({ ...subscriptionForm, paymentType: 'card' })}
                      >
                        <CreditCard className="h-4 w-4" />
                        Card
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                          subscriptionForm.paymentType === 'bank' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                        onClick={() => setSubscriptionForm({ ...subscriptionForm, paymentType: 'bank' })}
                      >
                        <Landmark className="h-4 w-4" />
                        Bank
                      </button>
                    </div>
                  </div>

                  {subscriptionForm.paymentType === 'card' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Card Number</label>
                        <Input
                          value={subscriptionForm.cardNumber}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, cardNumber: formatCardNumber(e.target.value) })}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Expiry</label>
                          <Input
                            value={subscriptionForm.expiry}
                            onChange={(e) => setSubscriptionForm({ ...subscriptionForm, expiry: formatExpiry(e.target.value) })}
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">CVV</label>
                          <Input
                            value={subscriptionForm.cvv}
                            onChange={(e) => setSubscriptionForm({ ...subscriptionForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                            placeholder="123"
                            maxLength={4}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Name on Card</label>
                        <Input
                          value={subscriptionForm.cardName}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, cardName: e.target.value })}
                          placeholder="John Smith"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Routing Number</label>
                        <Input
                          value={subscriptionForm.routingNumber}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                          placeholder="123456789"
                          maxLength={9}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Account Number</label>
                        <Input
                          value={subscriptionForm.accountNumber}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                        <Input
                          value={subscriptionForm.accountName}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, accountName: e.target.value })}
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Account Type</label>
                        <select
                          className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                          value={subscriptionForm.accountType}
                          onChange={(e) => setSubscriptionForm({ ...subscriptionForm, accountType: e.target.value })}
                        >
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={subscriptionForm.savePaymentMethod}
                      onChange={(e) => setSubscriptionForm({ ...subscriptionForm, savePaymentMethod: e.target.checked })}
                    />
                    <span className="text-sm">Save payment method for future use</span>
                  </label>

                  {paymentMethods.length > 0 && (
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:underline"
                      onClick={() => setSubscriptionForm({ ...subscriptionForm, useNewCard: false })}
                    >
                      ← Use saved payment method
                    </button>
                  )}
                </>
              )}
            </div>
            
            <div className="p-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowSubscriptionModal(false); resetSubscriptionForm(); }}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleAddSubscription} 
                disabled={processing || !subscriptionForm.productId}
              >
                {processing ? 'Processing...' : 'Start Subscription'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
