'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, User, Mail, Calendar, Loader2 } from 'lucide-react';

interface ChatMessage { id: number; senderType: string; content: string; createdAt: string; }
interface ConvPreview {
  id: number; status: string; unreadByAdmin: number; lastMessageAt: string; createdAt: string;
  user: { id: number; firstName: string | null; lastName: string | null; email: string; createdOn: string };
  lastMessage: { content: string; senderType: string; createdAt: string } | null;
}
interface ConvDetail {
  id: number; status: string; lastMessageAt: string; createdAt: string;
  user: { id: number; firstName: string | null; lastName: string | null; email: string; createdOn: string };
}

const timeAgo = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
};
const fmtTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const userName = (u: { firstName: string | null; lastName: string | null; email: string }) =>
  [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<ConvPreview[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ConvDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scroll = useCallback(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), []);
  useEffect(() => { scroll(); }, [messages, scroll]);

  const fetchList = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/chat', { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setConversations(d.conversations); }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const fetchDetail = useCallback(async (id: number) => {
    try {
      const r = await fetch(`/api/admin/chat/${id}`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setDetail(d.conversation); setMessages(d.messages); }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchList();
      if (selectedId) fetchDetail(selectedId);
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedId, fetchList, fetchDetail]);

  const select = (id: number) => { setSelectedId(id); fetchDetail(id); };

  const sendReply = async () => {
    const content = input.trim();
    if (!content || sending || !selectedId) return;
    setSending(true); setInput('');
    setMessages((p) => [...p, { id: Date.now(), senderType: 'admin', content, createdAt: new Date().toISOString() }]);
    try {
      const r = await fetch(`/api/admin/chat/${selectedId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ content }),
      });
      if (r.ok) { fetchDetail(selectedId); fetchList(); }
    } catch { /* silent */ } finally { setSending(false); }
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } };

  if (loading) return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-white"><MessageCircle className="h-6 w-6" />Live Chat</h1>
        <p className="text-slate-400 mt-1">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800" style={{ height: 'calc(100vh - 260px)' }}>
        <div className="flex h-full">
          {/* Left panel */}
          <div className="w-80 border-r border-slate-700 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80"><h2 className="font-semibold text-sm text-slate-300">Conversations</h2></div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">No conversations yet</div>
              ) : conversations.map((c) => (
                <button key={c.id} onClick={() => select(c.id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors ${selectedId === c.id ? 'bg-blue-600/20 border-l-2 border-l-blue-500' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {c.unreadByAdmin > 0 && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                      <span className="font-medium text-sm text-slate-200 truncate">{userName(c.user)}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0">{c.lastMessageAt ? timeAgo(c.lastMessageAt) : ''}</span>
                  </div>
                  {c.lastMessage && <p className="text-xs text-slate-400 mt-1 truncate pl-4">{c.lastMessage.senderType === 'admin' ? 'You: ' : ''}{c.lastMessage.content}</p>}
                </button>
              ))}
            </div>
          </div>
          {/* Right panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Select a conversation</div>
            ) : (
              <>
                {detail && (
                  <div className="px-5 py-3 border-b border-slate-700 bg-slate-800/80 shrink-0">
                    <h3 className="font-semibold text-sm text-slate-200">{userName(detail.user)}</h3>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{detail.user.email}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Joined {fmtDate(detail.user.createdOn)}</span>
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {messages.map((m) => (
                    <div key={m.id}>
                      {m.senderType === 'admin' ? (
                        <div className="flex justify-end">
                          <div>
                            <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-md"><p className="text-sm whitespace-pre-wrap">{m.content}</p></div>
                            <div className="text-[10px] text-slate-500 text-right mt-1 mr-1">Admin &middot; {fmtTime(m.createdAt)}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-600 text-slate-300 flex items-center justify-center text-xs font-medium shrink-0"><User className="h-3.5 w-3.5" /></div>
                          <div>
                            <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-md"><p className="text-sm text-slate-200 whitespace-pre-wrap">{m.content}</p></div>
                            <div className="text-[10px] text-slate-500 mt-1 ml-1">{m.senderType === 'system' ? 'Auto' : 'User'} &middot; {fmtTime(m.createdAt)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                <div className="px-5 py-3 border-t border-slate-700 bg-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
                      placeholder="Type a reply..." className="flex-1 px-4 py-2.5 bg-slate-700 rounded-full text-sm text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-500" />
                    <button onClick={sendReply} disabled={!input.trim() || sending}
                      className="p-2.5 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
