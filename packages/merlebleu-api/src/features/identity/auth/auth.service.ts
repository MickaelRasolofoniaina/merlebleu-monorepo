import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { SignInDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async SignIn(signInDto: SignInDto) {
    const { email, password } = signInDto;
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    const bcrypt = await import('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    const { password: _password, ...userDto } = user;
    return userDto;
  }
}
