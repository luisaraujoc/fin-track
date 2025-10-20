// src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Username ou email do usuário',
    example: 'joaosilva',
  })
  @IsNotEmpty({ message: 'Username ou email é obrigatório' })
  @IsString()
  usernameOrEmail: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: '123456',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password é obrigatória' })
  @IsString()
  @MinLength(6, { message: 'Password deve ter pelo menos 6 caracteres' })
  password: string;
}