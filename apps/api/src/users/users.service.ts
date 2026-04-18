import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { UpdateUserInput } from '@repo/validation';
import { DATABASE_CONNECTION } from '../db/database.module';
import { users, User } from '../db/schema';

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
}