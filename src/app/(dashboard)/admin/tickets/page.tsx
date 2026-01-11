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
      } else if (res.status === 403) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      archived: 'bg-gray-100 text-gray-500',
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
      low: 'bg-gray-100 text-gray-600',
      normal: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600',
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
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Ticket className="h-6 w-6" />
          Support Tickets
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage customer support requests
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={statusFilter === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.key)}
            className="whitespace-nowrap"
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
            <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {counts[tab.key as keyof StatusCounts]}
            </span>
          </Button>
        ))}
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
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
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tickets found</h3>
            <p className="text-muted-foreground text-center">
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
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      {ticket.category && (
                        <span className="text-xs text-muted-foreground">• {ticket.category}</span>
                      )}
                    </div>
                    <h3 className="font-medium">{ticket.subject}</h3>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                        {ticket.lastMessage.isAdminReply ? (
                          <span className="text-green-600 font-medium">You: </span>
                        ) : (
                          <span className="text-blue-600 font-medium">Customer: </span>
                        )}
                        {ticket.lastMessage.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    <p className="flex items-center gap-1 justify-end mt-1">
                      <MessageSquare className="h-3 w-3" />
                      {ticket.messageCount}
                    </p>
                    {ticket.lastMessage && !ticket.lastMessage.isAdminReply && ticket.status !== 'closed' && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
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

