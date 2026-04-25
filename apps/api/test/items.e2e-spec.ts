import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DATABASE_CONNECTION } from '../src/db/database.module';
import { StorageService } from '../src/storage/storage.service';
import { cleanDb, seedLocation, registerAndVerify } from './helpers/db';

// Minimal 1×1 white PNG
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

describe('Items (e2e)', () => {
  let app: INestApplication;
  let db: any;
  let cityId: number;
  let sellerToken: string;
  let customerToken: string;
  let createdItemId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue({ uploadImage: jest.fn().mockResolvedValue('https://test.r2.dev/items/test.jpg') })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    db = app.get(DATABASE_CONNECTION);

    await cleanDb(db);

    ({ cityId } = await seedLocation(db, {
      countryName: 'TestLand',
      countryCode: 'TL',
      cityName: 'TestCity',
    }));

    sellerToken = await registerAndVerify(app.getHttpServer(), db, 'seller@test.com', 'seller', cityId);
    customerToken = await registerAndVerify(app.getHttpServer(), db, 'customer@test.com', 'customer', cityId);

    await request(app.getHttpServer())
      .put('/users/me/delivery-cities')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ cityIds: [cityId] });
  });

  afterAll(async () => {
    await cleanDb(db);
    await app.close();
  });

  describe('PUT /users/me/delivery-cities', () => {
    it('200 – seller sets delivery cities', async () => {
      const res = await request(app.getHttpServer())
        .put('/users/me/delivery-cities')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ cityIds: [cityId] });

      expect(res.status).toBe(200);
      expect(res.body.cityIds).toContain(cityId);
    });
  });

  describe('GET /users/me/delivery-cities', () => {
    it('200 – returns seller delivery cities', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me/delivery-cities')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].id).toBe(cityId);
    });
  });

  describe('POST /items', () => {
    it('201 – seller creates an item', async () => {
      const res = await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${sellerToken}`)
        .attach('image', PNG_1X1, { filename: 'test.png', contentType: 'image/png' })
        .field('name', 'Vintage Lamp')
        .field('description', 'A beautiful vintage lamp')
        .field('price', '1500');

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Vintage Lamp');
      expect(res.body.price).toBe('1500.00');
      expect(res.body.imageUrl).toBe('https://test.r2.dev/items/test.jpg');

      createdItemId = res.body.id;
    });
  });

  describe('GET /items', () => {
    it('200 – customer sees items whose seller delivers to their city', async () => {
      const res = await request(app.getHttpServer())
        .get('/items')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((i: any) => i.id === createdItemId)).toBe(true);
    });

    it('200 – seller sees all items', async () => {
      const res = await request(app.getHttpServer())
        .get('/items')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('200 – respects page and limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/items?page=1&limit=1')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /items/:id', () => {
    it('200 – returns item with seller delivery cities', async () => {
      const res = await request(app.getHttpServer()).get(`/items/${createdItemId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdItemId);
      expect(Array.isArray(res.body.sellerDeliveryCities)).toBe(true);
    });
  });

  describe('PATCH /items/:id', () => {
    it('200 – seller updates own item name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/items/${createdItemId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .field('name', 'Updated Lamp');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Lamp');
    });

    it('200 – seller replaces image', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/items/${createdItemId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .attach('image', PNG_1X1, { filename: 'new.png', contentType: 'image/png' });

      expect(res.status).toBe(200);
      expect(res.body.imageUrl).toBeDefined();
    });
  });

  describe('DELETE /items/:id', () => {
    it('200 – owner seller deletes own item', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/items/${createdItemId}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Item deleted');
    });
  });
});
