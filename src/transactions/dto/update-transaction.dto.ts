// src/transactions/dto/update-transaction.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @ApiPropertyOptional({
    description: 'Número da parcela atual',
    example: 2,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Parcela atual deve ser pelo menos 1' })
  installmentsCurrent?: number;

  @ApiPropertyOptional({
    description: 'Indica se a transação está ativa',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}