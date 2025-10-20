// src/categories/dto/category-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';
import { CategoryType } from '../entities/category-type.enum';

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  icon: string;

  @ApiProperty({ enum: CategoryType })
  type: CategoryType;

  @ApiProperty()
  order: number;

  @ApiPropertyOptional({ type: () => CategoryResponseDto })
  parent?: CategoryResponseDto;

  @ApiProperty({ type: () => [CategoryResponseDto] })
  children: CategoryResponseDto[];

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isActive: boolean;

  constructor(category: Category) {
    this.id = category.id;
    this.name = category.name;
    this.description = category.description;
    this.color = category.color;
    this.icon = category.icon;
    this.type = category.type;
    this.order = category.order;
    this.userId = category.userId;
    this.createdAt = category.createdAt;
    this.updatedAt = category.updatedAt;
    this.isActive = category.isActive;

    // Relações (carregadas apenas se existirem)
    if (category.parent) {
      this.parent = new CategoryResponseDto(category.parent);
    }

    if (category.children && category.children.length > 0) {
      this.children = category.children.map(child => new CategoryResponseDto(child));
    } else {
      this.children = [];
    }
  }
}