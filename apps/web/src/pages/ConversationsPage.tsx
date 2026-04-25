import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import type { Conversation } from '../api/types';
import './ConversationsPage.css';

export function ConversationsPage() {
  const { user } = useAuth();
  const { socket } = useChat();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    api.get<Conversation[]>('/chat/conversations')
      .then(setConvs)
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_message', reload);
    return () => { socket.off('new_message', reload); };
  }, [socket]);

  if (loading) return <div className="convs-loading">Loading…</div>;

  return (
    <main className="convs-page">
      <h1 className="convs-title">Messages</h1>
      {convs.length === 0 ? (
        <p className="convs-empty">No conversations yet. Browse items and message a seller to get started.</p>
      ) : (
        <ul className="convs-list">
          {convs.map(conv => (
            <li key={conv.id}>
              <Link
                to={`/conversations/${conv.id}`}
                className={`convs-link${conv.unreadCount > 0 ? ' convs-link--unread' : ''}`}
              >
                <div className="convs-meta">
                  <span className="convs-other">{conv.otherEmail}</span>
                  <span className="convs-item-name">re: {conv.itemName}</span>
                  {conv.lastMessageBody && (
                    <span className="convs-preview">{conv.lastMessageBody}</span>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="convs-unread-dot">{conv.unreadCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
