import { signInUserSchema, Shop } from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class SignInDto extends createZodDto(signInUserSchema) {}

export class LoginResponseDto {
  accessToken: string;
  name: string;
  shop?: Shop;
}
