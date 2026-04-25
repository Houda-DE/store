import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getSocket, disconnectSocket } from '../hooks/useSocket';
import { api } from '../api/client';

interface ChatContextType {
  socket: Socket | null;
  totalUnread: number;
  refreshUnread: () => void;
}

const ChatContext = createContext<ChatContextType>({
  socket: null,
  totalUnread: 0,
  refreshUnread: () => {},
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  const refreshUnread = useCallback(() => {
    if (!user) return;
    api.get<{ count: number }>('/chat/unread')
      .then(r => setTotalUnread(r.count))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user || !token) {
      disconnectSocket();
      setSocket(null);
      setTotalUnread(0);
      return;
    }

    const s = getSocket(token);
    setSocket(s);

    s.on('new_message', refreshUnread);
    s.on('messages_read', refreshUnread);

    refreshUnread();

    return () => {
      s.off('new_message', refreshUnread);
      s.off('messages_read', refreshUnread);
    };
  }, [user, token, refreshUnread]);

  return (
    <ChatContext.Provider value={{ socket, totalUnread, refreshUnread }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
