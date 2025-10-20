// src/categories/dto/create-category.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsHexColor, MaxLength, MinLength } from 'class-validator';
import { CategoryType } from '../entities/category-type.enum';
import { CategoryIcon } from '../../common/enums/category-icons.enum';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Alimentação',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da categoria',
    example: 'Gastos com supermercado, restaurantes, etc.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Descrição deve ter no máximo 255 caracteres' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Cor da categoria em hexadecimal',
    example: '#FF6B6B',
    default: '#6B7280',
  })
  @IsOptional()
  @IsString()
  @IsHexColor({ message: 'Cor deve ser um código hexadecimal válido' })
  color?: string;

  @ApiPropertyOptional({
    description: 'Ícone da categoria',
    enum: CategoryIcon,
    example: CategoryIcon.FOOD,
    default: CategoryIcon.DEFAULT,
  })
  @IsOptional()
  @IsEnum(CategoryIcon)
  icon?: CategoryIcon;

  @ApiProperty({
    description: 'Tipo da categoria',
    enum: CategoryType,
    example: CategoryType.EXPENSE,
    default: CategoryType.EXPENSE,
  })
  @IsEnum(CategoryType, { 
    message: `Tipo deve ser um dos: ${Object.values(CategoryType).join(', ')}` 
  })
  type: CategoryType;

  @ApiPropertyOptional({
    description: 'ID da categoria pai (para subcategorias)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Ordem de exibição',
    example: 1,
    default: 0,
  })
  @IsOptional()
  order?: number;
}