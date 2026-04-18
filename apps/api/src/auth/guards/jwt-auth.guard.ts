import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomJwtService, JwtPayload } from '../jwt.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: CustomJwtService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('JWT token is required');
    }

    try {
      const payload = await this.jwtService.verifyAccessToken(token);

      request.user = {
        id: payload.sub,
        email: payload.email,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}