import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CreditCard } from './credit-card.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum CreditCardTransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('credit_card_transactions')
export class CreditCardTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  transaction_date: Date;

  @Column({ type: 'enum', enum: CreditCardTransactionStatus, default: CreditCardTransactionStatus.PENDING })
  status: CreditCardTransactionStatus;

  @Column({ type: 'int', nullable: true })
  installments: number;

  @Column({ type: 'int', default: 1 })
  current_installment: number;

  @Column({ default: false })
  is_installment: boolean;

  @Column({ nullable: true })
  category: string;

  // Relationships
  @ManyToOne(() => CreditCard, (creditCard) => creditCard.invoices)
  @JoinColumn({ name: 'credit_card_id' })
  creditCard: CreditCard;

  @Column()
  credit_card_id: string;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @Column({ nullable: true })
  transaction_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}