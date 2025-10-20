// src/invoices/dto/create-invoice.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional, IsEnum, IsDateString, Min as MinVal } from 'class-validator';
import { InvoiceStatus } from '../entities/invoice.entity';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Nome da fatura',
    example: 'Fatura Nubank',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da fatura',
    example: 'Fatura consolidada dos cartões Nubank',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Dia de fechamento da fatura',
    example: 5,
    minimum: 1,
    maximum: 31,
  })
  @IsNumber()
  @Min(1, { message: 'Dia de fechamento deve ser entre 1 e 31' })
  @Max(31, { message: 'Dia de fechamento deve ser entre 1 e 31' })
  closingDay: number;

  @ApiProperty({
    description: 'Dia de vencimento da fatura',
    example: 10,
    minimum: 1,
    maximum: 31,
  })
  @IsNumber()
  @Min(1, { message: 'Dia de vencimento deve ser entre 1 e 31' })
  @Max(31, { message: 'Dia de vencimento deve ser entre 1 e 31' })
  dueDay: number;

  // ✅ NOVO: Campo de limite de crédito
  @ApiPropertyOptional({
    description: 'Limite de crédito total da fatura (compartilhado entre cartões)',
    example: 5000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @MinVal(0, { message: 'Limite de crédito não pode ser negativo' })
  creditLimit?: number;

  @ApiPropertyOptional({
    description: 'Status da fatura',
    enum: InvoiceStatus,
    example: InvoiceStatus.OPEN,
    default: InvoiceStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    description: 'Cor para identificação visual',
    example: '#8B5CF6',
    default: '#6B7280',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Ícone para identificação visual',
    example: '📄',
    default: '📄',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Ordem de exibição',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  order?: number;
}