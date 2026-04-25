import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { CustomJwtService } from '../../auth/jwt.service';

@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(private readonly jwtService: CustomJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) return true;

    const token = authHeader.slice(7);
    try {
      const payload = await this.jwtService.verifyAccessToken(token);
      request.user = { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      // invalid / expired token — treat as unauthenticated
    }

    return true;
  }
}
