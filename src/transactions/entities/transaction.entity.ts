// src/transactions/entities/transaction.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELED = 'canceled'
}

@Entity('transactions')
export class Transaction {
  @ApiProperty({
    description: 'ID único da transação',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Descrição da transação',
    example: 'Compra no Supermercado',
    maxLength: 255,
  })
  @Column({ length: 255 })
  description: string;

  @ApiProperty({
    description: 'Valor da transação',
    example: 150.75,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Tipo da transação',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @ApiProperty({
    description: 'Status da transação',
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
    default: TransactionStatus.COMPLETED,
  })
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @ApiProperty({
    description: 'Data da transação',
    example: '2025-10-20T10:30:00.000Z',
  })
  @Column({ type: 'timestamp' })
  transactionDate: Date;

  @ApiPropertyOptional({
    description: 'Data de vencimento (para transações futuras)',
    example: '2025-10-25T00:00:00.000Z',
  })
  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @ApiPropertyOptional({
    description: 'Número da parcela atual',
    example: 1,
  })
  @Column({ type: 'smallint', nullable: true, default: 1 })
  installmentsCurrent: number;

  @ApiPropertyOptional({
    description: 'Total de parcelas',
    example: 10,
  })
  @Column({ type: 'smallint', nullable: true, default: 1 })
  installmentsTotal: number;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Compra mensal de alimentos',
    maxLength: 500,
  })
  @Column({ length: 500, nullable: true })
  notes: string;

  @ApiPropertyOptional({
    description: 'Tags para organização (separadas por vírgula)',
    example: 'supermercado,alimentação,essencial',
    maxLength: 255,
  })
  @Column({ length: 255, nullable: true })
  tags: string;

  @ApiProperty({
    description: 'ID do usuário',
  })
  @Column()
  userId: string;

  @ApiProperty({
    description: 'Usuário dono da transação',
    type: () => User,
  })
  @ManyToOne(() => User, user => user.transactions, { onDelete: 'CASCADE' })
  user: User;

  @ApiPropertyOptional({
    description: 'ID da categoria',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ nullable: true })
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Categoria da transação',
    type: () => Category,
  })
  @ManyToOne(() => Category, category => category.transactions, { 
    onDelete: 'SET NULL',
    nullable: true 
  })
  category: Category;

  @ApiPropertyOptional({
    description: 'ID do método de pagamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ nullable: true })
  paymentMethodId: string;

  @ApiPropertyOptional({
    description: 'Método de pagamento utilizado',
    type: () => PaymentMethod,
  })
  @ManyToOne(() => PaymentMethod, paymentMethod => paymentMethod.transactions, { 
    onDelete: 'SET NULL',
    nullable: true 
  })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'ID da fatura (para cartão de crédito)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ nullable: true })
  invoiceId: string;

  @ApiPropertyOptional({
    description: 'Fatura vinculada (para cartão de crédito)',
    type: () => Invoice,
  })
  @ManyToOne(() => Invoice, invoice => invoice.transactions, { 
    onDelete: 'SET NULL',
    nullable: true 
  })
  invoice: Invoice;

  @ApiPropertyOptional({
    description: 'ID da transação pai (para parcelamentos)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ nullable: true })
  parentTransactionId: string;

  @ApiPropertyOptional({
    description: 'Transação pai (para parcelamentos)',
    type: () => Transaction,
  })
  @ManyToOne(() => Transaction, transaction => transaction.childTransactions, { 
    onDelete: 'CASCADE',
    nullable: true 
  })
  parentTransaction: Transaction;

  @ApiProperty({
    description: 'Transações filhas (parcelas)',
    type: () => [Transaction],
  })
  @OneToMany(() => Transaction, transaction => transaction.parentTransaction)
  childTransactions: Transaction[];

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-10-20T10:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-10-20T11:30:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Indica se a transação está ativa',
    example: true,
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  // Métodos utilitários
  isIncome(): boolean {
    return this.type === TransactionType.INCOME;
  }

  isExpense(): boolean {
    return this.type === TransactionType.EXPENSE;
  }

  isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  isCompleted(): boolean {
    return this.status === TransactionStatus.COMPLETED;
  }

  isCanceled(): boolean {
    return this.status === TransactionStatus.CANCELED;
  }

  isInstallment(): boolean {
    return this.installmentsTotal > 1;
  }

  isFirstInstallment(): boolean {
    return this.isInstallment() && this.installmentsCurrent === 1;
  }

  isLastInstallment(): boolean {
    return this.isInstallment() && this.installmentsCurrent === this.installmentsTotal;
  }

  hasParent(): boolean {
    return !!this.parentTransactionId;
  }

  hasChildren(): boolean {
    return this.childTransactions && this.childTransactions.length > 0;
  }

  getInstallmentDescription(): string {
    if (this.isInstallment()) {
      return `${this.description} (${this.installmentsCurrent}/${this.installmentsTotal})`;
    }
    return this.description;
  }

  getAmountWithSign(): number {
    return this.isExpense() ? -Math.abs(this.amount) : Math.abs(this.amount);
  }
}