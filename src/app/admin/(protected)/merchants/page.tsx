'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Search, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Circle,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Users,
  FileText,
  Ban,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  LogIn
} from 'lucide-react';

interface Merchant {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
  fortisStatus: string;
  onboardingStatus: string;
  onboardingDetail: string;
  totalProcessed: number;
  totalCustomers: number;
  totalInvoices: number;
  ownerName: string;
  ownerEmail: string;
  restricted: boolean;
  restrictedReason: string | null;
}

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [restrictModalOpen, setRestrictModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [restrictReason, setRestrictReason] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const res = await fetch('/api/admin/merchants', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMerchants(data.merchants || []);
      }
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestrict = async () => {
    if (!selectedMerchant) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/merchants/${selectedMerchant.id}/restrict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: restrictReason }),
      });
      if (res.ok) {
        setMerchants(merchants.map(m => 
          m.id === selectedMerchant.id 
            ? { ...m, restricted: true, restrictedReason: restrictReason }
            : m
        ));
        setRestrictModalOpen(false);
        setSelectedMerchant(null);
        setRestrictReason('');
      }
    } catch (error) {
      console.error('Failed to restrict merchant:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnrestrict = async (merchant: Merchant) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/merchants/${merchant.id}/restrict`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setMerchants(merchants.map(m => 
          m.id === merchant.id 
            ? { ...m, restricted: false, restrictedReason: null }
            : m
        ));
      }
    } catch (error) {
      console.error('Failed to unrestrict merchant:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openRestrictModal = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setRestrictReason('');
    setRestrictModalOpen(true);
  };

  const openDeleteModal = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedMerchant || deleteConfirmText !== 'DELETE') return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/merchants/${selectedMerchant.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setMerchants(merchants.filter(m => m.id !== selectedMerchant.id));
        setDeleteModalOpen(false);
        setSelectedMerchant(null);
        setDeleteConfirmText('');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete merchant');
      }
    } catch (error) {
      console.error('Failed to delete merchant:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoginAs = async (merchant: Merchant) => {
    try {
      const res = await fetch(`/api/admin/merchants/${merchant.id}/login-as`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        window.open('/dashboard', '_blank');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to login as merchant');
      }
    } catch (error) {
      console.error('Failed to login as merchant:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (merchant: Merchant) => {
    const s = merchant.onboardingStatus;
    switch (s) {
      case 'FULLY_SETUP':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Live & Processing
          </span>
        );
      case 'ACTIVE_INCOMPLETE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/15 text-green-300 text-xs rounded-full font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Payment Active
          </span>
        );
      case 'AWAITING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">
            <Clock className="h-3 w-3" />
            Awaiting Approval
          </span>
        );
      case 'BANK_SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/15 text-blue-300 text-xs rounded-full font-medium">
            <Clock className="h-3 w-3" />
            Submitting to Fortis
          </span>
        );
      case 'FORM_ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-medium">
            <XCircle className="h-3 w-3" />
            Application Error
          </span>
        );
      case 'NEEDS_BANK_INFO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
            <Clock className="h-3 w-3" />
            Needs Bank Info
          </span>
        );
      case 'NEEDS_MERCHANT_INFO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/15 text-yellow-300 text-xs rounded-full font-medium">
            <Clock className="h-3 w-3" />
            Needs Merchant Info
          </span>
        );
      case 'NEEDS_PAYMENT_SETUP':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">
            <Circle className="h-3 w-3" />
            Needs Payment Setup
          </span>
        );
      case 'JUST_REGISTERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/20 text-slate-400 text-xs rounded-full font-medium">
            <Circle className="h-3 w-3" />
            Just Registered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/20 text-slate-400 text-xs rounded-full font-medium">
            Unknown
          </span>
        );
    }
  };

  const filteredMerchants = merchants.filter(m => {
    const matchesSearch = search === '' || 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.ownerEmail.toLowerCase().includes(search.toLowerCase());
    
    const s = m.onboardingStatus;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'live' && (s === 'FULLY_SETUP' || s === 'ACTIVE_INCOMPLETE')) ||
      (statusFilter === 'awaiting' && (s === 'AWAITING_APPROVAL' || s === 'BANK_SUBMITTED')) ||
      (statusFilter === 'onboarding' && (s === 'NEEDS_BANK_INFO' || s === 'NEEDS_MERCHANT_INFO' || s === 'NEEDS_PAYMENT_SETUP')) ||
      (statusFilter === 'error' && s === 'FORM_ERROR') ||
      (statusFilter === 'just_registered' && s === 'JUST_REGISTERED') ||
      (statusFilter === 'restricted' && m.restricted);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Merchants</h1>
        <p className="text-slate-400 mt-1">View and manage all merchants on the platform</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search merchants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
        >
          <option value="all">All Status</option>
          <option value="live">Live & Processing</option>
          <option value="awaiting">Awaiting Approval</option>
          <option value="onboarding">In Onboarding</option>
          <option value="error">Application Error</option>
          <option value="just_registered">Just Registered</option>
          <option value="restricted">Restricted</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {merchants.filter(m => (m.onboardingStatus === 'FULLY_SETUP' || m.onboardingStatus === 'ACTIVE_INCOMPLETE') && !m.restricted).length}
                </p>
                <p className="text-sm text-slate-400">Live</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {merchants.filter(m => m.onboardingStatus === 'AWAITING_APPROVAL' || m.onboardingStatus === 'BANK_SUBMITTED').length}
                </p>
                <p className="text-sm text-slate-400">Awaiting</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {merchants.filter(m => ['NEEDS_BANK_INFO', 'NEEDS_MERCHANT_INFO', 'NEEDS_PAYMENT_SETUP'].includes(m.onboardingStatus)).length}
                </p>
                <p className="text-sm text-slate-400">Onboarding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-500/20 rounded-lg flex items-center justify-center">
                <Circle className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {merchants.filter(m => m.onboardingStatus === 'JUST_REGISTERED').length}
                </p>
                <p className="text-sm text-slate-400">New</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Ban className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {merchants.filter(m => m.restricted).length}
                </p>
                <p className="text-sm text-slate-400">Restricted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(merchants.reduce((sum, m) => sum + m.totalProcessed, 0))}
                </p>
                <p className="text-sm text-slate-400">Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Merchants Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Merchant</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Owner</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-400">Processed</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-400">Customers</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Joined</th>
                  <th className="text-center p-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredMerchants.length > 0 ? (
                  filteredMerchants.map((merchant) => (
                    <tr key={merchant.id} className={`hover:bg-slate-700/50 ${merchant.restricted ? 'bg-red-900/10' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {merchant.restricted && (
                            <Ban className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-white">{merchant.name}</p>
                            {merchant.city && merchant.state && (
                              <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {merchant.city}, {merchant.state}
                              </p>
                            )}
                            {merchant.restricted && merchant.restrictedReason && (
                              <p className="text-xs text-red-400 mt-1">
                                {merchant.restrictedReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white">{merchant.ownerName}</p>
                          <p className="text-sm text-slate-400">{merchant.ownerEmail}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5">
                          {getStatusBadge(merchant)}
                          <p className="text-[11px] text-slate-500 leading-tight max-w-[200px]">{merchant.onboardingDetail}</p>
                          {merchant.restricted && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                              <Ban className="h-3 w-3" />
                              Restricted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-white font-medium">
                          {formatCurrency(merchant.totalProcessed)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-white">{merchant.totalCustomers}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-400 text-sm">
                          {new Date(merchant.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-400 border-blue-400/50 hover:bg-blue-500/20"
                            onClick={() => handleLoginAs(merchant)}
                            title="Login as this merchant"
                          >
                            <LogIn className="h-4 w-4" />
                          </Button>
                          {merchant.restricted ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-400 border-green-400/50 hover:bg-green-500/20"
                              onClick={() => handleUnrestrict(merchant)}
                              disabled={actionLoading}
                            >
                              <ShieldCheck className="h-4 w-4 mr-1" />
                              Unrestrict
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-400 border-red-400/50 hover:bg-red-500/20"
                              onClick={() => openRestrictModal(merchant)}
                              disabled={actionLoading}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Restrict
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-400 border-red-400/50 hover:bg-red-500/20"
                            onClick={() => openDeleteModal(merchant)}
                            disabled={actionLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No merchants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Restrict Modal */}
      {restrictModalOpen && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setRestrictModalOpen(false)} 
          />
          <div className="relative bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Restrict Merchant</h3>
                <p className="text-sm text-slate-400">{selectedMerchant.name}</p>
              </div>
            </div>
            
            <p className="text-slate-300 mb-4">
              This will prevent the merchant from accessing their dashboard. They will see a restricted page with a support contact form.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reason for restriction
              </label>
              <textarea
                value={restrictReason}
                onChange={(e) => setRestrictReason(e.target.value)}
                placeholder="e.g., Violation of terms of service, Suspicious activity..."
                className="w-full h-24 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 resize-none"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-600"
                onClick={() => setRestrictModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleRestrict}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Restrict Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setDeleteModalOpen(false)} 
          />
          <div className="relative bg-slate-800 border border-red-700 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Merchant</h3>
                <p className="text-sm text-slate-400">{selectedMerchant.name}</p>
              </div>
            </div>
            
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm font-medium">
                This action is permanent and cannot be undone.
              </p>
              <p className="text-red-400 text-sm mt-1">
                This will delete the merchant, their user account, all customers, transactions, subscriptions, invoices, payment links, products, and all other associated data.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type <span className="font-mono text-red-400">DELETE</span> to confirm
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-600"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={actionLoading || deleteConfirmText !== 'DELETE'}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

