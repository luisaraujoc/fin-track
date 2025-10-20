// src/users/dto/create-user.dto.ts
import { 
  IsEmail, 
  IsNotEmpty, 
  MinLength, 
  IsOptional, 
  IsString, 
  Matches,
  IsEnum 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, Language, Timezone } from '../../common/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'joaosilva', description: 'Nome de usuário único' })
  @IsNotEmpty({ message: 'Username é obrigatório' })
  @MinLength(3, { message: 'Username deve ter pelo menos 3 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: 'Username só pode conter letras, números e underscore' 
  })
  username: string;

  @ApiProperty({ example: 'João', description: 'Primeiro nome' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Silva', description: 'Sobrenome' })
  @IsNotEmpty({ message: 'Sobrenome é obrigatório' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'joao@email.com', description: 'Email válido' })
  @IsEmail({}, { message: 'Email deve ser válido' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Senha com pelo menos 6 caracteres', minLength: 6 })
  @IsNotEmpty({ message: 'Password é obrigatória' })
  @MinLength(6, { message: 'Password deve ter pelo menos 6 caracteres' })
  password: string;

  @ApiPropertyOptional({ enum: Currency, example: Currency.BRL, description: 'Moeda padrão' })
  @IsOptional()
  @IsEnum(Currency, { 
    message: `Currency deve ser um dos: ${Object.values(Currency).join(', ')}` 
  })
  currency?: Currency;

  @ApiPropertyOptional({ enum: Language, example: Language.PT_BR, description: 'Idioma preferido' })
  @IsOptional()
  @IsEnum(Language, { 
    message: `Language deve ser um dos: ${Object.values(Language).join(', ')}` 
  })
  language?: Language;

  @ApiPropertyOptional({ enum: Timezone, example: Timezone.AMERICA_SAO_PAULO, description: 'Fuso horário' })
  @IsOptional()
  @IsEnum(Timezone, { 
    message: `Timezone deve ser um dos: ${Object.values(Timezone).join(', ')}` 
  })
  timezone?: Timezone;
}