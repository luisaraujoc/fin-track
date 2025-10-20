// src/payment-methods/dto/payment-method-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentMethodType, CreditCardBrand } from '../entities/payment-method.entity';
import { InvoiceResponseDto } from '../../invoices/dto/invoice-response.dto';

export class PaymentMethodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: PaymentMethodType })
  type: PaymentMethodType;

  @ApiPropertyOptional({ enum: CreditCardBrand })
  brand?: CreditCardBrand;

  @ApiPropertyOptional()
  lastFourDigits?: string;

  @ApiPropertyOptional()
  dueDay?: number;

  @ApiProperty()
  color: string;

  @ApiProperty()
  icon: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  invoiceId?: string;

  @ApiPropertyOptional({ type: () => InvoiceResponseDto })
  invoice?: InvoiceResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  order: number;

  // Campos calculados
  @ApiProperty()
  displayName: string;

  @ApiProperty()
  isCreditCard: boolean;

  @ApiProperty()
  isDebitCard: boolean;

  @ApiProperty()
  hasInvoice: boolean;

  // ✅ CORRIGIDO: Usar availableLimit diretamente da Invoice
  @ApiPropertyOptional()
  availableLimit?: number;

  constructor(paymentMethod: PaymentMethod) {
    this.id = paymentMethod.id;
    this.name = paymentMethod.name;
    this.type = paymentMethod.type;
    this.brand = paymentMethod.brand;
    this.lastFourDigits = paymentMethod.lastFourDigits;
    this.dueDay = paymentMethod.dueDay;
    this.color = paymentMethod.color;
    this.icon = paymentMethod.icon;
    this.userId = paymentMethod.userId;
    this.invoiceId = paymentMethod.invoiceId;
    this.createdAt = paymentMethod.createdAt;
    this.updatedAt = paymentMethod.updatedAt;
    this.isActive = paymentMethod.isActive;
    this.order = paymentMethod.order;

    // Relações
    if (paymentMethod.invoice) {
      this.invoice = new InvoiceResponseDto(paymentMethod.invoice);
      this.availableLimit = paymentMethod.invoice.availableLimit;
    }

    // Campos calculados
    this.displayName = paymentMethod.getDisplayName();
    this.isCreditCard = paymentMethod.isCreditCard();
    this.isDebitCard = paymentMethod.isDebitCard();
    this.hasInvoice = paymentMethod.hasInvoice();
  }
}