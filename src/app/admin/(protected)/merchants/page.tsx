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
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Users,
  FileText,
  Ban,
  ShieldCheck,
  AlertTriangle
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
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [restrictReason, setRestrictReason] = useState('');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        );
      case 'PENDING':
      case 'BANK_INFORMATION_SENT':
      case 'APPLICATION_SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
            <XCircle className="h-3 w-3" />
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-500/20 text-slate-400 text-xs rounded-full">
            Not Started
          </span>
        );
    }
  };

  const filteredMerchants = merchants.filter(m => {
    const matchesSearch = search === '' || 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.ownerEmail.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && m.fortisStatus === 'ACTIVE') ||
      (statusFilter === 'pending' && ['PENDING', 'BANK_INFORMATION_SENT', 'APPLICATION_SUBMITTED'].includes(m.fortisStatus)) ||
      (statusFilter === 'not_started' && !m.fortisStatus) ||
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
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="not_started">Not Started</option>
          <option value="restricted">Restricted</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {merchants.filter(m => m.fortisStatus === 'ACTIVE' && !m.restricted).length}
                </p>
                <p className="text-sm text-slate-400">Active Merchants</p>
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
                  {merchants.filter(m => ['PENDING', 'BANK_INFORMATION_SENT', 'APPLICATION_SUBMITTED'].includes(m.fortisStatus)).length}
                </p>
                <p className="text-sm text-slate-400">Pending Applications</p>
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
                <p className="text-sm text-slate-400">Total Processed</p>
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
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(merchant.fortisStatus)}
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
                        <div className="flex justify-center">
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
    </div>
  );
}

