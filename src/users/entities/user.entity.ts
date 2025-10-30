// src/users/entities/user.entity.ts
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { Currency, Language, Timezone, AuthProvider } from '../../common/enums';
import { Category } from '../../categories/entities/category.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { CreditCard } from '../../credit-cards/entities/credit-card.entity';
import { Forecast } from '../../forecasts/entities/forecast.entity';
import { Report } from '../../reports/entities/report.entity';

@Entity('users')
export class User {
  @ApiProperty({
    description: 'ID único do usuário (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nome de usuário único',
    example: 'joaosilva',
    maxLength: 50,
  })
  @Column({ unique: true, length: 50, nullable: true }) // Pode ser null para usuários OAuth
  username: string;

  @ApiProperty({
    description: 'Primeiro nome',
    example: 'João',
    maxLength: 100,
  })
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @ApiProperty({
    description: 'Sobrenome',
    example: 'Silva',
    maxLength: 100,
  })
  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao.silva@email.com',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    description: 'Senha (hash) - apenas para escrita',
    example: '$2b$12$hashedpassword',
    writeOnly: true,
  })
  @Column({ nullable: true }) // Pode ser null para usuários OAuth
  password: string;

  @ApiProperty({
    description: 'Provedor de autenticação',
    enum: AuthProvider,
    example: AuthProvider.LOCAL,
    default: AuthProvider.LOCAL,
  })
  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  authProvider: AuthProvider;

  @ApiPropertyOptional({
    description: 'ID do usuário no provedor OAuth (ex: Google)',
    example: '1234567890',
  })
  @Column({ name: 'provider_id', nullable: true, unique: true })
  providerId: string;

  @ApiPropertyOptional({
    description: 'URL da foto de perfil do provedor OAuth',
    example: 'https://lh3.googleusercontent.com/a/...',
  })
  @Column({ name: 'profile_picture_url', nullable: true, length: 500 })
  profilePictureUrl: string;

  @ApiProperty({
    description: 'Moeda padrão do usuário',
    enum: Currency,
    example: Currency.BRL,
    default: Currency.BRL,
  })
  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.BRL,
  })
  currency: Currency;

  @ApiProperty({
    description: 'Métodos de pagamento do usuário',
    type: () => [PaymentMethod],
  })
  @OneToMany(() => PaymentMethod, (paymentMethod) => paymentMethod.user)
  paymentMethods: PaymentMethod[];

  @ApiProperty({
    description: 'Faturas do usuário',
    type: () => [Invoice],
  })
  @OneToMany(() => Invoice, (invoice) => invoice.user)
  invoices: Invoice[];

  @ApiProperty({
    description: 'Transações do usuário',
    type: () => [Transaction],
  })
  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @ApiProperty({
    description: 'Categorias do usuário',
    type: () => [Category],
  })
  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @ApiProperty({
    description: 'Cartões de crédito do usuário',
    type: () => [CreditCard],
  })
  @OneToMany(() => CreditCard, (creditCard) => creditCard.user)
  creditCards: CreditCard[];

  @ApiProperty({
    description: 'Previsões do usuário',
    type: () => [Forecast],
  })
  @OneToMany(() => Forecast, (forecast) => forecast.user)
  forecasts: Forecast[];

  @ApiProperty({
    description: 'Relatórios do usuário',
    type: () => [Report],
  })
  @OneToMany(() => Report, (report) => report.user)
  reports: Report[];

  @ApiProperty({
    description: 'Idioma preferido',
    enum: Language,
    example: Language.PT_BR,
    default: Language.PT_BR,
  })
  @Column({
    type: 'enum',
    enum: Language,
    default: Language.PT_BR,
  })
  language: Language;

  @ApiProperty({
    description: 'Fuso horário',
    enum: Timezone,
    example: Timezone.AMERICA_SAO_PAULO,
    default: Timezone.AMERICA_SAO_PAULO,
  })
  @Column({
    type: 'enum',
    enum: Timezone,
    default: Timezone.AMERICA_SAO_PAULO,
  })
  timezone: Timezone;

  @ApiProperty({
    description: 'Indica se o usuário está ativo',
    example: true,
    default: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Indica se o email foi verificado',
    example: false,
    default: false,
  })
  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @ApiPropertyOptional({
    description: 'Data e hora do último login',
    example: '2025-01-19T14:30:00.000Z',
    nullable: true,
  })
  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @ApiProperty({
    description: 'Data e hora de criação do registro',
    example: '2025-01-19T10:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Data e hora da última atualização',
    example: '2025-01-19T11:30:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Flag temporária para controle de hash de password
  private tempPassword?: string;

  /**
   * Hook executado antes de inserir um novo usuário
   * Faz o hash da password apenas se for provedor local
   */
  @BeforeInsert()
  async hashPasswordBeforeInsert(): Promise<void> {
    if (this.password && this.authProvider === AuthProvider.LOCAL) {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }

    // Para usuários OAuth, marcar email como verificado
    if (this.authProvider === AuthProvider.GOOGLE) {
      this.emailVerified = true;

      // Gerar username baseado no email se não fornecido
      if (!this.username) {
        this.username = this.generateUsernameFromEmail();
      }
    }
  }

  /**
   * Hook executado antes de atualizar um usuário
   * Faz o hash da password apenas se ela foi alterada e for provedor local
   */
  @BeforeUpdate()
  async hashPasswordBeforeUpdate(): Promise<void> {
    if (this.tempPassword && this.tempPassword !== this.password && this.authProvider === AuthProvider.LOCAL) {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
    this.tempPassword = undefined;
  }

  /**
   * Valida se a password fornecida corresponde à hash armazenada
   * @param password Password em texto plano para validar
   * @returns Promise<boolean> True se a password for válida
   */
  async validatePassword(password: string): Promise<boolean> {
    if (!this.password || this.authProvider !== AuthProvider.LOCAL) {
      return false;
    }
    return bcrypt.compare(password, this.password);
  }

  /**
   * Gera username a partir do email
   */
  private generateUsernameFromEmail(): string {
    const baseUsername = this.email.split('@')[0];
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseUsername}_${randomSuffix}`;
  }

  /**
   * Cria usuário a partir de dados do Google
   */
  static createFromGoogle(profile: any): User {
    const user = new User();
    user.authProvider = AuthProvider.GOOGLE;
    user.providerId = profile.id;
    user.email = profile.emails[0].value;
    user.firstName = profile.name.givenName;
    user.lastName = profile.name.familyName;
    user.profilePictureUrl = profile.photos?.[0]?.value;
    user.emailVerified = true;
    user.username = user.generateUsernameFromEmail();

    return user;
  }


  /**
   * Atualiza a data do último login para o momento atual
   */
  updateLastLogin(): void {
    this.lastLogin = new Date();
  }

  /**
   * Prepara o usuário para atualização, armazenando a password atual
   * para controle de changesets
   */
  prepareForUpdate(): void {
    this.tempPassword = this.password;
  }

  /**
   * Retorna o nome completo do usuário
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Verifica se o usuário pode realizar login
   * (está ativo e email verificado)
   */
  canLogin(): boolean {
    return this.isActive && this.emailVerified;
  }

  /**
   * Marca o email como verificado
   */
  markEmailAsVerified(): void {
    this.emailVerified = true;
  }

  /**
   * Desativa o usuário (soft delete)
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * Ativa o usuário
   */
  activate(): void {
    this.isActive = true;
  }
}
