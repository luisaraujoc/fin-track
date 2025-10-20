// src/invoices/dto/update-invoice.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceDto } from './create-invoice.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, Min as MinVal, IsDateString } from 'class-validator';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @ApiPropertyOptional({
    description: 'Limite já utilizado (apenas leitura - calculado automaticamente)',
    example: 1500.00,
  })
  @IsOptional()
  @IsNumber()
  @MinVal(0, { message: 'Limite utilizado não pode ser negativo' })
  usedLimit?: number;

  @ApiPropertyOptional({
    description: 'Valor total da fatura',
    example: 1500.00,
  })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional({
    description: 'Data de fechamento da fatura',
    example: '2025-10-05',
  })
  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @ApiPropertyOptional({
    description: 'Data de vencimento da fatura',
    example: '2025-10-10',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Data de pagamento da fatura',
    example: '2025-10-08',
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({
    description: 'Indica se a fatura está ativa',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}