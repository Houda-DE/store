import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { AppModule } from '../src/app.module';
import { DATABASE_CONNECTION } from '../src/db/database.module';
import { StorageService } from '../src/storage/storage.service';
import { users } from '../src/db/schema';
import { cleanDb, seedLocation } from './helpers/db';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let db: any;
  let cityId: number;

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
    ({ cityId } = await seedLocation(db));
  });

  afterAll(async () => {
    await cleanDb(db);
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('201 – registers a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'reg@test.com', password: 'Password123!', cityId, role: 'customer' });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Registration successful');
    });
  });

  describe('GET /auth/verify-email', () => {
    it('200 – verifies with a valid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'verify@test.com', password: 'Password123!', cityId, role: 'customer' });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'verify@test.com'))
        .limit(1);

      const res = await request(app.getHttpServer())
        .get(`/auth/verify-email?token=${user.emailVerificationToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('verified successfully');
    });
  });

  describe('POST /auth/login', () => {
    it('200 – returns accessToken and user on success', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'login@test.com', password: 'Password123!', cityId, role: 'customer' });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'login@test.com'))
        .limit(1);

      await request(app.getHttpServer())
        .get(`/auth/verify-email?token=${user.emailVerificationToken}`);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@test.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('login@test.com');
      expect(res.body.user.password).toBeUndefined();
    });
  });
});
