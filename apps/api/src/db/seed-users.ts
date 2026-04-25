import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { users, cities } from './schema';

const PASSWORD = 'Password123!';

const SEED_USERS: { email: string; role: 'seller' | 'customer'; cityName: string }[] = [
  { email: 'seller@westore.dev',   role: 'seller',   cityName: 'Algiers' },
  { email: 'seller2@westore.dev',  role: 'seller',   cityName: 'Oran' },
  { email: 'customer@westore.dev', role: 'customer', cityName: 'Algiers' },
  { email: 'customer2@westore.dev',role: 'customer', cityName: 'Constantine' },
];

async function seedUsers() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log('Seeding users...');
  console.log(`  Password for all accounts: ${PASSWORD}\n`);

  const hashedPassword = await bcrypt.hash(PASSWORD, 12);

  for (const u of SEED_USERS) {
    const [city] = await db
      .select({ id: cities.id })
      .from(cities)
      .where(eq(cities.name, u.cityName))
      .limit(1);

    if (!city) {
      console.warn(`  ⚠ City "${u.cityName}" not found — run db:seed first`);
      continue;
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, u.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  – ${u.email} already exists, skipping`);
      continue;
    }

    await db.insert(users).values({
      id: randomBytes(16).toString('hex'),
      email: u.email,
      password: hashedPassword,
      role: u.role,
      cityId: city.id,
      isVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    console.log(`  ✓ ${u.email} (${u.role}, ${u.cityName})`);
  }

  await connection.end();
  console.log('\nDone.');
}

seedUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
