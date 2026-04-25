import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CustomJwtService } from '../auth/jwt.service';
import { ChatService } from './chat.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: CustomJwtService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) throw new Error('No token');

      const payload = await this.jwtService.verifyAccessToken(token);
      (socket as any).user = { id: payload.sub, email: payload.email, role: payload.role };

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(socket.id);
    } catch {
      socket.emit('auth_error', { message: 'Invalid or expired token' });
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket) {
    const user = (socket as any).user;
    if (user) {
      const set = this.userSockets.get(user.id);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) this.userSockets.delete(user.id);
      }
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const user = (socket as any).user;
    if (!user) throw new WsException('Unauthorized');

    try {
      await this.chatService.getConversation(data.conversationId, user.id);
    } catch {
      throw new WsException('Access denied');
    }

    await socket.join(`conv:${data.conversationId}`);
    await this.chatService.markRead(data.conversationId, user.id);
    socket.to(`conv:${data.conversationId}`).emit('messages_read', {
      conversationId: data.conversationId,
      readerId: user.id,
    });

    return { joined: true };
  }

  @SubscribeMessage('leave')
  async handleLeave(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    await socket.leave(`conv:${data.conversationId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: number; body: string },
  ) {
    const user = (socket as any).user;
    if (!user) throw new WsException('Unauthorized');

    const body = (data.body ?? '').trim();
    if (!body || body.length > 2000) throw new WsException('Invalid message');

    const conv = await this.chatService.getConversation(data.conversationId, user.id);
    const message = await this.chatService.saveMessage(data.conversationId, user.id, body);

    const payload = {
      id: message.id,
      conversationId: data.conversationId,
      senderId: user.id,
      body: message.body,
      isRead: false,
      createdAt: message.createdAt,
    };

    this.server.to(`conv:${data.conversationId}`).emit('new_message', payload);

    // Push to the other participant's sockets that are not in the room
    const otherUserId = user.id === conv.customerId ? conv.sellerId : conv.customerId;
    const otherSockets = this.userSockets.get(otherUserId);
    if (otherSockets) {
      for (const sid of otherSockets) {
        const otherSocket = this.server.of('/chat').sockets.get(sid);
        if (otherSocket && !otherSocket.rooms.has(`conv:${data.conversationId}`)) {
          otherSocket.emit('new_message', payload);
        }
      }
    }

    return payload;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const user = (socket as any).user;
    if (!user) return;
    socket.to(`conv:${data.conversationId}`).emit('typing', {
      conversationId: data.conversationId,
      userId: user.id,
    });
  }
}
