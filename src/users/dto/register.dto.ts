// src/auth/dto/register.dto.ts
import { PickType } from '@nestjs/swagger';
import { CreateUserDto } from '../../users/dto/create-user.dto';

export class RegisterDto extends PickType(CreateUserDto, [
  'username',
  'firstName',
  'lastName',
  'email',
  'password',
  'currency',
  'language',
  'timezone',
] as const) {}
