import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsPositive,
  Min,
} from 'class-validator';
import { CreditCardTransactionStatus } from '../entities/credit-card-transaction.entity';

export class CreateCreditCardTransactionDto {
  @IsString()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsDateString()
  transaction_date: string;

  @IsOptional()
  @IsEnum(CreditCardTransactionStatus)
  status?: CreditCardTransactionStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  installments?: number;

  @IsOptional()
  @IsBoolean()
  is_installment?: boolean;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  credit_card_id: string;

  @IsOptional()
  @IsString()
  transaction_id?: string;
}