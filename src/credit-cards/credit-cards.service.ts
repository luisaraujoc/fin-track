import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditCard } from './entities/credit-card.entity';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { CreditCardResponseDto } from './dto/credit-card-response.dto';

@Injectable()
export class CreditCardsService {
  constructor(
    @InjectRepository(CreditCard)
    private readonly creditCardRepository: Repository<CreditCard>,
  ) {}

  async create(createCreditCardDto: CreateCreditCardDto, userId: string): Promise<CreditCardResponseDto> {
    const creditCard = this.creditCardRepository.create({
      ...createCreditCardDto,
      user_id: userId,
      available_limit: createCreditCardDto.limit,
    });

    const savedCreditCard = await this.creditCardRepository.save(creditCard);
    return this.toResponseDto(savedCreditCard);
  }

  async findAll(userId: string): Promise<CreditCardResponseDto[]> {
    const creditCards = await this.creditCardRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    return creditCards.map(card => this.toResponseDto(card));
  }

  async findOne(id: string, userId: string): Promise<CreditCardResponseDto> {
    const creditCard = await this.creditCardRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!creditCard) {
      throw new NotFoundException('Credit card not found');
    }

    return this.toResponseDto(creditCard);
  }

  async update(
    id: string,
    updateCreditCardDto: UpdateCreditCardDto,
    userId: string,
  ): Promise<CreditCardResponseDto> {
    const creditCard = await this.creditCardRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!creditCard) {
      throw new NotFoundException('Credit card not found');
    }

    const updatedCreditCard = await this.creditCardRepository.save({
      ...creditCard,
      ...updateCreditCardDto,
    });

    return this.toResponseDto(updatedCreditCard);
  }

  async remove(id: string, userId: string): Promise<void> {
    const creditCard = await this.creditCardRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!creditCard) {
      throw new NotFoundException('Credit card not found');
    }

    await this.creditCardRepository.remove(creditCard);
  }

  private toResponseDto(creditCard: CreditCard): CreditCardResponseDto {
    return {
      id: creditCard.id,
      name: creditCard.name,
      description: creditCard.description,
      limit: creditCard.limit,
      available_limit: creditCard.available_limit,
      closing_day: creditCard.closing_day,
      due_day: creditCard.due_day,
      type: creditCard.type,
      status: creditCard.status,
      last_four_digits: creditCard.last_four_digits,
      bank_name: creditCard.bank_name,
      color: creditCard.color,
      is_trackable: creditCard.is_trackable,
      user_id: creditCard.user_id,
      payment_method_id: creditCard.payment_method_id,
      created_at: creditCard.created_at,
      updated_at: creditCard.updated_at,
    };
  }
}