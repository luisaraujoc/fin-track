import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsPositive,
  IsObject,
} from 'class-validator';
import { ForecastType, ForecastPeriod } from '../entities/forecast.entity';

export class CreateForecastDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ForecastType)
  type: ForecastType;

  @IsEnum(ForecastPeriod)
  period: ForecastPeriod;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}