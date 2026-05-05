import { createZodDto } from 'nestjs-zod';
import { createUserSchema, updateUserSchema } from '@merlebleu/shared';

export class CreateUserDto extends createZodDto(createUserSchema) {}

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
