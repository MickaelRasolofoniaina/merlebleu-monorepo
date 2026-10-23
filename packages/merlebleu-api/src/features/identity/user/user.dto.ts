import { createZodDto } from 'nestjs-zod';
import {
  createUserSchema,
  updateUserSchema,
  updateUserPreferencesSchema,
} from '@merlebleu/shared';

export class CreateUserDto extends createZodDto(createUserSchema) {}

export class UpdateUserDto extends createZodDto(updateUserSchema) {}

export class UpdateUserPreferencesDto extends createZodDto(
  updateUserPreferencesSchema,
) {}
