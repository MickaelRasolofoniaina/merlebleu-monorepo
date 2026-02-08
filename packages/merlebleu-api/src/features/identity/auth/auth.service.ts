import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginResponseDto, SignInDto } from './auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async SignIn(signInDto: SignInDto): Promise<LoginResponseDto> {
    const { email, password } = signInDto;
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      throw new NotFoundException();
    }

    const bcrypt = await import('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, email: user.email, name: user.name };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync(token);
  }
}
