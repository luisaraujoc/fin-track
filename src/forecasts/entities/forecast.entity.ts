import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ForecastType {
  INCOME = 'income',
  EXPENSE = 'expense',
  BALANCE = 'balance',
}

export enum ForecastPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum ForecastStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('forecasts')
export class Forecast {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ForecastType })
  type: ForecastType;

  @Column({ type: 'enum', enum: ForecastPeriod })
  period: ForecastPeriod;

  @Column({ type: 'enum', enum: ForecastStatus, default: ForecastStatus.ACTIVE })
  status: ForecastStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  // Relationships
  @ManyToOne(() => User, (user) => user.forecasts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}