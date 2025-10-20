import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditCardTransaction } from './entities/credit-card-transaction.entity';
import { CreateCreditCardTransactionDto } from './dto/create-credit-card-transaction.dto';
import { UpdateCreditCardTransactionDto } from './dto/update-credit-card-transaction.dto';
import { CreditCardTransactionResponseDto } from './dto/credit-card-transaction-response.dto';
import { CreditCardsService } from './credit-cards.service';

@Injectable()
export class CreditCardTransactionsService {
  constructor(
    @InjectRepository(CreditCardTransaction)
    private readonly transactionRepository: Repository<CreditCardTransaction>,
    private readonly creditCardsService: CreditCardsService,
  ) {}

  async create(
    createTransactionDto: CreateCreditCardTransactionDto,
    userId: string,
  ): Promise<CreditCardTransactionResponseDto> {
    // Verify if credit card belongs to user
    await this.creditCardsService.findOne(createTransactionDto.credit_card_id, userId);

    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      current_installment: createTransactionDto.installments ? 1 : 1,
      is_installment: createTransactionDto.installments ? true : false,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);
    return this.toResponseDto(savedTransaction);
  }

  async findAllByCreditCard(creditCardId: string, userId: string): Promise<CreditCardTransactionResponseDto[]> {
    // Verify if credit card belongs to user
    await this.creditCardsService.findOne(creditCardId, userId);

    const transactions = await this.transactionRepository.find({
      where: { credit_card_id: creditCardId },
      order: { transaction_date: 'DESC' },
    });

    return transactions.map(transaction => this.toResponseDto(transaction));
  }

  async findOne(id: string, userId: string): Promise<CreditCardTransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['creditCard'],
    });

    if (!transaction) {
      throw new NotFoundException('Credit card transaction not found');
    }

    // Verify if credit card belongs to user
    if (transaction.creditCard.user_id !== userId) {
      throw new NotFoundException('Credit card transaction not found');
    }

    return this.toResponseDto(transaction);
  }

  async update(
    id: string,
    updateTransactionDto: UpdateCreditCardTransactionDto,
    userId: string,
  ): Promise<CreditCardTransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['creditCard'],
    });

    if (!transaction || transaction.creditCard.user_id !== userId) {
      throw new NotFoundException('Credit card transaction not found');
    }

    const updatedTransaction = await this.transactionRepository.save({
      ...transaction,
      ...updateTransactionDto,
    });

    return this.toResponseDto(updatedTransaction);
  }

  async remove(id: string, userId: string): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['creditCard'],
    });

    if (!transaction || transaction.creditCard.user_id !== userId) {
      throw new NotFoundException('Credit card transaction not found');
    }

    await this.transactionRepository.remove(transaction);
  }

  private toResponseDto(transaction: CreditCardTransaction): CreditCardTransactionResponseDto {
    return {
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      transaction_date: transaction.transaction_date,
      status: transaction.status,
      installments: transaction.installments,
      current_installment: transaction.current_installment,
      is_installment: transaction.is_installment,
      category: transaction.category,
      credit_card_id: transaction.credit_card_id,
      transaction_id: transaction.transaction_id,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
    };
  }
}