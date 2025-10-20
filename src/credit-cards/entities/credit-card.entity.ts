import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';

export enum CreditCardStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
  INACTIVE = 'inactive',
}

export enum CreditCardType {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  ELO = 'elo',
  OTHER = 'other',
}

@Entity('credit_cards')
export class CreditCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  limit: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  available_limit: number;

  @Column()
  closing_day: number;

  @Column()
  due_day: number;

  @Column({ type: 'enum', enum: CreditCardType, default: CreditCardType.OTHER })
  type: CreditCardType;

  @Column({ type: 'enum', enum: CreditCardStatus, default: CreditCardStatus.ACTIVE })
  status: CreditCardStatus;

  @Column({ type: 'varchar', length: 4, nullable: true })
  last_four_digits: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string;

  @Column({ default: true })
  is_trackable: boolean;

  // Relationships
  @ManyToOne(() => User, (user) => user.creditCards)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.creditCards, {
    nullable: true,
  })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  payment_method_id: string;

  @OneToMany(() => Invoice, (invoice) => invoice.creditCards)
  invoices: Invoice[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Virtual properties for current invoice
  currentInvoice?: Invoice;
  currentSpent?: number;
  currentAvailableLimit?: number;
}