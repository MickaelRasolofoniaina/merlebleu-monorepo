import { signInUserSchema } from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class SignInDto extends createZodDto(signInUserSchema) {}

export class LoginResponseDto implements LoginResponseDto {
  accessToken: string;
}
