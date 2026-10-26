import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@merlebleu/shared';

export interface CurrentUserPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUserPayload;
  },
);
