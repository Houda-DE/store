import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { CreateItemInput, UpdateItemInput } from '@repo/validation';
import { DATABASE_CONNECTION } from '../db/database.module';
import { items, sellerDeliveryCities, cities, users } from '../db/schema';
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

    return this.findOne(inserted.id);
  }

  async findAll(page = 1, limit = 20, callerId?: string) {
    const offset = (page - 1) * limit;

    if (callerId) {
      const [caller] = await this.db
        .select({ cityId: users.cityId })
        .from(users)
        .where(eq(users.id, callerId))
        .limit(1);

      if (caller?.cityId) {
        return this.db
          .select({
            id: items.id,
            sellerId: items.sellerId,
            name: items.name,
            description: items.description,
            price: items.price,
            imageUrl: items.imageUrl,
            createdAt: items.createdAt,
          })
          .from(items)
          .innerJoin(
            sellerDeliveryCities,
            and(
              eq(sellerDeliveryCities.sellerId, items.sellerId),
              eq(sellerDeliveryCities.cityId, caller.cityId),
            ),
          )
          .orderBy(desc(items.createdAt))
          .limit(limit)
          .offset(offset);
      }
    }

    return this.db
      .select()
      .from(items)
      .orderBy(desc(items.createdAt))
      .limit(limit)
      .offset(offset);
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
      .from(sellerDeliveryCities)
      .innerJoin(cities, eq(sellerDeliveryCities.cityId, cities.id))
      .where(eq(sellerDeliveryCities.sellerId, item.sellerId));

    return { ...item, sellerDeliveryCities: deliveryCities };
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
    if (item.sellerId !== userId)
      throw new ForbiddenException('You do not own this item');

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.price !== undefined) updateData.price = String(input.price);
    if (file) updateData.imageUrl = await this.storage.uploadImage(file);

    if (Object.keys(updateData).length > 0) {
      await this.db.update(items).set(updateData).where(eq(items.id, id));
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
    if (item.sellerId !== userId)
      throw new ForbiddenException('You do not own this item');

    await this.db.delete(items).where(eq(items.id, id));
    return { message: 'Item deleted' };
  }
}
