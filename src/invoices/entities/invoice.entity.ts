// src/invoices/entities/invoice.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { CreditCard } from '../../credit-cards/entities/credit-card.entity';

export enum InvoiceStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PENDING = 'pending'
}

@Entity('invoices')
export class Invoice {
  @ApiProperty({
    description: 'ID único da fatura',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nome da fatura (ex: Fatura Nubank, Fatura Inter)',
    example: 'Fatura Nubank',
    maxLength: 100,
  })
  @Column({ length: 100 })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da fatura',
    example: 'Fatura consolidada dos cartões Nubank',
    maxLength: 255,
    nullable: true,
  })
  @Column({ length: 255, nullable: true })
  description: string;

  @ApiProperty({
    description: 'Dia de fechamento da fatura',
    example: 5,
    minimum: 1,
    maximum: 31,
  })
  @Column({ type: 'smallint' })
  closingDay: number;

  @ApiProperty({
    description: 'Dia de vencimento da fatura',
    example: 10,
    minimum: 1,
    maximum: 31,
  })
  @Column({ type: 'smallint' })
  dueDay: number;

  @ApiProperty({
    description: 'Status da fatura',
    enum: InvoiceStatus,
    example: InvoiceStatus.OPEN,
    default: InvoiceStatus.OPEN,
  })
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.OPEN,
  })
  status: InvoiceStatus;

  // ✅ NOVO: Campos de limite compartilhado
  @ApiProperty({
    description: 'Limite de crédito total da fatura (compartilhado entre todos os cartões)',
    example: 5000.00,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  creditLimit: number;

  @ApiProperty({
    description: 'Limite já utilizado',
    example: 1500.00,
    default: 0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  usedLimit: number;

  @ApiPropertyOptional({
    description: 'Valor total da fatura (quando fechada)',
    example: 1500.00,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount: number;

  @ApiPropertyOptional({
    description: 'Data de fechamento da fatura',
    example: '2025-10-05',
  })
  @Column({ type: 'date', nullable: true })
  closingDate: Date;

  @ApiPropertyOptional({
    description: 'Data de vencimento da fatura',
    example: '2025-10-10',
  })
  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @ApiPropertyOptional({
    description: 'Data de pagamento da fatura',
    example: '2025-10-08',
  })
  @Column({ type: 'date', nullable: true })
  paymentDate: Date;

  @ApiProperty({
    description: 'Cor para identificação visual',
    example: '#8B5CF6',
    default: '#6B7280',
  })
  @Column({ length: 7, default: '#6B7280' })
  color: string;

  @ApiProperty({
    description: 'Ícone para identificação visual',
    example: '📄',
    default: '📄',
  })
  @Column({ default: '📄' })
  icon: string;

  @ApiProperty({
    description: 'ID do usuário dono da fatura',
  })
  @Column()
  userId: string;

  @ApiProperty({
    description: 'Usuário dono da fatura',
    type: () => User,
  })
  @ManyToOne(() => User, user => user.invoices, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({
    description: 'Métodos de pagamento vinculados a esta fatura',
    type: () => [PaymentMethod],
  })
  @OneToMany(() => PaymentMethod, paymentMethod => paymentMethod.invoice)
  paymentMethods: PaymentMethod[];

  @ApiProperty({
    description: 'Transações desta fatura',
    type: () => [Transaction],
  })
  @OneToMany(() => Transaction, transaction => transaction.invoice)
  transactions: Transaction[];

  @ApiProperty({
    description: 'Cartões de crédito vinculados a esta fatura',
    type: () => [CreditCard],
  })
  @OneToMany(() => CreditCard, creditCard => creditCard.invoices)
  creditCards: CreditCard[];

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
    description: 'Indica se a fatura está ativa',
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

  // ✅ NOVOS: Métodos para gerenciar limite compartilhado
  
  /**
   * Calcula o limite disponível (campo virtual)
   */
  get availableLimit(): number {
    if (!this.creditLimit) return 0;
    return Number(this.creditLimit) - Number(this.usedLimit);
  }

  /**
   * Verifica se há limite disponível para um valor
   */
  hasAvailableLimit(amount: number): boolean {
    return this.availableLimit >= amount;
  }

  /**
   * Utiliza parte do limite
   */
  useLimit(amount: number): void {
    if (!this.creditLimit) {
      throw new Error('Esta fatura não possui limite de crédito definido');
    }
    
    if (!this.hasAvailableLimit(amount)) {
      throw new Error('Limite insuficiente na fatura');
    }

    this.usedLimit = Number(this.usedLimit) + Number(amount);
  }

  /**
   * Libera limite (para estornos, cancelamentos)
   */
  releaseLimit(amount: number): void {
    this.usedLimit = Math.max(0, Number(this.usedLimit) - Number(amount));
  }

  /**
   * Atualiza o limite total da fatura
   */
  updateCreditLimit(newLimit: number): void {
    if (newLimit < Number(this.usedLimit)) {
      throw new Error('Novo limite não pode ser menor que o limite já utilizado');
    }
    this.creditLimit = newLimit;
  }

  /**
   * Retorna a porcentagem de uso do limite
   */
  getLimitUsagePercentage(): number {
    if (!this.creditLimit || this.creditLimit === 0) return 0;
    return (Number(this.usedLimit) / Number(this.creditLimit)) * 100;
  }

  /**
   * Retorna informações do limite para exibição
   */
  getLimitInfo(): { available: number; used: number; total: number; usagePercentage: number } {
    return {
      available: this.availableLimit,
      used: Number(this.usedLimit),
      total: Number(this.creditLimit) || 0,
      usagePercentage: this.getLimitUsagePercentage(),
    };
  }

  // Métodos utilitários existentes (mantidos)
  isOpen(): boolean {
    return this.status === InvoiceStatus.OPEN;
  }

  isClosed(): boolean {
    return this.status === InvoiceStatus.CLOSED;
  }

  isPaid(): boolean {
    return this.status === InvoiceStatus.PAID;
  }

  isOverdue(): boolean {
    return this.status === InvoiceStatus.OVERDUE;
  }

  canClose(): boolean {
    return this.isOpen() && this.closingDate !== null;
  }

  canPay(): boolean {
    return (this.isClosed() || this.isOverdue()) && !this.isPaid();
  }

  getStatusDescription(): string {
    const statusDescriptions = {
      [InvoiceStatus.OPEN]: 'Aberta - Aguardando fechamento',
      [InvoiceStatus.CLOSED]: 'Fechada - Aguardando pagamento',
      [InvoiceStatus.PAID]: 'Paga - Pagamento realizado',
      [InvoiceStatus.OVERDUE]: 'Atrasada - Vencida',
      [InvoiceStatus.PENDING]: 'Pendente - Em processamento',
    };
    return statusDescriptions[this.status];
  }

  /**
   * Verifica se a fatura tem cartões de crédito vinculados
   */
  hasCreditCards(): boolean {
    return this.paymentMethods && this.paymentMethods.some(pm => 
      pm.isCreditCard && pm.isCreditCard()
    );
  }

  /**
   * Retorna todos os cartões de crédito vinculados a esta fatura
   */
  getCreditCards(): PaymentMethod[] {
    if (!this.paymentMethods) return [];
    return this.paymentMethods.filter(pm => 
      pm.isCreditCard && pm.isCreditCard()
    );
  }
}