import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { UpdateUserInput } from '@repo/validation';
import { DATABASE_CONNECTION } from '../db/database.module';
import { users, cities, sellerDeliveryCities, User } from '../db/schema';

export type PublicUser = Omit<User, 'password' | 'emailVerificationToken' | 'emailVerificationExpires'>;

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
  ) {}

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        cityId: users.cityId,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new NotFoundException('User not found');
    }

    return user[0];
  }

  async updateUser(userId: string, updateData: UpdateUserInput): Promise<PublicUser> {
    if (updateData.email) {
      const existingUser = await this.db
        .select()
        .from(users)
        .where(eq(users.email, updateData.email))
        .limit(1);

      if (existingUser.length > 0 && existingUser[0].id !== userId) {
        throw new ConflictException('Email is already taken');
      }
    }

    await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    return this.getCurrentUser(userId);
  }

  async updateDeliveryCities(sellerId: string, cityIds: number[]): Promise<{ cityIds: number[] }> {
    // Verify seller exists and get their country
    const [seller] = await this.db
      .select({ cityId: users.cityId })
      .from(users)
      .where(eq(users.id, sellerId))
      .limit(1);

    if (!seller) throw new NotFoundException('User not found');

    const [sellerCity] = await this.db
      .select({ countryId: cities.countryId })
      .from(cities)
      .where(eq(cities.id, seller.cityId))
      .limit(1);

    // All requested cities must exist
    const requestedCities = await this.db
      .select({ id: cities.id, countryId: cities.countryId })
      .from(cities)
      .where(inArray(cities.id, cityIds));

    if (requestedCities.length !== cityIds.length) {
      throw new BadRequestException('One or more cities do not exist');
    }

    // Validate country constraint only when seller's city is resolvable
    if (sellerCity) {
      const invalid = requestedCities.filter(
        (c: { id: number; countryId: number }) => c.countryId !== sellerCity.countryId,
      );
      if (invalid.length > 0) {
        throw new BadRequestException('All delivery cities must be within your country');
      }
    }

    // Replace existing delivery cities
    await this.db
      .delete(sellerDeliveryCities)
      .where(eq(sellerDeliveryCities.sellerId, sellerId));

    await this.db
      .insert(sellerDeliveryCities)
      .values(cityIds.map((cityId) => ({ sellerId, cityId })));

    return { cityIds };
  }

  async getDeliveryCities(sellerId: string): Promise<{ id: number; name: string }[]> {
    return this.db
      .select({ id: cities.id, name: cities.name })
      .from(sellerDeliveryCities)
      .innerJoin(cities, eq(sellerDeliveryCities.cityId, cities.id))
      .where(eq(sellerDeliveryCities.sellerId, sellerId));
  }
}