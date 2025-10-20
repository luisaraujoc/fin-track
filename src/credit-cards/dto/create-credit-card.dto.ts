import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsPositive,
} from 'class-validator';
import { CreditCardType, CreditCardStatus } from '../entities/credit-card.entity';

export class CreateCreditCardDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  limit: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  closing_day: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  due_day: number;

  @IsOptional()
  @IsEnum(CreditCardType)
  type?: CreditCardType;

  @IsOptional()
  @IsEnum(CreditCardStatus)
  status?: CreditCardStatus;

  @IsOptional()
  @IsString()
  last_four_digits?: string;

  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  is_trackable?: boolean;

  @IsOptional()
  @IsString()
  payment_method_id?: string;
}