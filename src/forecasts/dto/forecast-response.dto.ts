import { ForecastType, ForecastPeriod, ForecastStatus } from '../entities/forecast.entity';

export class ForecastResponseDto {
  id: string;
  name: string;
  description?: string;
  type: ForecastType;
  period: ForecastPeriod;
  status: ForecastStatus;
  amount: number;
  start_date: Date;
  end_date: Date;
  category?: string;
  metadata?: any;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}