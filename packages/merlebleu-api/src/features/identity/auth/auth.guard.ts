import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SKIP_AUTH_KEY } from 'src/shared/auth/public';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly bypassAuth: boolean;

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {
    this.bypassAuth =
      (process.env.BYPASS_AUTH ?? 'false').toLowerCase() === 'true';
    console.log(`AuthGuard initialized with bypassAuth=${this.bypassAuth}`);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.bypassAuth) {
      console.warn(
        '⚠️  Authentication bypass is ENABLED. This should NOT be used in production!',
      );
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(SKIP_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log(
      `AuthGuard: isPublic=${isPublic}, bypassAuth=${this.bypassAuth}`,
    );

    if (isPublic) {
      // 💡 See this condition
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromCookie(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      // 💡 Here the JWT secret key that's used for verifying the payload
      // is the key that was passsed in the JwtModule
      const payload = await this.jwtService.verifyAsync(token);
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    const rawCookie = request.headers.cookie;
    if (!rawCookie) {
      return undefined;
    }

    const cookies = rawCookie.split(';').map((cookie) => cookie.trim());
    const accessToken = cookies.find((cookie) =>
      cookie.startsWith('access_token='),
    );
    if (!accessToken) {
      return undefined;
    }

    return accessToken.split('=')[1];
  }
}
