import { mysqlTable, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  emailVerificationExpires: timestamp('email_verification_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;