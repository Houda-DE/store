import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { CreateItemInput, UpdateItemInput } from '@repo/validation';
import { DATABASE_CONNECTION } from '../db/database.module';
import { items, itemDeliveryCities, cities, users } from '../db/schema';
import { StorageService } from '../storage/storage.service';
import { CurrentUserType } from '../auth/decorators/current-user.decorator';

@Injectable()
export class ItemsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
    private readonly storage: StorageService,
  ) {}

  async create(
    user: CurrentUserType,
    input: CreateItemInput,
    file: Express.Multer.File,
  ) {
    await this.validateDeliveryCities(user.id, input.deliveryCityIds);

    const imageUrl = await this.storage.uploadImage(file);

    const [inserted] = await this.db
      .insert(items)
      .values({
        sellerId: user.id,
        name: input.name,
        description: input.description,
        price: String(input.price),
        imageUrl,
      })
      .$returningId();

    await this.db.insert(itemDeliveryCities).values(
      input.deliveryCityIds.map((cityId) => ({ itemId: inserted.id, cityId })),
    );

    return this.findOne(inserted.id);
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(items)
      .orderBy(desc(items.createdAt))
      .limit(limit)
      .offset(offset);

    return rows;
  }

  async findOne(id: number) {
    const [item] = await this.db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);

    if (!item) throw new NotFoundException('Item not found');

    const deliveryCities = await this.db
      .select({ id: cities.id, name: cities.name })
      .from(itemDeliveryCities)
      .innerJoin(cities, eq(itemDeliveryCities.cityId, cities.id))
      .where(eq(itemDeliveryCities.itemId, id));

    return { ...item, deliveryCities };
  }

  async update(
    userId: string,
    id: number,
    input: UpdateItemInput,
    file?: Express.Multer.File,
  ) {
    const [item] = await this.db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);

    if (!item) throw new NotFoundException('Item not found');
    if (item.sellerId !== userId) throw new ForbiddenException('You do not own this item');

    if (input.deliveryCityIds) {
      await this.validateDeliveryCities(userId, input.deliveryCityIds);
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.price !== undefined) updateData.price = String(input.price);

    if (file) {
      updateData.imageUrl = await this.storage.uploadImage(file);
    }

    if (Object.keys(updateData).length > 0) {
      await this.db.update(items).set(updateData).where(eq(items.id, id));
    }

    if (input.deliveryCityIds) {
      await this.db.delete(itemDeliveryCities).where(eq(itemDeliveryCities.itemId, id));
      await this.db.insert(itemDeliveryCities).values(
        input.deliveryCityIds.map((cityId) => ({ itemId: id, cityId })),
      );
    }

    return this.findOne(id);
  }

  async remove(userId: string, id: number) {
    const [item] = await this.db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);

    if (!item) throw new NotFoundException('Item not found');
    if (item.sellerId !== userId) throw new ForbiddenException('You do not own this item');

    await this.db.delete(items).where(eq(items.id, id));
    return { message: 'Item deleted' };
  }

  private async validateDeliveryCities(userId: string, deliveryCityIds: number[]) {
    const [seller] = await this.db
      .select({ cityId: users.cityId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [sellerCity] = await this.db
      .select({ countryId: cities.countryId })
      .from(cities)
      .where(eq(cities.id, seller.cityId))
      .limit(1);

    const requestedCities = await this.db
      .select({ id: cities.id, countryId: cities.countryId })
      .from(cities)
      .where(inArray(cities.id, deliveryCityIds));

    const invalid = requestedCities.filter(
      (c: { id: number; countryId: number }) => c.countryId !== sellerCity.countryId,
    );

    if (invalid.length > 0) {
      throw new BadRequestException(
        'All delivery cities must be within your country',
      );
    }

    if (requestedCities.length !== deliveryCityIds.length) {
      throw new BadRequestException('One or more delivery cities do not exist');
    }
  }
}
