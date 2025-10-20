import { CreditCardTransactionStatus } from '../entities/credit-card-transaction.entity';

export class CreditCardTransactionResponseDto {
  id: string;
  description: string;
  amount: number;
  transaction_date: Date;
  status: CreditCardTransactionStatus;
  installments?: number;
  current_installment: number;
  is_installment: boolean;
  category?: string;
  credit_card_id: string;
  transaction_id?: string;
  created_at: Date;
  updated_at: Date;
}