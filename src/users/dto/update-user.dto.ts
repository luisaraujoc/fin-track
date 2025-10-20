// src/users/dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { 
  IsOptional, 
  IsBoolean, 
  IsEnum,
  MinLength,
  Matches 
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { Currency, Language, Timezone } from '../../common/enums';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @MinLength(3, { message: 'Username deve ter pelo menos 3 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: 'Username só pode conter letras, números e underscore' 
  })
  username?: string;

  @IsOptional()
  @IsEnum(Currency, { 
    message: `Currency deve ser um dos: ${Object.values(Currency).join(', ')}` 
  })
  currency?: Currency;

  @IsOptional()
  @IsEnum(Language, { 
    message: `Language deve ser um dos: ${Object.values(Language).join(', ')}` 
  })
  language?: Language;

  @IsOptional()
  @IsEnum(Timezone, { 
    message: `Timezone deve ser um dos: ${Object.values(Timezone).join(', ')}` 
  })
  timezone?: Timezone;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}