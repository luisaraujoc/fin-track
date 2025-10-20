// src/transactions/dto/transaction-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { PaymentMethodResponseDto } from '../../payment-methods/dto/payment-method-response.dto';
import { InvoiceResponseDto } from '../../invoices/dto/invoice-response.dto';

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty()
  transactionDate: Date;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiPropertyOptional()
  installmentsCurrent?: number;

  @ApiPropertyOptional()
  installmentsTotal?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  tags?: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional({ type: () => CategoryResponseDto })
  category?: CategoryResponseDto;

  @ApiPropertyOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({ type: () => PaymentMethodResponseDto })
  paymentMethod?: PaymentMethodResponseDto;

  @ApiPropertyOptional()
  invoiceId?: string;

  @ApiPropertyOptional({ type: () => InvoiceResponseDto })
  invoice?: InvoiceResponseDto;

  @ApiPropertyOptional()
  parentTransactionId?: string;

  @ApiProperty({ type: () => [TransactionResponseDto] })
  childTransactions: TransactionResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isActive: boolean;

  // Campos calculados
  @ApiProperty()
  displayDescription: string;

  @ApiProperty()
  amountWithSign: number;

  @ApiProperty()
  isIncome: boolean;

  @ApiProperty()
  isExpense: boolean;

  @ApiProperty()
  isPending: boolean;

  @ApiProperty()
  isCompleted: boolean;

  @ApiProperty()
  isCanceled: boolean;

  @ApiProperty()
  isInstallment: boolean;

  @ApiProperty()
  isFirstInstallment: boolean;

  @ApiProperty()
  isLastInstallment: boolean;

  constructor(transaction: Transaction) {
    this.id = transaction.id;
    this.description = transaction.description;
    this.amount = Number(transaction.amount);
    this.type = transaction.type;
    this.status = transaction.status;
    this.transactionDate = transaction.transactionDate;
    this.dueDate = transaction.dueDate;
    this.installmentsCurrent = transaction.installmentsCurrent;
    this.installmentsTotal = transaction.installmentsTotal;
    this.notes = transaction.notes;
    this.tags = transaction.tags;
    this.userId = transaction.userId;
    this.categoryId = transaction.categoryId;
    this.paymentMethodId = transaction.paymentMethodId;
    this.invoiceId = transaction.invoiceId;
    this.parentTransactionId = transaction.parentTransactionId;
    this.createdAt = transaction.createdAt;
    this.updatedAt = transaction.updatedAt;
    this.isActive = transaction.isActive;

    // Relações
    if (transaction.category) {
      this.category = new CategoryResponseDto(transaction.category);
    }

    if (transaction.paymentMethod) {
      this.paymentMethod = new PaymentMethodResponseDto(transaction.paymentMethod);
    }

    if (transaction.invoice) {
      this.invoice = new InvoiceResponseDto(transaction.invoice);
    }

    if (transaction.childTransactions) {
      this.childTransactions = transaction.childTransactions.map(
        child => new TransactionResponseDto(child)
      );
    } else {
      this.childTransactions = [];
    }

    // Campos calculados
    this.displayDescription = transaction.getInstallmentDescription();
    this.amountWithSign = transaction.getAmountWithSign();
    this.isIncome = transaction.isIncome();
    this.isExpense = transaction.isExpense();
    this.isPending = transaction.isPending();
    this.isCompleted = transaction.isCompleted();
    this.isCanceled = transaction.isCanceled();
    this.isInstallment = transaction.isInstallment();
    this.isFirstInstallment = transaction.isFirstInstallment();
    this.isLastInstallment = transaction.isLastInstallment();
  }
}