import { CreditCardType, CreditCardStatus } from '../entities/credit-card.entity';

export class CreditCardResponseDto {
  id: string;
  name: string;
  description?: string;
  limit: number;
  available_limit: number;
  closing_day: number;
  due_day: number;
  type: CreditCardType;
  status: CreditCardStatus;
  last_four_digits?: string;
  bank_name?: string;
  color?: string;
  is_trackable: boolean;
  user_id: string;
  payment_method_id?: string;
  created_at: Date;
  updated_at: Date;
}