import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { countries, cities, Country, City } from '../db/schema';

@Injectable()
export class LocationsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async getCountries(): Promise<Country[]> {
    return this.db.select().from(countries).orderBy(countries.name);
  }

  async getCitiesByCountry(countryId: number): Promise<City[]> {
    return this.db
      .select()
      .from(cities)
      .where(eq(cities.countryId, countryId))
      .orderBy(cities.name);
  }
}
