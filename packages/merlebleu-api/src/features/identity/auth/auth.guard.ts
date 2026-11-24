import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRole } from '@merlebleu/shared';
import { SKIP_AUTH_KEY } from 'src/shared/auth/public';
import { ROLES_KEY } from 'src/shared/auth/roles';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly bypassAuth: boolean;

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private userService: UserService,
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
    let payload: { sub: string };
    try {
      // 💡 Here the JWT secret key that's used for verifying the payload
      // is the key that was passsed in the JwtModule
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }

    // The role and name are loaded from the database on every request so that
    // a demoted, renamed or deleted user is taken into account immediately.
    const user = await this.userService.findUserById(payload.sub).catch(() => null);
    if (!user) {
      throw new UnauthorizedException();
    }

    // 💡 We're assigning the user to the request object here
    // so that we can access it in our route handlers
    request['user'] = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException();
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
