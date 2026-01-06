'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  RefreshCcw, 
  ShoppingBag, 
  LogOut, 
  Loader2, 
  Plus, 
  Trash2,
  Star,
  Calendar,
  CheckCircle,
  XCircle,
  Building2,
  X,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { formatCurrency, formatDate, getSubscriptionFrequencyText } from '@/lib/utils';

interface Customer {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  organization: {
    id: number;
    name: string;
    logo: string | null;
    primaryColor: string | null;
    backgroundColor: string | null;
    buttonTextColor: string | null;
    portalTitle: string | null;
  };
}

interface PaymentMethod {
  id: number;
  sourceType: string;
  bankType: string | null;
  lastDigits: string | null;
  nameHolder: string | null;
  isDefault: boolean;
  expMonth: string | null;
  expYear: string | null;
}

interface Subscription {
  id: number;
  amount: number;
  frequency: string;
  status: string;
  nextPaymentOn: string;
  lastPaymentOn: string | null;
  source: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  isSubscription: boolean;
  subscriptionInterval: string | null;
  subscriptionIntervalCount: number | null;
  subscriptionTrialDays: number | null;
}

interface Transaction {
  id: number;
  totalAmount: number;
  fee: number;
  source: string;
  bankType: string | null;
  status: string;
  transactionType: string | null;
  givingSource: string;
  date: string;
}

type Tab = 'overview' | 'transactions' | 'payment-methods' | 'subscriptions' | 'products';

