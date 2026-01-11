'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  User, 
  Building2, 
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';

interface Message {
  id: number;
  message: string;
  isAdminReply: boolean;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface TicketDetail {
  id: number;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  user: {
    id: number;
    name: string;
    email: string;
  };
  organization: {
    id: number;
    name: string;
  } | null;
  messages: Message[];
}

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${params.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
      } else if (res.status === 403) {
        router.push('/admin/tickets');
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!ticket || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setTicket(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.message],
        } : null);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!ticket) return;

    setUpdatingStatus(true);
    setShowActions(false);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      });

      if (res.ok) {
        setTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingStatus(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-lg font-medium">Ticket not found</h2>
        <Button variant="outline" onClick={() => router.push('/admin/tickets')} className="mt-4">
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/tickets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono text-muted-foreground">{ticket.ticketNumber}</span>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
            <h1 className="text-xl font-semibold mt-1">{ticket.subject}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {ticket.user.name} ({ticket.user.email})
              </span>
              {ticket.organization && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {ticket.organization.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions dropdown */}
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowActions(!showActions)}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <MoreVertical className="h-4 w-4 mr-2" />
                Actions
              </>
            )}
          </Button>
          
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-10">
              <div className="py-1">
                {ticket.status !== 'in_progress' && (
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => updateStatus('in_progress')}
                  >
                    <Clock className="h-4 w-4 text-yellow-600" />
                    Mark In Progress
                  </button>
                )}
                {ticket.status !== 'resolved' && (
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => updateStatus('resolved')}
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Mark Resolved
                  </button>
                )}
                {ticket.status !== 'closed' && (
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => updateStatus('closed')}
                  >
                    <XCircle className="h-4 w-4 text-gray-600" />
                    Close Ticket
                  </button>
                )}
                {ticket.status !== 'archived' && (
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => updateStatus('archived')}
                  >
                    <Archive className="h-4 w-4 text-gray-500" />
                    Archive
                  </button>
                )}
                {ticket.status !== 'open' && (
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => updateStatus('open')}
                  >
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    Reopen Ticket
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <Card className="flex flex-col" style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}>
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {ticket.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isAdminReply ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    msg.isAdminReply
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <div className={`flex items-center gap-2 mt-2 text-xs ${
                    msg.isAdminReply ? 'text-primary-foreground/70' : 'text-gray-500'
                  }`}>
                    <span>{msg.user.name}</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        {/* Reply input */}
        {ticket.status !== 'closed' && ticket.status !== 'archived' && (
          <div className="border-t p-4">
            <div className="flex gap-2">
              <textarea
                className="flex-1 min-h-[80px] px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                placeholder="Type your reply... (Enter to send, Shift+Enter for new line)"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={sendingMessage}
              />
              <Button 
                onClick={sendMessage} 
                disabled={sendingMessage || !newMessage.trim()}
                className="self-end"
              >
                {sendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {(ticket.status === 'closed' || ticket.status === 'archived') && (
          <div className="border-t p-4 bg-gray-50 text-center text-sm text-muted-foreground">
            This ticket is {ticket.status}. Reopen it to send more messages.
          </div>
        )}
      </Card>
    </div>
  );
}

