// src/transactions/dto/create-transaction.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min, Max, MinLength, MaxLength, IsUUID } from 'class-validator';
import { TransactionType, TransactionStatus } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Descrição da transação',
    example: 'Compra no Supermercado',
    minLength: 2,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @IsString()
  @MinLength(2, { message: 'Descrição deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'Descrição deve ter no máximo 255 caracteres' })
  description: string;

  @ApiProperty({
    description: 'Valor da transação',
    example: 150.75,
    minimum: 0.01,
  })
  @IsNotEmpty({ message: 'Valor é obrigatório' })
  @IsNumber()
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  amount: number;

  @ApiProperty({
    description: 'Tipo da transação',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType, {
    message: `Tipo deve ser um dos: ${Object.values(TransactionType).join(', ')}`
  })
  type: TransactionType;

  @ApiPropertyOptional({
    description: 'Status da transação',
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
    default: TransactionStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({
    description: 'Data da transação',
    example: '2025-10-20T10:30:00.000Z',
  })
  @IsNotEmpty({ message: 'Data da transação é obrigatória' })
  @IsDateString()
  transactionDate: string;

  @ApiPropertyOptional({
    description: 'Data de vencimento (para transações futuras)',
    example: '2025-10-25T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'ID da categoria',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'ID do método de pagamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'ID da fatura (para cartão de crédito)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({
    description: 'Total de parcelas',
    example: 10,
    minimum: 1,
    maximum: 360,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Total de parcelas deve ser pelo menos 1' })
  @Max(360, { message: 'Total de parcelas não pode ser maior que 360' })
  installmentsTotal?: number;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Compra mensal de alimentos',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Observações devem ter no máximo 500 caracteres' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tags para organização (separadas por vírgula)',
    example: 'supermercado,alimentação,essencial',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Tags devem ter no máximo 255 caracteres' })
  tags?: string;
}