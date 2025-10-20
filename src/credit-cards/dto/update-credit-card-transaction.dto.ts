import { PartialType } from '@nestjs/mapped-types';
import { CreateCreditCardTransactionDto } from './create-credit-card-transaction.dto';

export class UpdateCreditCardTransactionDto extends PartialType(CreateCreditCardTransactionDto) {}