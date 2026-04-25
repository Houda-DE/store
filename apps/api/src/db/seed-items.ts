import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq } from 'drizzle-orm';
import { users, items, cities, sellerDeliveryCities } from './schema';

// picsum.photos gives consistent placeholder images per seed id
const img = (seed: number) => `https://picsum.photos/seed/${seed}/600/600`;

const SELLER_ITEMS: Record<string, { name: string; description: string; price: number; imgSeed: number }[]> = {
  'seller@westore.dev': [
    { name: 'Vintage Leather Jacket', description: 'Brown genuine leather jacket, worn twice. Size L, excellent condition.', price: 4500, imgSeed: 10 },
    { name: 'Sony WH-1000XM4 Headphones', description: 'Noise-cancelling wireless headphones. Comes with original case and cables.', price: 18000, imgSeed: 20 },
    { name: 'Canon EOS 200D Camera', description: 'Entry-level DSLR with 18-55mm kit lens. Low shutter count, great for beginners.', price: 35000, imgSeed: 30 },
    { name: 'Nike Air Max 270', description: 'White/black, size 43. Worn only 3 times. Original box included.', price: 7500, imgSeed: 40 },
    { name: 'IKEA Standing Desk', description: 'Adjustable height, 140×70cm top. Minor scratches on the legs. Self-assembly required.', price: 12000, imgSeed: 50 },
    { name: 'MacBook Pro 2020 Charger', description: '61W USB-C power adapter, original Apple, perfect working condition.', price: 3200, imgSeed: 60 },
  ],
  'seller2@westore.dev': [
    { name: 'Adidas Running Shoes', description: 'Ultraboost 22, size 42, navy blue. Used twice for light jogging.', price: 6000, imgSeed: 11 },
    { name: 'Wooden Coffee Table', description: 'Solid oak, 120×60cm. Light surface marks, structurally perfect.', price: 8500, imgSeed: 21 },
    { name: 'Samsung 27" Monitor', description: '4K UHD IPS panel, 60Hz. Comes with HDMI and DisplayPort cables.', price: 22000, imgSeed: 31 },
    { name: 'Acoustic Guitar – Yamaha F310', description: 'Ideal for beginners. Comes with a soft case and spare strings.', price: 9000, imgSeed: 41 },
    { name: 'Levi\'s 501 Jeans', description: 'Classic straight fit, size 32×32, dark wash. Barely worn.', price: 2800, imgSeed: 51 },
    { name: 'Instant Pot Duo 7-in-1', description: '6-quart pressure cooker. All accessories included, works perfectly.', price: 5500, imgSeed: 61 },
  ],
};

const DELIVERY_CITIES: Record<string, string[]> = {
  'seller@westore.dev':  ['Algiers', 'Blida', 'Tizi Ouzou'],
  'seller2@westore.dev': ['Oran', 'Mostaganem', 'Tlemcen'],
};

async function seedItems() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log('Seeding items...');

  for (const [email, sellerItems] of Object.entries(SELLER_ITEMS)) {
    const [seller] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!seller) {
      console.warn(`  ⚠ Seller "${email}" not found — run db:seed-users first`);
      continue;
    }

    // Set delivery cities
    const cityNames = DELIVERY_CITIES[email] ?? [];
    const deliveryCityRows = await db
      .select({ id: cities.id })
      .from(cities)
      .where(eq(cities.name, cityNames[0])); // fetch first, then others

    const allCityIds: number[] = [];
    for (const cityName of cityNames) {
      const [city] = await db
        .select({ id: cities.id })
        .from(cities)
        .where(eq(cities.name, cityName))
        .limit(1);
      if (city) allCityIds.push(city.id);
    }

    if (allCityIds.length > 0) {
      await db.delete(sellerDeliveryCities).where(eq(sellerDeliveryCities.sellerId, seller.id));
      await db.insert(sellerDeliveryCities).values(
        allCityIds.map(cityId => ({ sellerId: seller.id, cityId })),
      );
    }

    // Insert items
    for (const item of sellerItems) {
      await db.insert(items).values({
        sellerId: seller.id,
        name: item.name,
        description: item.description,
        price: String(item.price),
        imageUrl: img(item.imgSeed),
      });
    }

    console.log(`  ✓ ${email} — ${sellerItems.length} items, delivers to: ${cityNames.join(', ')}`);
  }

  await connection.end();
  console.log('\nDone.');
}

seedItems().catch((err) => {
  console.error(err);
  process.exit(1);
});