export default function PortalDashboard() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Checkout modal state
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Branding
  const primaryColor = customer?.organization?.primaryColor || '#000000';
  const backgroundColor = customer?.organization?.backgroundColor || '#ffffff';
  const buttonTextColor = customer?.organization?.buttonTextColor || '#ffffff';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [meRes, pmRes, subRes, prodRes, trxRes] = await Promise.all([
        fetch('/api/portal/me', { credentials: 'include' }),
        fetch('/api/portal/payment-methods', { credentials: 'include' }),
        fetch('/api/portal/subscriptions', { credentials: 'include' }),
        fetch('/api/portal/products', { credentials: 'include' }),
        fetch('/api/portal/transactions', { credentials: 'include' }),
      ]);

      if (!meRes.ok) {
        // Not authenticated, redirect to login
        router.push(`/portal/${slug}`);
        return;
      }

      const meData = await meRes.json();
      setCustomer(meData.customer);

      if (pmRes.ok) {
        const pmData = await pmRes.json();
        setPaymentMethods(pmData.paymentMethods || []);
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptions(subData.subscriptions || []);
      }

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }

      if (trxRes.ok) {
        const trxData = await trxRes.json();
        setTransactions(trxData.transactions || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      router.push(`/portal/${slug}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/portal/auth/logout', { method: 'POST', credentials: 'include' });
    router.push(`/portal/${slug}`);
  };

  const handleSetDefaultPayment = async (id: number) => {
    setActionLoading(`pm-default-${id}`);
    try {
      await fetch('/api/portal/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });
      // Refresh payment methods
      const res = await fetch('/api/portal/payment-methods', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Set default error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePayment = async (id: number) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;
    
    setActionLoading(`pm-delete-${id}`);
    try {
      await fetch(`/api/portal/payment-methods?id=${id}`, { method: 'DELETE', credentials: 'include' });
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    
    setActionLoading(`sub-cancel-${id}`);
    try {
      await fetch('/api/portal/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'cancel' }),
        credentials: 'include',
      });
      // Refresh subscriptions
      const res = await fetch('/api/portal/subscriptions', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Cancel error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Open checkout modal
  const handleOpenCheckout = (product: Product) => {
    setCheckoutProduct(product);
    setCheckoutError(null);
    setCheckoutSuccess(false);
    // Pre-select default payment method
    const defaultPm = paymentMethods.find(pm => pm.isDefault);
    setSelectedPaymentMethod(defaultPm?.id || paymentMethods[0]?.id || null);
  };

  // Close checkout modal
  const handleCloseCheckout = () => {
    setCheckoutProduct(null);
    setSelectedPaymentMethod(null);
    setCheckoutError(null);
    setCheckoutSuccess(false);
  };

  // Process checkout/purchase
  const handleCheckout = async () => {
    if (!checkoutProduct || !selectedPaymentMethod) return;
    
    setCheckoutLoading(true);
    setCheckoutError(null);
    
    try {
      const response = await fetch('/api/portal/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: checkoutProduct.id,
          paymentMethodId: selectedPaymentMethod,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setCheckoutSuccess(true);
      
      // Refresh subscriptions if it was a subscription product
      if (checkoutProduct.isSubscription) {
        const subRes = await fetch('/api/portal/subscriptions', { credentials: 'include' });
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscriptions(subData.subscriptions || []);
        }
      }
      
      // Close modal after brief success message
      setTimeout(() => {
        handleCloseCheckout();
      }, 2000);
      
    } catch (error) {
      setCheckoutError((error as Error).message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === 'A');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'transactions', label: 'Transaction History', icon: Receipt },
    { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCcw },
    { id: 'products', label: 'Shop', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {customer.organization.logo ? (
              <img 
                src={customer.organization.logo} 
                alt={customer.organization.name} 
                className="h-8 object-contain" 
              />
            ) : (
              <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
                {customer.organization.name}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {customer.firstName} {customer.lastName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-lg transition-all whitespace-nowrap text-sm ${
                  activeTab === tab.id 
                    ? 'font-medium shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-gray-100'
                }`}
                style={activeTab === tab.id ? { 
                  backgroundColor: `${primaryColor}10`, 
                  color: primaryColor 
                } : {}}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">
              Welcome back, {customer.firstName || 'Customer'}!
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <CreditCard className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{paymentMethods.length}</p>
                      <p className="text-sm text-muted-foreground">Payment Methods</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <RefreshCcw className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{activeSubscriptions.length}</p>
                      <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <ShoppingBag className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{products.length}</p>
                      <p className="text-sm text-muted-foreground">Available Products</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {activeSubscriptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeSubscriptions.slice(0, 3).map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{formatCurrency(Number(sub.amount))} {sub.frequency}</p>
                          <p className="text-sm text-muted-foreground">
                            Next payment: {formatDate(sub.nextPaymentOn)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Transaction History</h2>
              <p className="text-muted-foreground text-sm mt-1">View your past payments and refunds</p>
            </div>

            {transactions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <Receipt className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No transactions yet</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Your payment history will appear here once you make a purchase.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0 divide-y">
                  {transactions.map(trx => {
                    const isRefund = trx.transactionType === 'refund';
                    const isPaid = trx.status === 'P';
                    const isFailed = trx.status === 'N';
                    
                    return (
                      <div key={trx.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ 
                              backgroundColor: isRefund 
                                ? '#fef2f2' 
                                : isPaid 
                                  ? `${primaryColor}10` 
                                  : '#f5f5f5' 
                            }}
                          >
                            {isRefund ? (
                              <ArrowDownLeft className="h-5 w-5 text-red-500" />
                            ) : (
                              <ArrowUpRight 
                                className="h-5 w-5" 
                                style={{ color: isPaid ? primaryColor : '#999' }} 
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {isRefund ? 'Refund' : 'Payment'}
                              <span className="text-muted-foreground font-normal"> via {trx.givingSource}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(trx.date)}
                              {trx.bankType && (
                                <span className="ml-2">• {trx.bankType.charAt(0).toUpperCase() + trx.bankType.slice(1)}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p 
                            className={`text-lg font-semibold ${
                              isRefund ? 'text-red-600' : ''
                            }`}
                            style={!isRefund && isPaid ? { color: primaryColor } : {}}
                          >
                            {isRefund ? '-' : '+'}{formatCurrency(Number(trx.totalAmount))}
                          </p>
                          <span 
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              isPaid 
                                ? 'bg-green-100 text-green-700' 
                                : isFailed
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {isPaid ? 'Completed' : isFailed ? 'Failed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'payment-methods' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Payment Methods</h2>
                <p className="text-muted-foreground text-sm mt-1">Manage your saved cards and bank accounts</p>
              </div>
              <Button style={{ backgroundColor: primaryColor, color: buttonTextColor }}>
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>

            {paymentMethods.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <CreditCard className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No payment methods yet</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                    Add a card or bank account to make purchases and manage subscriptions.
                  </p>
                  <Button style={{ backgroundColor: primaryColor, color: buttonTextColor }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map(pm => (
                  <Card key={pm.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${primaryColor}10` }}
                          >
                            {pm.sourceType === 'cc' || pm.sourceType === 'card' ? (
                              <CreditCard className="h-6 w-6" style={{ color: primaryColor }} />
                            ) : (
                              <Building2 className="h-6 w-6" style={{ color: primaryColor }} />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {pm.bankType ? pm.bankType.charAt(0).toUpperCase() + pm.bankType.slice(1) : 'Card'} •••• {pm.lastDigits}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {pm.nameHolder}
                              {pm.expMonth && pm.expYear && ` • Expires ${pm.expMonth}/${pm.expYear}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {pm.isDefault ? (
                            <span 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </span>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSetDefaultPayment(pm.id)}
                              disabled={actionLoading === `pm-default-${pm.id}`}
                            >
                              {actionLoading === `pm-default-${pm.id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Set Default'
                              )}
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePayment(pm.id)}
                            disabled={actionLoading === `pm-delete-${pm.id}`}
                          >
                            {actionLoading === `pm-delete-${pm.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Subscriptions</h2>
              <p className="text-muted-foreground text-sm mt-1">Manage your recurring payments</p>
            </div>

            {subscriptions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <RefreshCcw className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No active subscriptions</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                    Subscribe to products to set up recurring payments.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('products')}
                    style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse Products
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {subscriptions.map(sub => {
                  const isActive = sub.status === 'A';
                  return (
                    <Card key={sub.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: isActive ? `${primaryColor}10` : '#f5f5f5' }}
                            >
                              <RefreshCcw 
                                className="h-6 w-6" 
                                style={{ color: isActive ? primaryColor : '#999' }} 
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">
                                {formatCurrency(Number(sub.amount))}
                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                  / {sub.frequency}
                                </span>
                              </p>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Next: {formatDate(sub.nextPaymentOn)}
                                </span>
                                {sub.lastPaymentOn && (
                                  <span>• Last: {formatDate(sub.lastPaymentOn)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-16 sm:ml-0">
                            <span 
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                isActive 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {isActive ? (
                                <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Active</>
                              ) : (
                                <><XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancelled</>
                              )}
                            </span>
                            {isActive && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleCancelSubscription(sub.id)}
                                disabled={actionLoading === `sub-cancel-${sub.id}`}
                              >
                                {actionLoading === `sub-cancel-${sub.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Cancel'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Shop</h2>
              <p className="text-muted-foreground text-sm mt-1">Browse available products and subscriptions</p>
            </div>

            {products.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <ShoppingBag className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No products available</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Check back later for available products and subscriptions.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {products.map(product => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {product.isSubscription && (
                                <span 
                                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                                >
                                  Subscription
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-xl mb-2">{product.name}</h3>
                            {product.description && (
                              <p className="text-muted-foreground text-sm mb-3">{product.description}</p>
                            )}
                            {product.isSubscription && (
                              <p className="text-sm text-muted-foreground">
                                Billed {getSubscriptionFrequencyText(
                                  product.subscriptionInterval, 
                                  product.subscriptionIntervalCount
                                )}
                                {product.subscriptionTrialDays && product.subscriptionTrialDays > 0 && (
                                  <span className="text-green-600 ml-2">
                                    • {product.subscriptionTrialDays} day free trial
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div 
                        className="px-6 py-4 flex items-center justify-between border-t"
                        style={{ backgroundColor: `${primaryColor}05` }}
                      >
                        <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                          {formatCurrency(Number(product.price))}
                          {product.isSubscription && (
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              /{product.subscriptionInterval === 'monthly' ? 'mo' : product.subscriptionInterval === 'yearly' ? 'yr' : product.subscriptionInterval}
                            </span>
                          )}
                        </p>
                        <Button 
                          style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                          onClick={() => handleOpenCheckout(product)}
                        >
                          {product.isSubscription ? 'Subscribe' : 'Buy Now'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer - Fixed at bottom */}
      <footer className="fixed bottom-0 left-0 right-0 py-3 text-center text-xs text-muted-foreground bg-white/80 backdrop-blur-sm border-t">
        Powered by <span className="font-medium">LunarPay</span>
      </footer>
      
      {/* Spacer for fixed footer */}
      <div className="h-12" />

      {/* Checkout Modal */}
      {checkoutProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {checkoutProduct.isSubscription ? 'Subscribe' : 'Complete Purchase'}
              </h3>
              <button 
                onClick={handleCloseCheckout}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Product Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{checkoutProduct.name}</h4>
                {checkoutProduct.description && (
                  <p className="text-sm text-muted-foreground mt-1">{checkoutProduct.description}</p>
                )}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {formatCurrency(Number(checkoutProduct.price))}
                  </span>
                  {checkoutProduct.isSubscription && (
                    <span className="text-sm text-muted-foreground">
                      / {getSubscriptionFrequencyText(
                        checkoutProduct.subscriptionInterval,
                        checkoutProduct.subscriptionIntervalCount
                      )}
                    </span>
                  )}
                </div>
                {checkoutProduct.isSubscription && checkoutProduct.subscriptionTrialDays && checkoutProduct.subscriptionTrialDays > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    Includes {checkoutProduct.subscriptionTrialDays} day free trial
                  </p>
                )}
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Payment Method</label>
                {paymentMethods.length === 0 ? (
                  <div className="p-4 border rounded-lg text-center">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">No payment methods saved</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        handleCloseCheckout();
                        setActiveTab('payment-methods');
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paymentMethods.map(pm => (
                      <label 
                        key={pm.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPaymentMethod === pm.id 
                            ? 'border-2 bg-gray-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        style={selectedPaymentMethod === pm.id ? { borderColor: primaryColor } : {}}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedPaymentMethod === pm.id}
                          onChange={() => setSelectedPaymentMethod(pm.id)}
                          className="sr-only"
                        />
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {pm.sourceType === 'CC' ? 'Card' : 'Bank'} •••• {pm.lastDigits}
                          </p>
                          {pm.expMonth && pm.expYear && (
                            <p className="text-xs text-muted-foreground">
                              Expires {pm.expMonth}/{pm.expYear}
                            </p>
                          )}
                        </div>
                        {pm.isDefault && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">Default</span>
                        )}
                        {selectedPaymentMethod === pm.id && (
                          <CheckCircle className="h-5 w-5" style={{ color: primaryColor }} />
                        )}
                      </label>
                    ))}
                    <button
                      onClick={() => {
                        handleCloseCheckout();
                        setActiveTab('payment-methods');
                      }}
                      className="w-full p-3 border border-dashed rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add New Payment Method
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {checkoutError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {checkoutError}
                </div>
              )}

              {/* Success Message */}
              {checkoutSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  {checkoutProduct.isSubscription ? 'Subscription started!' : 'Payment successful!'}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t space-y-3">
              <Button
                className="w-full"
                style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                disabled={!selectedPaymentMethod || checkoutLoading || checkoutSuccess || paymentMethods.length === 0}
                onClick={handleCheckout}
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : checkoutSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Done
                  </>
                ) : (
                  <>
                    Pay {formatCurrency(Number(checkoutProduct.price))}
                    {checkoutProduct.isSubscription && checkoutProduct.subscriptionTrialDays && checkoutProduct.subscriptionTrialDays > 0 
                      ? ' after trial' 
                      : ''
                    }
                  </>
                )}
              </Button>
              <button
                onClick={handleCloseCheckout}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

