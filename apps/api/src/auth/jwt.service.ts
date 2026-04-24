import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'seller' | 'customer';
  iat?: number;
  exp?: number;
}

@Injectable()
export class CustomJwtService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(userId: string, email: string, role: 'seller' | 'customer'): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const secret = this.configService.get('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRES_IN', '1h'),
      secret,
    });
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    const secret = this.configService.get('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    return this.jwtService.verifyAsync(token, {
      secret,
    });
  }
}