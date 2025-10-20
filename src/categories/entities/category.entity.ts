// src/categories/entities/category.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { CategoryIcon, IconLibraries } from '../../common/enums';
import { CategoryType } from './category-type.enum';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('categories')
export class Category {
  @ApiProperty({
    description: 'ID único da categoria',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Alimentação',
    maxLength: 100,
  })
  @Column({ length: 100 })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da categoria',
    example: 'Gastos com supermercado, restaurantes, etc.',
    maxLength: 255,
    nullable: true,
  })
  @Column({ length: 255, nullable: true })
  description: string;

  @ApiProperty({
    description: 'Cor da categoria (hexadecimal)',
    example: '#FF6B6B',
    maxLength: 7,
  })
  @Column({ length: 7, default: '#6B7280' })
  color: string;

  @ApiProperty({
    description: 'Ícone da categoria',
    enum: CategoryIcon,
    example: CategoryIcon.FOOD,
    default: CategoryIcon.DEFAULT,
  })
  @Column({
    type: 'enum',
    enum: CategoryIcon,
    default: CategoryIcon.DEFAULT,
  })
  icon: CategoryIcon;

  @ApiProperty({
    description: 'Tipo da categoria',
    enum: CategoryType,
    example: CategoryType.EXPENSE,
    default: CategoryType.EXPENSE,
  })
  @Column({
    type: 'enum',
    enum: CategoryType,
    default: CategoryType.EXPENSE,
  })
  type: CategoryType;

  @ApiProperty({
    description: 'Ordem de exibição da categoria',
    example: 1,
    default: 0,
  })
  @Column({ default: 0 })
  order: number;

  @ApiPropertyOptional({
    description: 'Categoria pai (para subcategorias)',
    type: () => Category,
    required: false,
  })
  @ManyToOne(() => Category, category => category.children, { 
    onDelete: 'CASCADE',
    nullable: true 
  })
  parent: Category;

  @ApiProperty({
    description: 'Subcategorias',
    type: () => [Category],
  })
  @OneToMany(() => Category, category => category.parent)
  children: Category[];

  @ApiProperty({
    description: 'ID do usuário dono da categoria',
  })
  @Column()
  userId: string;

  @ApiProperty({
    description: 'Usuário dono da categoria',
    type: () => User,
  })
  @ManyToOne(() => User, user => user.categories, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({
    description: 'Transações associadas à categoria',
    type: () => [Transaction],
  })
  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transactions: Transaction[];

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-01-19T10:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-01-19T11:30:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Indica se a categoria está ativa',
    example: true,
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  // Métodos utilitários
  isIncome(): boolean {
    return this.type === CategoryType.INCOME || this.type === CategoryType.BOTH;
  }

  isExpense(): boolean {
    return this.type === CategoryType.EXPENSE || this.type === CategoryType.BOTH;
  }

  hasParent(): boolean {
    return !!this.parent;
  }

  hasChildren(): boolean {
    return this.children && this.children.length > 0;
  }

  // Método para obter representação do ícone
  getIconRepresentation(library: keyof typeof IconLibraries = 'lucide'): string {
    const { getIcon } = require('../../../common/enums/category-icons.enum');
    return getIcon(this.icon, library);
  }
}