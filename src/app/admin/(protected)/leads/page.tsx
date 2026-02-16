'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Loader2, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Phone,
  Trash2,
  ArrowUpRight
} from 'lucide-react';

interface Lead {
  id: number;
  email: string;
  phone: string | null;
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  converted: boolean;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({ total: 0, converted: 0, unconverted: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/admin/leads', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setStats(data.stats || { total: 0, converted: 0, unconverted: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setLeads(leads.filter(l => l.id !== id));
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          converted: leads.find(l => l.id === id)?.converted ? prev.converted - 1 : prev.converted,
          unconverted: !leads.find(l => l.id === id)?.converted ? prev.unconverted - 1 : prev.unconverted,
        }));
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredLeads = leads.filter(l => {
    const q = search.toLowerCase();
    const matchesSearch = search === '' || l.email.toLowerCase().includes(q) || (l.phone && l.phone.toLowerCase().includes(q));
    const matchesFilter = filter === 'all' ||
      (filter === 'converted' && l.converted) ||
      (filter === 'unconverted' && !l.converted);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  const timeSince = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

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
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <p className="text-slate-400 mt-1">Emails collected from the website before registration</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-slate-400">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.converted}</p>
                <p className="text-sm text-slate-400">Converted (Registered)</p>
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
                <p className="text-2xl font-bold text-white">{stats.unconverted}</p>
                <p className="text-sm text-slate-400">Not Yet Registered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
        >
          <option value="all">All Leads</option>
          <option value="unconverted">Not Registered</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      {/* Leads Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Phone</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Source</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">UTM</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Captured</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Last Seen</th>
                  <th className="text-center p-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-700/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-white font-medium">{lead.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {lead.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <span className="text-white text-sm">{lead.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-slate-400 text-sm capitalize">{lead.source || 'unknown'}</span>
                      </td>
                      <td className="p-4">
                        {(lead.utmSource || lead.utmMedium || lead.utmCampaign) ? (
                          <div className="space-y-0.5">
                            {lead.utmSource && (
                              <span className="inline-block px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded mr-1" title="utm_source">
                                {lead.utmSource}
                              </span>
                            )}
                            {lead.utmMedium && (
                              <span className="inline-block px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded mr-1" title="utm_medium">
                                {lead.utmMedium}
                              </span>
                            )}
                            {lead.utmCampaign && (
                              <span className="inline-block px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded" title="utm_campaign">
                                {lead.utmCampaign}
                              </span>
                            )}
                            {(lead.utmTerm || lead.utmContent) && (
                              <div>
                                {lead.utmTerm && (
                                  <span className="inline-block px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded mr-1" title="utm_term">
                                    {lead.utmTerm}
                                  </span>
                                )}
                                {lead.utmContent && (
                                  <span className="inline-block px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded" title="utm_content">
                                    {lead.utmContent}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        {lead.converted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Registered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                            <Clock className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-slate-400 text-sm" title={formatDate(lead.createdAt)}>
                          {timeSince(lead.createdAt)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-400 text-sm" title={formatDate(lead.updatedAt)}>
                          {timeSince(lead.updatedAt)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-400 border-red-400/50 hover:bg-red-500/20"
                            onClick={() => handleDelete(lead.id)}
                            disabled={actionLoading === lead.id}
                          >
                            {actionLoading === lead.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      {search || filter !== 'all' ? 'No leads match your filters' : 'No leads captured yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
