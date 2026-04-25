import { eq } from 'drizzle-orm';
import request from 'supertest';
import {
  sellerDeliveryCities,
  items,
  users,
  cities,
  countries,
} from '../../src/db/schema';

export async function cleanDb(db: any): Promise<void> {
  await db.delete(sellerDeliveryCities);
  await db.delete(items);
  await db.delete(users);
  await db.delete(cities);
  await db.delete(countries);
}

export async function seedLocation(
  db: any,
  opts: { countryName?: string; countryCode?: string; cityName?: string } = {},
): Promise<{ countryId: number; cityId: number }> {
  const {
    countryName = 'TestLand',
    countryCode = 'TL',
    cityName = 'TestCity',
  } = opts;
  const [country] = await db
    .insert(countries)
    .values({ name: countryName, code: countryCode })
    .$returningId();
  const [city] = await db
    .insert(cities)
    .values({ name: cityName, countryId: country.id })
    .$returningId();
  return { countryId: country.id, cityId: city.id };
}

export async function registerAndVerify(
  server: any,
  db: any,
  email: string,
  role: 'seller' | 'customer',
  cityId: number,
): Promise<string> {
  await request(server)
    .post('/auth/register')
    .send({ email, password: 'Password123!', cityId, role });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  await request(server).get(
    `/auth/verify-email?token=${user.emailVerificationToken}`,
  );

  const { body } = await request(server)
    .post('/auth/login')
    .send({ email, password: 'Password123!' });

  return body.accessToken;
}
