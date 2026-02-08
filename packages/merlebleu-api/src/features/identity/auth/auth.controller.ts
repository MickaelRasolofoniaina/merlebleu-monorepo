import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { SignInDto } from './auth.dto';
import { SkipAuth } from 'src/shared/auth/public';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @SkipAuth()
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signIn(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.SignIn(body);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return result;
  }

  @SkipAuth()
  @HttpCode(HttpStatus.OK)
  @Get('me')
  async getSession(@Req() req: express.Request) {
    const token = this.extractTokenFromCookie(req);

    if (!token) {
      throw new UnauthorizedException();
    }

    return this.authService.verifyAccessToken(token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: express.Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return { success: true };
  }

  private extractTokenFromCookie(request: express.Request): string | undefined {
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
