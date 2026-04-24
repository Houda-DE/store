import { mysqlTable, varchar, boolean, timestamp, mysqlEnum, int, text, decimal, primaryKey } from 'drizzle-orm/mysql-core';

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

export const itemDeliveryCities = mysqlTable('item_delivery_cities', {
  itemId: int('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  cityId: int('city_id').notNull().references(() => cities.id),
}, (table) => [
  primaryKey({ columns: [table.itemId, table.cityId] }),
]);

export type Country = typeof countries.$inferSelect;
export type City = typeof cities.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;