'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, MessageCircle, Check, CheckCheck } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

interface ChatMessage {
  id: number;
  senderType: 'user' | 'admin' | 'system';
  content: string;
  createdAt: string;
  readAt: string | null;
}

interface ChatWidgetProps {
  firstName: string;
  isGettingStartedPage: boolean;
}

type WidgetState = 'hidden' | 'popup' | 'widget' | 'bubble';

export default function ChatWidget({ firstName, isGettingStartedPage }: ChatWidgetProps) {
  const [widgetState, setWidgetState] = useState<WidgetState>('hidden');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [autoMessageShown, setAutoMessageShown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [hasConversation, setHasConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const exitIntentFired = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const autoMessage = `Hey ${firstName || 'there'} — Jonathan, Founder of LunarPay here.\n\nI'm around if you need anything while setting up.`;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, showTyping, scrollToBottom]);

  // Check for existing conversation on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/chat', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.conversation && data.messages.length > 0) {
            setMessages(data.messages);
            setHasConversation(true);
            setAutoMessageShown(true);
            if (data.conversation.unreadByUser > 0) setUnreadCount(data.conversation.unreadByUser);
            setWidgetState('bubble');
          }
        }
      } catch { /* silent */ }
    })();
  }, []);

  // Exit-intent detection
  useEffect(() => {
    if (!isGettingStartedPage || widgetState !== 'hidden') return;
    if (sessionStorage.getItem('lunarpay_chat_exit_intent')) return;

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentFired.current) {
        exitIntentFired.current = true;
        sessionStorage.setItem('lunarpay_chat_exit_intent', '1');
        triggerPopup();
      }
    };
    const onPopState = () => {
      if (!exitIntentFired.current) {
        exitIntentFired.current = true;
        sessionStorage.setItem('lunarpay_chat_exit_intent', '1');
        triggerPopup();
      }
    };
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('popstate', onPopState);
    return () => {
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('popstate', onPopState);
    };
  }, [isGettingStartedPage, widgetState]);

  // Poll for new messages
  useEffect(() => {
    if (!hasConversation || widgetState === 'hidden') return;
    const poll = async () => {
      try {
        const res = await fetch('/api/chat', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.messages) setMessages(data.messages);
          if (widgetState === 'bubble' && data.conversation?.unreadByUser > 0) {
            setUnreadCount(data.conversation.unreadByUser);
          }
        }
      } catch { /* silent */ }
    };
    pollIntervalRef.current = setInterval(poll, 4000);
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [hasConversation, widgetState]);

  const triggerPopup = () => {
    if (hasConversation) { setWidgetState('widget'); setUnreadCount(0); return; }
    setWidgetState('popup');
    setShowTyping(true);
    setTimeout(() => {
      setShowTyping(false);
      setAutoMessageShown(true);
      setMessages([{ id: -1, senderType: 'system', content: autoMessage, createdAt: new Date().toISOString(), readAt: null }]);
    }, 2000);
  };

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || sending) return;
    setSending(true);
    setInputValue('');
    setMessages((prev) => [...prev, { id: Date.now(), senderType: 'user', content, createdAt: new Date().toISOString(), readAt: null }]);
    try {
      const payload: { content: string; autoMessage?: string } = { content };
      if (!hasConversation && autoMessageShown) {
        payload.autoMessage = autoMessage;
      }
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(payload),
      });
      if (res.ok) {
        setHasConversation(true);
        if (widgetState === 'popup') setWidgetState('widget');
        const chatRes = await fetch('/api/chat', { credentials: 'include' });
        if (chatRes.ok) { const data = await chatRes.json(); setMessages(data.messages); }
      }
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleBubbleClick = () => {
    setUnreadCount(0);
    if (hasConversation) { setWidgetState('widget'); fetch('/api/chat', { credentials: 'include' }); }
    else triggerPopup();
  };

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- BUBBLE ---
  if (widgetState === 'bubble') {
    return (
      <button onClick={handleBubbleClick} className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-black rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors">
        <MessageCircle className="h-6 w-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  if (widgetState === 'hidden') return null;

  // --- Shared message renderer ---
  const renderMsg = (msg: ChatMessage, idx: number, arr: ChatMessage[], maxW = 'max-w-[260px]') => {
    const isLastUserMsg = msg.senderType === 'user' && (idx === arr.length - 1 || arr.slice(idx + 1).every((m) => m.senderType !== 'user'));
    return (
      <div key={msg.id}>
        {msg.senderType === 'user' ? (
          <div className="flex justify-end">
            <div>
              <div className={`bg-black text-white rounded-2xl rounded-tr-sm px-4 py-2.5 ${maxW}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {widgetState === 'widget' && (
                <div className="flex items-center justify-end gap-1 mt-1 mr-1">
                  <span className="text-[10px] text-gray-400">{fmtTime(msg.createdAt)}</span>
                  {isLastUserMsg && (
                    msg.readAt ? (
                      <CheckCheck className="h-3 w-3 text-blue-500" />
                    ) : (
                      <Check className="h-3 w-3 text-gray-400" />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium shrink-0">J</div>
            <div>
              {widgetState === 'popup' && <div className="text-xs text-gray-500 mb-1 ml-1">Jonathan</div>}
              <div className={`bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-gray-100 ${maxW}`}>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
              </div>
              {widgetState === 'widget' && <div className="text-[10px] text-gray-400 mt-1 ml-1">{fmtTime(msg.createdAt)}</div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Input bar ---
  const inputBar = (
    <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
      <div className="flex items-center gap-2">
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Type a message..." className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-400" />
        <button onClick={handleSend} disabled={!inputValue.trim() || sending}
          className="p-2.5 bg-black rounded-full text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  // --- POPUP (phone-shaped modal) ---
  if (widgetState === 'popup') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="relative w-[375px] h-[550px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200" style={{ maxHeight: '90vh', maxWidth: '95vw' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-lg text-gray-900">LunarPay</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 border border-red-200 rounded-full text-xs font-medium text-red-600">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />Live
              </span>
            </div>
            <button onClick={() => setWidgetState('bubble')} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
            {showTyping && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium shrink-0">J</div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-gray-100"><TypingIndicator /></div>
              </div>
            )}
            {autoMessageShown && messages.map((m, i, arr) => renderMsg(m, i, arr))}
            <div ref={messagesEndRef} />
          </div>
          {inputBar}
        </div>
      </div>
    );
  }

  // --- WIDGET (Intercom-style bottom-right) ---
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
      style={{ height: '500px', maxHeight: 'calc(100vh - 48px)', maxWidth: 'calc(100vw - 48px)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">J</div>
          <div><div className="font-semibold text-sm text-gray-900">Jonathan</div><div className="text-xs text-gray-500">LunarPay Founder</div></div>
        </div>
        <button onClick={() => setWidgetState('bubble')} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
        {messages.map((m, i, arr) => renderMsg(m, i, arr))}
        <div ref={messagesEndRef} />
      </div>
      {inputBar}
    </div>
  );
}
