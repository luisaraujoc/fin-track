// src/payment-methods/entities/payment-method.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  OTHER = 'other'
}

export enum CreditCardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  ELO = 'elo',
  AMEX = 'amex',
  HIPERCARD = 'hipercard',
  OTHER = 'other'
}

@Entity('payment_methods')
export class PaymentMethod {
  @ApiProperty({
    description: 'ID único do método de pagamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nome do método de pagamento',
    example: 'Cartão Nubank Final 1234',
    maxLength: 100,
  })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({
    description: 'Tipo do método de pagamento',
    enum: PaymentMethodType,
    example: PaymentMethodType.CREDIT_CARD,
  })
  @Column({
    type: 'enum',
    enum: PaymentMethodType,
  })
  type: PaymentMethodType;

  @ApiPropertyOptional({
    description: 'Bandeira do cartão (apenas para cartões)',
    enum: CreditCardBrand,
    example: CreditCardBrand.MASTERCARD,
  })
  @Column({
    type: 'enum',
    enum: CreditCardBrand,
    nullable: true,
  })
  brand: CreditCardBrand;

  @ApiPropertyOptional({
    description: 'Últimos 4 dígitos do cartão',
    example: '1234',
    maxLength: 4,
  })
  @Column({ length: 4, nullable: true })
  lastFourDigits: string;

  @ApiPropertyOptional({
    description: 'Dia de vencimento da fatura (apenas para cartão de crédito)',
    example: 10,
    minimum: 1,
    maximum: 31,
  })
  @Column({ type: 'smallint', nullable: true })
  dueDay: number;

  @ApiPropertyOptional({
    description: 'Cor para identificação visual',
    example: '#8B5CF6',
    default: '#6B7280',
  })
  @Column({ length: 7, default: '#6B7280' })
  color: string;

  @ApiPropertyOptional({
    description: 'Ícone para identificação visual',
    example: '💳',
    default: '💳',
  })
  @Column({ default: '💳' })
  icon: string;

  @ApiProperty({
    description: 'ID do usuário dono do método de pagamento',
  })
  @Column()
  userId: string;

  @ApiProperty({
    description: 'Usuário dono do método de pagamento',
    type: () => User,
  })
  @ManyToOne(() => User, user => user.paymentMethods, { onDelete: 'CASCADE' })
  user: User;

  @ApiPropertyOptional({
    description: 'ID da fatura vinculada (para cartões de crédito)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ nullable: true })
  invoiceId: string;

  @ApiPropertyOptional({
    description: 'Fatura vinculada (para cartões de crédito)',
    type: () => Invoice,
  })
  @ManyToOne(() => Invoice, invoice => invoice.paymentMethods, { 
    onDelete: 'SET NULL',
    nullable: true 
  })
  invoice: Invoice;

  @ApiProperty({
    description: 'Transações com este método de pagamento',
    type: () => [Transaction],
  })
  @OneToMany(() => Transaction, transaction => transaction.paymentMethod)
  transactions: Transaction[];

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-01-20T10:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-01-20T11:30:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Indica se o método de pagamento está ativo',
    example: true,
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Ordem de exibição',
    example: 1,
    default: 0,
  })
  @Column({ default: 0 })
  order: number;

  // Métodos utilitários
  isCreditCard(): boolean {
    return this.type === PaymentMethodType.CREDIT_CARD;
  }

  isDebitCard(): boolean {
    return this.type === PaymentMethodType.DEBIT_CARD;
  }

  isCard(): boolean {
    return this.isCreditCard() || this.isDebitCard();
  }

  hasInvoice(): boolean {
    return this.isCreditCard() && !!this.invoiceId;
  }

  getDisplayName(): string {
    if (this.isCard() && this.lastFourDigits) {
      return `${this.name} (**** ${this.lastFourDigits})`;
    }
    return this.name;
  }

  async getAvailableLimit(): Promise<number | null> {
    if (!this.hasInvoice()) {
      return null;
    }
    
    // O limite será calculado na Invoice
    // Este método será implementado quando atualizarmos a Invoice
    return null;
  }
}