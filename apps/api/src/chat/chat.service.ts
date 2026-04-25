import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { eq, or, and, desc, sql, lt } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { conversations, messages, users, items } from '../db/schema';

@Injectable()
export class ChatService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
  ) {}

  async getOrCreateConversation(customerId: string, sellerId: string, itemId: number) {
    const [existing] = await this.db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.customerId, customerId),
          eq(conversations.sellerId, sellerId),
          eq(conversations.itemId, itemId),
        ),
      )
      .limit(1);

    if (existing) return existing;

    await this.db.insert(conversations).values({ customerId, sellerId, itemId });

    const [created] = await this.db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.customerId, customerId),
          eq(conversations.sellerId, sellerId),
          eq(conversations.itemId, itemId),
        ),
      )
      .limit(1);

    return created;
  }

  async listConversations(userId: string) {
    return this.db
      .select({
        id: conversations.id,
        customerId: conversations.customerId,
        sellerId: conversations.sellerId,
        itemId: conversations.itemId,
        createdAt: conversations.createdAt,
        itemName: items.name,
        otherEmail: sql<string>`CASE WHEN ${conversations.customerId} = ${userId} THEN seller.email ELSE customer.email END`,
        lastMessageBody: sql<string>`(SELECT body FROM messages m2 WHERE m2.conversation_id = ${conversations.id} ORDER BY m2.id DESC LIMIT 1)`,
        lastMessageAt: sql<Date>`(SELECT created_at FROM messages m3 WHERE m3.conversation_id = ${conversations.id} ORDER BY m3.id DESC LIMIT 1)`,
        unreadCount: sql<number>`(SELECT COUNT(*) FROM messages m4 WHERE m4.conversation_id = ${conversations.id} AND m4.sender_id != ${userId} AND m4.is_read = false)`,
      })
      .from(conversations)
      .innerJoin(items, eq(items.id, conversations.itemId))
      .innerJoin(
        sql`users AS customer`,
        sql`customer.id = ${conversations.customerId}`,
      )
      .innerJoin(
        sql`users AS seller`,
        sql`seller.id = ${conversations.sellerId}`,
      )
      .where(or(eq(conversations.customerId, userId), eq(conversations.sellerId, userId)))
      .orderBy(
        desc(sql`(SELECT created_at FROM messages m5 WHERE m5.conversation_id = ${conversations.id} ORDER BY m5.id DESC LIMIT 1)`),
      );
  }

  async getConversation(conversationId: number, userId: string) {
    const [conv] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.customerId !== userId && conv.sellerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return conv;
  }

  async getMessages(conversationId: number, userId: string, before?: number) {
    await this.getConversation(conversationId, userId);

    const rows = await this.db
      .select()
      .from(messages)
      .where(
        before
          ? and(eq(messages.conversationId, conversationId), lt(messages.id, before))
          : eq(messages.conversationId, conversationId),
      )
      .orderBy(desc(messages.id))
      .limit(50);

    return rows.reverse();
  }

  async saveMessage(conversationId: number, senderId: string, body: string) {
    await this.db.insert(messages).values({ conversationId, senderId, body });

    const [saved] = await this.db
      .select()
      .from(messages)
      .where(
        and(eq(messages.conversationId, conversationId), eq(messages.senderId, senderId)),
      )
      .orderBy(desc(messages.id))
      .limit(1);

    return saved;
  }

  async markRead(conversationId: number, readerId: string) {
    await this.db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          sql`${messages.senderId} != ${readerId}`,
          eq(messages.isRead, false),
        ),
      );
  }

  async getTotalUnread(userId: string) {
    const [result] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(messages)
      .innerJoin(conversations, eq(conversations.id, messages.conversationId))
      .where(
        and(
          or(eq(conversations.customerId, userId), eq(conversations.sellerId, userId)),
          sql`${messages.senderId} != ${userId}`,
          eq(messages.isRead, false),
        ),
      );

    return result?.count ?? 0;
  }
}
