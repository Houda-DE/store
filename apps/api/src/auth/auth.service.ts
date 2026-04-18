import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { RegisterInput, LoginInput } from '@repo/validation';
import { DATABASE_CONNECTION } from '../db/database.module';
import { users, User } from '../db/schema';
import { EmailService } from '../email/email.service';
import { CustomJwtService } from './jwt.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
    private readonly emailService: EmailService,
    private readonly jwtService: CustomJwtService,
  ) {}

  async register(input: RegisterInput): Promise<{ message: string }> {
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const userId = randomBytes(16).toString('hex');

    await this.db.insert(users).values({
      id: userId,
      email: input.email,
      password: hashedPassword,
      isVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
    });

    await this.emailService.sendVerificationEmail(
      input.email,
      emailVerificationToken,
    );

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);

    if (user.length === 0) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    const userRecord = user[0];

    if (
      userRecord.emailVerificationExpires &&
      new Date() > userRecord.emailVerificationExpires
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    if (userRecord.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.db
      .update(users)
      .set({
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      })
      .where(eq(users.id, userRecord.id));

    return {
      message: 'Email verified successfully. You can now log in.',
    };
  }

  async login(
    input: LoginInput,
  ): Promise<{
    accessToken: string;
    user: Omit<
      User,
      'password' | 'emailVerificationToken' | 'emailVerificationExpires'
    >;
  }> {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (user.length === 0) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const userRecord = user[0];

    const isPasswordValid = await bcrypt.compare(
      input.password,
      userRecord.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!userRecord.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const accessToken = await this.jwtService.generateAccessToken(
      userRecord.id,
      userRecord.email,
    );

    const {
      password,
      emailVerificationToken,
      emailVerificationExpires,
      ...userResponse
    } = userRecord;

    return {
      accessToken,
      user: userResponse,
    };
  }
}
