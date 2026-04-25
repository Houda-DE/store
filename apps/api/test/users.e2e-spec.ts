import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DATABASE_CONNECTION } from '../src/db/database.module';
import { StorageService } from '../src/storage/storage.service';
import { cleanDb, seedLocation, registerAndVerify } from './helpers/db';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let db: any;
  let cityId: number;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue({
        uploadImage: jest
          .fn()
          .mockResolvedValue('https://test.r2.dev/items/test.jpg'),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    db = app.get(DATABASE_CONNECTION);

    await cleanDb(db);
    ({ cityId } = await seedLocation(db));
    token = await registerAndVerify(
      app.getHttpServer(),
      db,
      'user@test.com',
      'customer',
      cityId,
    );
  });

  afterAll(async () => {
    await cleanDb(db);
    await app.close();
  });

  describe('GET /users/me', () => {
    it('200 – returns the authenticated user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('user@test.com');
      expect(res.body.role).toBe('customer');
      expect(res.body.cityId).toBe(cityId);
      expect(res.body.isVerified).toBe(true);
      expect(res.body.password).toBeUndefined();
    });
  });

  describe('PATCH /users/me', () => {
    it('200 – updates email', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'user_updated@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('user_updated@test.com');
    });
  });
});
