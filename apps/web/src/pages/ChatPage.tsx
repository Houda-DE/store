import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import type { Conversation, Message } from '../api/types';
import './ChatPage.css';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSep(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
}

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const convId = Number(id);
  const { user } = useAuth();
  const { socket, refreshUnread } = useChat();

  const [conv, setConv] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    Promise.all([
      api.get<Conversation[]>('/chat/conversations'),
      api.get<Message[]>(`/chat/conversations/${convId}/messages`),
    ]).then(([convList, messages]) => {
      setConv((convList as Conversation[]).find(c => c.id === convId) ?? null);
      setMsgs(messages);
      setHasMore(messages.length === 50);
    }).finally(() => setLoading(false));
  }, [convId]);

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView();
  }, [loading]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join', { conversationId: convId });

    const onMessage = (msg: Message) => {
      if (msg.conversationId !== convId) return;
      setMsgs(prev => [...prev, msg]);
      refreshUnread();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const onTyping = (data: { userId: string }) => {
      if (data.userId === user?.id) return;
      setIsTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsTyping(false), 2000);
    };

    socket.on('new_message', onMessage);
    socket.on('typing', onTyping);

    return () => {
      socket.emit('leave', { conversationId: convId });
      socket.off('new_message', onMessage);
      socket.off('typing', onTyping);
      clearTimeout(typingTimer.current);
    };
  }, [socket, convId, user, refreshUnread]);

  const loadOlder = async () => {
    if (!hasMore || msgs.length === 0) return;
    const older = await api.get<Message[]>(`/chat/conversations/${convId}/messages?before=${msgs[0].id}`);
    setMsgs(prev => [...older, ...prev]);
    setHasMore(older.length === 50);
  };

  const sendMessage = useCallback(() => {
    if (!input.trim() || !socket) return;
    socket.emit('send_message', { conversationId: convId, body: input.trim() });
    setInput('');
  }, [input, socket, convId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (socket) {
      socket.emit('typing', { conversationId: convId });
    }
  };

  const initials = conv?.otherEmail?.[0]?.toUpperCase() ?? '?';

  // Group messages with date separators
  const messageRows: Array<{ type: 'sep'; label: string } | { type: 'msg'; msg: Message }> = [];
  let lastDate = '';
  for (const msg of msgs) {
    const d = new Date(msg.createdAt).toDateString();
    if (d !== lastDate) {
      messageRows.push({ type: 'sep', label: formatDateSep(msg.createdAt) });
      lastDate = d;
    }
    messageRows.push({ type: 'msg', msg });
  }

  if (loading) {
    return (
      <main className="chat-page">
        <div className="chat-loading">Loading…</div>
      </main>
    );
  }

  return (
    <main className="chat-page">
      <div className="chat-header">
        <Link to="/conversations" className="chat-back">←</Link>
        <div className="chat-avatar">{initials}</div>
        <div className="chat-header-info">
          <span className="chat-header-name">{conv?.otherEmail ?? '—'}</span>
          {conv && <span className="chat-header-item">re: {conv.itemName}</span>}
        </div>
      </div>

      <div className="chat-messages">
        {hasMore && (
          <button className="chat-load-older" onClick={loadOlder}>Load older messages</button>
        )}

        {msgs.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <span>No messages yet. Say hello!</span>
          </div>
        )}

        {messageRows.map((row, i) =>
          row.type === 'sep' ? (
            <div key={`sep-${i}`} className="chat-date-sep">{row.label}</div>
          ) : (
            <div
              key={row.msg.id}
              className={`chat-bubble ${row.msg.senderId === user?.id ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}
            >
              <p className="chat-bubble-body">{row.msg.body}</p>
              <span className="chat-bubble-time">{formatTime(row.msg.createdAt)}</span>
            </div>
          )
        )}

        {isTyping && (
          <div className="chat-typing">
            <span /><span /><span />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
        />
        <button className="chat-send" onClick={sendMessage} disabled={!input.trim()} aria-label="Send">
          ➤
        </button>
      </div>
    </main>
  );
}
