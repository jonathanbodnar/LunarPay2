'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Ticket, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Archive,
  AlertCircle,
  Loader2,
  Filter,
  Building2,
  User
} from 'lucide-react';

interface TicketItem {
  id: number;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  organization: {
    id: number;
    name: string;
  } | null;
  messageCount: number;
  lastMessage: {
    message: string;
    isAdminReply: boolean;
    createdAt: string;
  } | null;
}

interface StatusCounts {
  all: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  archived: number;
}

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({
    all: 0, open: 0, in_progress: 0, resolved: 0, closed: 0, archived: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);

      const res = await fetch(`/api/admin/tickets?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setCounts(data.counts || { all: 0, open: 0, in_progress: 0, resolved: 0, closed: 0, archived: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-yellow-500/20 text-yellow-400',
      resolved: 'bg-green-500/20 text-green-400',
      closed: 'bg-slate-500/20 text-slate-400',
      archived: 'bg-slate-500/20 text-slate-500',
    };
    const labels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
      archived: 'Archived',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${styles[status] || styles.open}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-slate-500/20 text-slate-400',
      normal: 'bg-blue-500/20 text-blue-400',
      high: 'bg-orange-500/20 text-orange-400',
      urgent: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${styles[priority] || styles.normal}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const statusTabs = [
    { key: 'all', label: 'All', icon: Ticket },
    { key: 'open', label: 'Open', icon: AlertCircle },
    { key: 'in_progress', label: 'In Progress', icon: Clock },
    { key: 'resolved', label: 'Resolved', icon: CheckCircle2 },
    { key: 'closed', label: 'Closed', icon: CheckCircle2 },
    { key: 'archived', label: 'Archived', icon: Archive },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <p className="text-slate-400 mt-1">Manage customer support requests from all merchants</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={statusFilter === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.key)}
            className={`whitespace-nowrap ${
              statusFilter === tab.key 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
              statusFilter === tab.key ? 'bg-white/20' : 'bg-slate-700'
            }`}>
              {counts[tab.key as keyof StatusCounts]}
            </span>
          </Button>
        ))}
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <select
          className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-slate-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No tickets found</h3>
            <p className="text-slate-400 text-center">
              {statusFilter !== 'all' 
                ? `No ${statusFilter.replace('_', ' ')} tickets`
                : 'No support tickets have been submitted yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="bg-slate-800 border-slate-700 cursor-pointer hover:border-blue-500/50 transition-colors"
              onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-slate-500">{ticket.ticketNumber}</span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      {ticket.category && (
                        <span className="text-xs text-slate-500">• {ticket.category}</span>
                      )}
                    </div>
                    <h3 className="font-medium text-white">{ticket.subject}</h3>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.user.name}
                      </span>
                      {ticket.organization && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {ticket.organization.name}
                        </span>
                      )}
                    </div>

                    {ticket.lastMessage && (
                      <p className="text-sm text-slate-400 mt-2 line-clamp-1">
                        {ticket.lastMessage.isAdminReply ? (
                          <span className="text-green-400 font-medium">You: </span>
                        ) : (
                          <span className="text-blue-400 font-medium">Customer: </span>
                        )}
                        {ticket.lastMessage.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right text-xs text-slate-500">
                    <p>{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    <p className="flex items-center gap-1 justify-end mt-1">
                      <MessageSquare className="h-3 w-3" />
                      {ticket.messageCount}
                    </p>
                    {ticket.lastMessage && !ticket.lastMessage.isAdminReply && ticket.status !== 'closed' && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
                        Needs Reply
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

