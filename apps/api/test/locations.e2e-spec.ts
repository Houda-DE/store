import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DATABASE_CONNECTION } from '../src/db/database.module';
import { StorageService } from '../src/storage/storage.service';
import { cleanDb, seedLocation } from './helpers/db';

describe('Locations (e2e)', () => {
  let app: INestApplication;
  let db: any;
  let countryId: number;
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
    ({ countryId, cityId } = await seedLocation(db, {
      countryName: 'Algeria',
      countryCode: 'DZ',
      cityName: 'Algiers',
    }));
  });

  afterAll(async () => {
    await cleanDb(db);
    await app.close();
  });

  describe('GET /locations/countries', () => {
    it('200 – returns an array containing the seeded country', async () => {
      const res = await request(app.getHttpServer()).get('/locations/countries');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const algeria = res.body.find((c: any) => c.id === countryId);
      expect(algeria).toBeDefined();
      expect(algeria.name).toBe('Algeria');
      expect(algeria.code).toBe('DZ');
    });
  });

  describe('GET /locations/countries/:id/cities', () => {
    it('200 – returns cities for the seeded country', async () => {
      const res = await request(app.getHttpServer()).get(
        `/locations/countries/${countryId}/cities`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const algiers = res.body.find((c: any) => c.id === cityId);
      expect(algiers).toBeDefined();
      expect(algiers.name).toBe('Algiers');
    });
  });
});
