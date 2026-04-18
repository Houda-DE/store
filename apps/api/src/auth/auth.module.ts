import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomJwtService } from './jwt.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get('JWT_ACCESS_TOKEN_EXPIRES_IN', '1h'),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CustomJwtService, JwtAuthGuard],
  exports: [AuthService, CustomJwtService, JwtAuthGuard],
})
export class AuthModule {}