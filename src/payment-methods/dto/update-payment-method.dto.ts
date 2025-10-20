// src/payment-methods/dto/update-payment-method.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentMethodDto } from './create-payment-method.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdatePaymentMethodDto extends PartialType(CreatePaymentMethodDto) {
  @ApiPropertyOptional({
    description: 'Indica se o método de pagamento está ativo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}