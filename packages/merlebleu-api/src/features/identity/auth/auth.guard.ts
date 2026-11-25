import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRole } from '@merlebleu/shared';
import { SKIP_AUTH_KEY } from 'src/shared/auth/public';
import { ROLES_KEY } from 'src/shared/auth/roles';
import { UserService } from '../user/user.service';

// identity attached to every request while the authentication bypass is on,
// so that handlers reading the current user keep working
const BYPASS_USER = {
  sub: '00000000-0000-0000-0000-000000000000',
  email: 'bypass@merlebleu.local',
  name: 'Bypass',
  role: UserRole.ADMIN,
};

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly bypassAuth: boolean;

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private userService: UserService,
  ) {
    this.bypassAuth =
      (process.env.BYPASS_AUTH ?? 'false').toLowerCase() === 'true';
    if (this.bypassAuth) {
      this.logger.warn(
        'Authentication bypass is ENABLED. This should NOT be used in production!',
      );
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (this.bypassAuth) {
      request['user'] = { ...BYPASS_USER };
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(SKIP_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const token = this.extractTokenFromCookie(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    let payload: { sub: string };
    try {
      // the JWT secret key used to verify the payload is the one passed to the JwtModule
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }

    // The role and name are loaded from the database on every request so that
    // a demoted, renamed or deleted user is taken into account immediately.
    // Only an unknown user means "unauthorized": any other error (database
    // outage, timeout) must surface as a server error, not log the user out.
    let user;
    try {
      user = await this.userService.findUserById(payload.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException();
      }
      throw error;
    }

    // assign the user to the request so that route handlers can access it
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
