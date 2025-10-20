// src/payment-methods/dto/create-payment-method.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsHexColor, MaxLength, MinLength, IsNumber, Min, Max } from 'class-validator';
import { PaymentMethodType, CreditCardBrand } from '../entities/payment-method.entity';

export class CreatePaymentMethodDto {
  @ApiProperty({
    description: 'Nome do método de pagamento',
    example: 'Cartão Nubank Final 1234',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Tipo do método de pagamento',
    enum: PaymentMethodType,
    example: PaymentMethodType.CREDIT_CARD,
  })
  @IsEnum(PaymentMethodType, {
    message: `Tipo deve ser um dos: ${Object.values(PaymentMethodType).join(', ')}`
  })
  type: PaymentMethodType;

  @ApiPropertyOptional({
    description: 'Bandeira do cartão (apenas para cartões)',
    enum: CreditCardBrand,
    example: CreditCardBrand.MASTERCARD,
  })
  @IsOptional()
  @IsEnum(CreditCardBrand)
  brand?: CreditCardBrand;

  @ApiPropertyOptional({
    description: 'Últimos 4 dígitos do cartão',
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @IsOptional()
  @IsString()
  @MinLength(4, { message: 'Últimos 4 dígitos devem ter exatamente 4 caracteres' })
  @MaxLength(4, { message: 'Últimos 4 dígitos devem ter exatamente 4 caracteres' })
  lastFourDigits?: string;

  @ApiPropertyOptional({
    description: 'Dia de vencimento da fatura (apenas para cartão de crédito)',
    example: 10,
    minimum: 1,
    maximum: 31,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Dia de vencimento deve ser entre 1 e 31' })
  @Max(31, { message: 'Dia de vencimento deve ser entre 1 e 31' })
  dueDay?: number;

  // ❌ REMOVIDO: creditLimit
  // O limite agora será definido na Invoice

  @ApiPropertyOptional({
    description: 'Cor para identificação visual',
    example: '#8B5CF6',
    default: '#6B7280',
  })
  @IsOptional()
  @IsString()
  @IsHexColor({ message: 'Cor deve ser um código hexadecimal válido' })
  color?: string;

  @ApiPropertyOptional({
    description: 'Ícone para identificação visual',
    example: '💳',
    default: '💳',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'ID da fatura vinculada (para cartões de crédito)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({
    description: 'Ordem de exibição',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  order?: number;
}