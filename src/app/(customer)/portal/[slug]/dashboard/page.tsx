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
  Building2
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

type Tab = 'overview' | 'payment-methods' | 'subscriptions' | 'products';

export default function PortalDashboard() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Branding
  const primaryColor = customer?.organization?.primaryColor || '#000000';
  const backgroundColor = customer?.organization?.backgroundColor || '#ffffff';
  const buttonTextColor = customer?.organization?.buttonTextColor || '#ffffff';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [meRes, pmRes, subRes, prodRes] = await Promise.all([
        fetch('/api/portal/me'),
        fetch('/api/portal/payment-methods'),
        fetch('/api/portal/subscriptions'),
        fetch('/api/portal/products'),
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
    } catch (error) {
      console.error('Fetch error:', error);
      router.push(`/portal/${slug}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/portal/auth/logout', { method: 'POST' });
    router.push(`/portal/${slug}`);
  };

  const handleSetDefaultPayment = async (id: number) => {
    setActionLoading(`pm-default-${id}`);
    try {
      await fetch('/api/portal/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      // Refresh payment methods
      const res = await fetch('/api/portal/payment-methods');
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
      await fetch(`/api/portal/payment-methods?id=${id}`, { method: 'DELETE' });
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
      });
      // Refresh subscriptions
      const res = await fetch('/api/portal/subscriptions');
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
    { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCcw },
    { id: 'products', label: 'Shop', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
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
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-current font-medium' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                style={activeTab === tab.id ? { color: primaryColor, borderColor: primaryColor } : {}}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
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

        {activeTab === 'payment-methods' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Payment Methods</h2>
              <Button style={{ backgroundColor: primaryColor, color: buttonTextColor }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>

            {paymentMethods.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No payment methods saved yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {paymentMethods.map(pm => (
                  <Card key={pm.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {pm.sourceType === 'card' ? (
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                          ) : (
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">
                              {pm.sourceType === 'card' ? 'Card' : pm.bankType || 'Bank Account'} ending in {pm.lastDigits}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {pm.nameHolder}
                              {pm.expMonth && pm.expYear && ` • Expires ${pm.expMonth}/${pm.expYear}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
            <h2 className="text-2xl font-semibold">Subscriptions</h2>

            {subscriptions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <RefreshCcw className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No subscriptions yet.</p>
                  <Button 
                    className="mt-4"
                    onClick={() => setActiveTab('products')}
                    style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                  >
                    Browse Products
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {subscriptions.map(sub => {
                  const isActive = sub.status === 'A';
                  return (
                    <Card key={sub.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div 
                              className="p-3 rounded-lg"
                              style={{ backgroundColor: isActive ? `${primaryColor}15` : '#f0f0f0' }}
                            >
                              <RefreshCcw 
                                className="h-6 w-6" 
                                style={{ color: isActive ? primaryColor : '#999' }} 
                              />
                            </div>
                            <div>
                              <p className="font-medium">
                                {formatCurrency(Number(sub.amount))} / {sub.frequency}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Next: {formatDate(sub.nextPaymentOn)}
                                </span>
                                {sub.lastPaymentOn && (
                                  <span>Last: {formatDate(sub.lastPaymentOn)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span 
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isActive 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {isActive ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Cancelled</>
                              )}
                            </span>
                            {isActive && (
                              <Button 
                                variant="outline" 
                                size="sm"
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
            <h2 className="text-2xl font-semibold">Shop</h2>

            {products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No products available at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                            {formatCurrency(Number(product.price))}
                          </p>
                          {product.isSubscription && (
                            <p className="text-sm text-muted-foreground">
                              {getSubscriptionFrequencyText(
                                product.subscriptionInterval, 
                                product.subscriptionIntervalCount
                              )}
                              {product.subscriptionTrialDays && product.subscriptionTrialDays > 0 && (
                                <> • {product.subscriptionTrialDays} day trial</>
                              )}
                            </p>
                          )}
                        </div>
                        <Button 
                          size="sm"
                          style={{ backgroundColor: primaryColor, color: buttonTextColor }}
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

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-muted-foreground">
        Powered by LunarPay
      </footer>
    </div>
  );
}

