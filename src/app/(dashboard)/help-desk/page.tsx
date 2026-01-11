'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  HelpCircle, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Send,
  ArrowLeft,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Ticket {
  id: number;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: {
    message: string;
    isAdminReply: boolean;
    createdAt: string;
  } | null;
}

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
  messages: Message[];
}

export default function HelpDeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'normal',
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicketForm.subject || !newTicketForm.message) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicketForm),
        credentials: 'include',
      });

      if (res.ok) {
        setShowNewTicket(false);
        setNewTicketForm({ subject: '', message: '', category: 'general', priority: 'normal' });
        fetchTickets();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create ticket');
      }
    } catch (error) {
      alert('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const viewTicket = async (ticketId: number) => {
    setLoadingTicket(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
      }
    } catch (error) {
      console.error('Failed to load ticket:', error);
    } finally {
      setLoadingTicket(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.message],
        } : null);
        setNewMessage('');
        fetchTickets(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
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

  // Ticket detail view
  if (selectedTicket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedTicket(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{selectedTicket.subject}</h1>
              {getStatusBadge(selectedTicket.status)}
              {getPriorityBadge(selectedTicket.priority)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedTicket.ticketNumber} • Created {new Date(selectedTicket.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {/* Messages */}
            <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
              {selectedTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isAdminReply ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.isAdminReply
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.isAdminReply ? 'text-gray-500' : 'text-primary-foreground/70'}`}>
                      {msg.user.name} • {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply input */}
            {selectedTicket.status !== 'closed' && selectedTicket.status !== 'archived' && (
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={sendingMessage}
                  />
                  <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}>
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <HelpCircle className="h-6 w-6" />
            Help Desk
          </h1>
          <p className="mt-1 text-muted-foreground">
            Submit support tickets and track your requests
          </p>
        </div>
        <Button onClick={() => setShowNewTicket(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tickets yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Need help? Submit a support ticket and we'll get back to you.
            </p>
            <Button onClick={() => setShowNewTicket(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => viewTicket(ticket.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <h3 className="font-medium">{ticket.subject}</h3>
                    {ticket.lastMessage && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {ticket.lastMessage.isAdminReply && <span className="text-primary">Support: </span>}
                        {ticket.lastMessage.message}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{new Date(ticket.updatedAt).toLocaleDateString()}</p>
                    <p className="flex items-center gap-1 justify-end mt-1">
                      <MessageSquare className="h-3 w-3" />
                      {ticket.messageCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject *</label>
              <Input
                value={newTicketForm.subject}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                placeholder="Brief description of your issue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                  value={newTicketForm.category}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                >
                  <option value="general">General</option>
                  <option value="billing">Billing</option>
                  <option value="technical">Technical</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="bug_report">Bug Report</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <select
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                  value={newTicketForm.priority}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message *</label>
              <textarea
                className="w-full min-h-[150px] px-3 py-2 rounded-lg border border-border bg-background text-sm"
                value={newTicketForm.message}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
                placeholder="Describe your issue in detail..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTicket(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateTicket} 
              disabled={submitting || !newTicketForm.subject || !newTicketForm.message}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Ticket'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

