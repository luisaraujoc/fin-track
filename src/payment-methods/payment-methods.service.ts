// src/payment-methods/payment-methods.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod, PaymentMethodType } from './entities/payment-method.entity';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodResponseDto } from './dto/payment-method-response.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodsRepository: Repository<PaymentMethod>,
  ) {}

  async create(userId: string, createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethodResponseDto> {
    try {
      // Validações específicas por tipo
      this.validatePaymentMethodData(createPaymentMethodDto);

      // Verificar se já existe método com mesmo nome para o usuário
      const existingPaymentMethod = await this.paymentMethodsRepository.findOne({
        where: { 
          name: createPaymentMethodDto.name, 
          userId,
          isActive: true 
        },
      });

      if (existingPaymentMethod) {
        throw new ConflictException('Já existe um método de pagamento com este nome');
      }

      const paymentMethod = this.paymentMethodsRepository.create({
        ...createPaymentMethodDto,
        userId,
      });

      const savedPaymentMethod = await this.paymentMethodsRepository.save(paymentMethod);
      return new PaymentMethodResponseDto(savedPaymentMethod);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao criar método de pagamento');
    }
  }

  async findAll(userId: string, includeInactive: boolean = false): Promise<PaymentMethodResponseDto[]> {
    try {
      const where: any = { userId };
      
      if (!includeInactive) {
        where.isActive = true;
      }

      const paymentMethods = await this.paymentMethodsRepository.find({
        where,
        relations: ['invoice'],
        order: { 
          order: 'ASC',
          name: 'ASC' 
        },
      });

      return paymentMethods.map(pm => new PaymentMethodResponseDto(pm));
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar métodos de pagamento');
    }
  }

  async findOne(userId: string, id: string): Promise<PaymentMethodResponseDto> {
    try {
      const paymentMethod = await this.paymentMethodsRepository.findOne({
        where: { id, userId },
        relations: ['invoice'],
      });

      if (!paymentMethod) {
        throw new NotFoundException('Método de pagamento não encontrado');
      }

      return new PaymentMethodResponseDto(paymentMethod);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao buscar método de pagamento');
    }
  }

  async update(userId: string, id: string, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethodResponseDto> {
    try {
      const paymentMethod = await this.paymentMethodsRepository.findOne({
        where: { id, userId },
        relations: ['invoice'],
      });

      if (!paymentMethod) {
        throw new NotFoundException('Método de pagamento não encontrado');
      }

      // Validações específicas por tipo
      if (Object.keys(updatePaymentMethodDto).length > 0) {
        this.validatePaymentMethodData({ ...paymentMethod, ...updatePaymentMethodDto });
      }

      // Verificar se novo nome já existe (se estiver sendo alterado)
      if (updatePaymentMethodDto.name && updatePaymentMethodDto.name !== paymentMethod.name) {
        const existingPaymentMethod = await this.paymentMethodsRepository.findOne({
          where: { 
            name: updatePaymentMethodDto.name, 
            userId,
            isActive: true 
          },
        });
        
        if (existingPaymentMethod) {
          throw new ConflictException('Já existe um método de pagamento com este nome');
        }
      }

      // Atualizar campos
      Object.assign(paymentMethod, updatePaymentMethodDto);
      
      const updatedPaymentMethod = await this.paymentMethodsRepository.save(paymentMethod);
      return new PaymentMethodResponseDto(updatedPaymentMethod);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao atualizar método de pagamento');
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    try {
      const paymentMethod = await this.paymentMethodsRepository.findOne({
        where: { id, userId },
      });

      if (!paymentMethod) {
        throw new NotFoundException('Método de pagamento não encontrado');
      }

      // Soft delete
      paymentMethod.isActive = false;
      await this.paymentMethodsRepository.save(paymentMethod);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao remover método de pagamento');
    }
  }

  async findByType(userId: string, type: PaymentMethodType): Promise<PaymentMethodResponseDto[]> {
    try {
      const paymentMethods = await this.paymentMethodsRepository.find({
        where: { 
          userId,
          type,
          isActive: true 
        },
        relations: ['invoice'],
        order: { order: 'ASC' },
      });

      return paymentMethods.map(pm => new PaymentMethodResponseDto(pm));
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar métodos de pagamento por tipo');
    }
  }

  async getCreditCards(userId: string): Promise<PaymentMethodResponseDto[]> {
    return this.findByType(userId, PaymentMethodType.CREDIT_CARD);
  }

  async getDefaultPaymentMethods(userId: string): Promise<PaymentMethodResponseDto[]> {
    const defaultPaymentMethods = [
      { name: 'Dinheiro', type: PaymentMethodType.CASH, color: '#10B981', icon: '💰', order: 1 },
      { name: 'PIX', type: PaymentMethodType.PIX, color: '#32B768', icon: '🧾', order: 2 },
      { name: 'Débito', type: PaymentMethodType.DEBIT_CARD, color: '#3B82F6', icon: '💳', order: 3 },
    ];

    const createdPaymentMethods: PaymentMethodResponseDto[] = [];

    for (const pmData of defaultPaymentMethods) {
      try {
        const createDto: CreatePaymentMethodDto = {
          name: pmData.name,
          type: pmData.type,
          color: pmData.color,
          icon: pmData.icon,
          order: pmData.order,
        };

        const paymentMethod = await this.create(userId, createDto);
        createdPaymentMethods.push(paymentMethod);
      } catch (error) {
        // Se já existir, ignora e continua
        if (error.getStatus && error.getStatus() === 409) {
          continue;
        }
        // Para outros erros, apenas continua sem parar o processo
      }
    }

    return createdPaymentMethods;
  }

private validatePaymentMethodData(data: Partial<PaymentMethod>): void {
  // Validações para cartões
  if (data.type === PaymentMethodType.CREDIT_CARD || data.type === PaymentMethodType.DEBIT_CARD) {
    if (!data.brand) {
      throw new BadRequestException('Bandeira é obrigatória para cartões');
    }
    if (!data.lastFourDigits) {
      throw new BadRequestException('Últimos 4 dígitos são obrigatórios para cartões');
    }
  }

  // Validações específicas para cartão de crédito
  if (data.type === PaymentMethodType.CREDIT_CARD) {
    if (!data.dueDay) {
      throw new BadRequestException('Dia de vencimento é obrigatório para cartão de crédito');
    }
    if (data.dueDay && (data.dueDay < 1 || data.dueDay > 31)) {
      throw new BadRequestException('Dia de vencimento deve ser entre 1 e 31');
    }
  }

  if (data.type !== PaymentMethodType.CREDIT_CARD && data.type !== PaymentMethodType.DEBIT_CARD) {
    if (data.brand || data.lastFourDigits || data.dueDay) {
      throw new BadRequestException('Campos de cartão não são permitidos para este tipo de método de pagamento');
    }
  }
}
}