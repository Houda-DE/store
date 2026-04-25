import { mysqlTable, varchar, boolean, timestamp, mysqlEnum, int, text, decimal, primaryKey, uniqueIndex, index, foreignKey } from 'drizzle-orm/mysql-core';

export const countries = mysqlTable('countries', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  code: varchar('code', { length: 2 }).unique().notNull(),
});

export const cities = mysqlTable('cities', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  countryId: int('country_id').notNull().references(() => countries.id),
});

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['seller', 'customer']).notNull(),
  cityId: int('city_id').notNull().references(() => cities.id),
  isVerified: boolean('is_verified').default(false).notNull(),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  emailVerificationExpires: timestamp('email_verification_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const items = mysqlTable('items', {
  id: int('id').primaryKey().autoincrement(),
  sellerId: varchar('seller_id', { length: 36 }).notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar('image_url', { length: 512 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sellerDeliveryCities = mysqlTable('seller_delivery_cities', {
  sellerId: varchar('seller_id', { length: 36 }).notNull(),
  cityId: int('city_id').notNull(),
}, (table) => [
  primaryKey({ name: 'seller_delivery_cities_seller_id_city_id_pk', columns: [table.sellerId, table.cityId] }),
  foreignKey({ name: 'seller_delivery_cities_seller_id_users_id_fk', columns: [table.sellerId], foreignColumns: [users.id] }).onDelete('cascade').onUpdate('no action'),
  foreignKey({ name: 'seller_delivery_cities_city_id_cities_id_fk', columns: [table.cityId], foreignColumns: [cities.id] }).onDelete('no action').onUpdate('no action'),
]);

export const conversations = mysqlTable('conversations', {
  id:         int('id').primaryKey().autoincrement(),
  customerId: varchar('customer_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId:   varchar('seller_id',   { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemId:     int('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('uq_conv').on(t.customerId, t.sellerId, t.itemId),
  index('idx_conv_customer').on(t.customerId),
  index('idx_conv_seller').on(t.sellerId),
]);

export const messages = mysqlTable('messages', {
  id:             int('id').primaryKey().autoincrement(),
  conversationId: int('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId:       varchar('sender_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  body:           text('body').notNull(),
  isRead:         boolean('is_read').default(false).notNull(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('idx_msg_conv').on(t.conversationId),
]);

export type Country      = typeof countries.$inferSelect;
export type City         = typeof cities.$inferSelect;
export type User         = typeof users.$inferSelect;
export type InsertUser   = typeof users.$inferInsert;
export type Item         = typeof items.$inferSelect;
export type InsertItem   = typeof items.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type Message      = typeof messages.$inferSelect;