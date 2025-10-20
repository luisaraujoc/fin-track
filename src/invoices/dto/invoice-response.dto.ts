// src/invoices/dto/invoice-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { PaymentMethodResponseDto } from '../../payment-methods/dto/payment-method-response.dto';
import { TransactionResponseDto } from '../../transactions/dto/transaction-response.dto';

export class InvoiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  closingDay: number;

  @ApiProperty()
  dueDay: number;

  @ApiProperty({ enum: InvoiceStatus })
  status: InvoiceStatus;

  // ✅ NOVOS: Campos de limite
  @ApiPropertyOptional()
  creditLimit?: number;

  @ApiProperty()
  usedLimit: number;

  @ApiProperty()
  availableLimit: number;

  @ApiPropertyOptional()
  totalAmount?: number;

  @ApiPropertyOptional()
  closingDate?: Date;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiPropertyOptional()
  paymentDate?: Date;

  @ApiProperty()
  color: string;

  @ApiProperty()
  icon: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  order: number;

  @ApiProperty({ type: () => [PaymentMethodResponseDto] })
  paymentMethods: PaymentMethodResponseDto[];

  @ApiProperty({ type: () => [TransactionResponseDto] })
  transactions: TransactionResponseDto[];

  // ✅ NOVOS: Informações do limite
  @ApiProperty()
  limitUsagePercentage: number;

  @ApiProperty()
  hasCreditLimit: boolean;

  @ApiProperty()
  hasCreditCards: boolean;

  // Campos calculados existentes
  @ApiProperty()
  isOpen: boolean;

  @ApiProperty()
  isClosed: boolean;

  @ApiProperty()
  isPaid: boolean;

  @ApiProperty()
  isOverdue: boolean;

  @ApiProperty()
  statusDescription: string;

  constructor(invoice: Invoice) {
    this.id = invoice.id;
    this.name = invoice.name;
    this.description = invoice.description;
    this.closingDay = invoice.closingDay;
    this.dueDay = invoice.dueDay;
    this.status = invoice.status;
    
    // ✅ NOVOS: Campos de limite
    this.creditLimit = invoice.creditLimit ? Number(invoice.creditLimit) : undefined;
    this.usedLimit = Number(invoice.usedLimit);
    this.availableLimit = invoice.availableLimit;
    this.totalAmount = invoice.totalAmount ? Number(invoice.totalAmount) : undefined;
    
    this.closingDate = invoice.closingDate;
    this.dueDate = invoice.dueDate;
    this.paymentDate = invoice.paymentDate;
    this.color = invoice.color;
    this.icon = invoice.icon;
    this.userId = invoice.userId;
    this.createdAt = invoice.createdAt;
    this.updatedAt = invoice.updatedAt;
    this.isActive = invoice.isActive;
    this.order = invoice.order;

    // Relações
    if (invoice.paymentMethods) {
      this.paymentMethods = invoice.paymentMethods.map(pm => new PaymentMethodResponseDto(pm));
    } else {
      this.paymentMethods = [];
    }

    if (invoice.transactions) {
      this.transactions = invoice.transactions.map(t => new TransactionResponseDto(t));
    } else {
      this.transactions = [];
    }

    // ✅ NOVOS: Informações do limite
    this.limitUsagePercentage = invoice.getLimitUsagePercentage();
    this.hasCreditLimit = !!invoice.creditLimit;
    this.hasCreditCards = invoice.hasCreditCards();

    // Campos calculados existentes
    this.isOpen = invoice.isOpen();
    this.isClosed = invoice.isClosed();
    this.isPaid = invoice.isPaid();
    this.isOverdue = invoice.isOverdue();
    this.statusDescription = invoice.getStatusDescription();
  }
}