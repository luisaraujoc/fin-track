// src/transactions/transactions.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { InvoiceLimitService } from '../invoices/invoice-limit.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private invoiceLimitService: InvoiceLimitService,
  ) {}

  async create(
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    try {
      // Converter datas para Date antes da validação
      const transactionData = {
        ...createTransactionDto,
        transactionDate: new Date(createTransactionDto.transactionDate),
        dueDate: createTransactionDto.dueDate
          ? new Date(createTransactionDto.dueDate)
          : null,
      };

      // ✅ NOVO: Validar limite se for transação de cartão de crédito
      if (
        createTransactionDto.invoiceId &&
        createTransactionDto.type === TransactionType.EXPENSE
      ) {
        const limitValidation =
          await this.invoiceLimitService.validateTransactionWithLimit(
            createTransactionDto.invoiceId,
            createTransactionDto.amount,
            createTransactionDto.type,
          );

        if (!limitValidation.canProceed) {
          throw new BadRequestException(limitValidation.message);
        }
      }

      // Validações existentes
      await this.validateTransactionData(userId, transactionData);

      const transaction = this.transactionsRepository.create({
        ...transactionData,
        userId,
        installmentsCurrent: 1,
        installmentsTotal: createTransactionDto.installmentsTotal || 1,
      });

      const savedTransaction =
        await this.transactionsRepository.save(transaction);

      if (
        createTransactionDto.invoiceId &&
        createTransactionDto.type === TransactionType.EXPENSE
      ) {
        await this.invoiceLimitService.useLimit(
          createTransactionDto.invoiceId,
          createTransactionDto.amount,
        );
      }

      // Carregar relações para a resposta
      const transactionWithRelations =
        await this.transactionsRepository.findOne({
          where: { id: savedTransaction.id },
          relations: [
            'category',
            'paymentMethod',
            'invoice',
            'childTransactions',
          ],
        });

      return new TransactionResponseDto(transactionWithRelations);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao criar transação');
    }
  }

  async findAll(
    userId: string,
    includeInactive: boolean = false,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ transactions: TransactionResponseDto[]; total: number }> {
    try {
      const where: any = { userId };

      if (!includeInactive) {
        where.isActive = true;
      }

      const [transactions, total] =
        await this.transactionsRepository.findAndCount({
          where,
          relations: [
            'category',
            'paymentMethod',
            'invoice',
            'childTransactions',
          ],
          order: {
            transactionDate: 'DESC',
            createdAt: 'DESC',
          },
          skip: (page - 1) * limit,
          take: limit,
        });

      const transactionDtos = transactions.map(
        (transaction) => new TransactionResponseDto(transaction),
      );

      return {
        transactions: transactionDtos,
        total,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar transações');
    }
  }

  async findOne(userId: string, id: string): Promise<TransactionResponseDto> {
    try {
      const transaction = await this.transactionsRepository.findOne({
        where: { id, userId },
        relations: [
          'category',
          'paymentMethod',
          'invoice',
          'childTransactions',
          'parentTransaction',
        ],
      });

      if (!transaction) {
        throw new NotFoundException('Transação não encontrada');
      }

      return new TransactionResponseDto(transaction);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao buscar transação');
    }
  }

  async update(
    userId: string,
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    try {
      const transaction = await this.transactionsRepository.findOne({
        where: { id, userId },
        relations: [
          'category',
          'paymentMethod',
          'invoice',
          'childTransactions',
        ],
      });

      if (!transaction) {
        throw new NotFoundException('Transação não encontrada');
      }

      // Criar objeto com datas convertidas
      const updateData: any = { ...updateTransactionDto };

      if (updateTransactionDto.transactionDate) {
        updateData.transactionDate = new Date(
          updateTransactionDto.transactionDate,
        );
      }
      if (updateTransactionDto.dueDate) {
        updateData.dueDate = new Date(updateTransactionDto.dueDate);
      }

      // Validações
      if (Object.keys(updateData).length > 0) {
        await this.validateTransactionData(userId, {
          ...transaction,
          ...updateData,
        });
      }

      // Atualizar campos
      Object.assign(transaction, updateData);

      const updatedTransaction =
        await this.transactionsRepository.save(transaction);
      return new TransactionResponseDto(updatedTransaction);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao atualizar transação');
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    try {
      const transaction = await this.transactionsRepository.findOne({
        where: { id, userId },
        relations: ['childTransactions'],
      });

      if (!transaction) {
        throw new NotFoundException('Transação não encontrada');
      }

      // Se for transação pai, remover também as filhas
      if (transaction.hasChildren()) {
        await this.transactionsRepository.remove(transaction.childTransactions);
      }

      // Soft delete
      transaction.isActive = false;
      await this.transactionsRepository.save(transaction);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao remover transação');
    }
  }

  async findByPeriod(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<TransactionResponseDto[]> {
    try {
      const transactions = await this.transactionsRepository.find({
        where: {
          userId,
          isActive: true,
          transactionDate: Between(new Date(startDate), new Date(endDate)),
        },
        relations: ['category', 'paymentMethod', 'invoice'],
        order: { transactionDate: 'DESC' },
      });

      return transactions.map(
        (transaction) => new TransactionResponseDto(transaction),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao buscar transações por período',
      );
    }
  }

  async findByCategory(
    userId: string,
    categoryId: string,
  ): Promise<TransactionResponseDto[]> {
    try {
      const transactions = await this.transactionsRepository.find({
        where: {
          userId,
          categoryId,
          isActive: true,
        },
        relations: ['category', 'paymentMethod', 'invoice'],
        order: { transactionDate: 'DESC' },
      });

      return transactions.map(
        (transaction) => new TransactionResponseDto(transaction),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao buscar transações por categoria',
      );
    }
  }

  async findByType(
    userId: string,
    type: TransactionType,
  ): Promise<TransactionResponseDto[]> {
    try {
      const transactions = await this.transactionsRepository.find({
        where: {
          userId,
          type,
          isActive: true,
        },
        relations: ['category', 'paymentMethod', 'invoice'],
        order: { transactionDate: 'DESC' },
      });

      return transactions.map(
        (transaction) => new TransactionResponseDto(transaction),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao buscar transações por tipo',
      );
    }
  }

  async getMonthlySummary(
    userId: string,
    year: number,
    month: number,
  ): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionsCount: number;
  }> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const transactions = await this.transactionsRepository.find({
        where: {
          userId,
          isActive: true,
          status: TransactionStatus.COMPLETED,
          transactionDate: Between(startDate, endDate),
        },
      });

      const totalIncome = transactions
        .filter((t) => t.isIncome())
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = transactions
        .filter((t) => t.isExpense())
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        transactionsCount: transactions.length,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao calcular resumo mensal');
    }
  }

  async getPendingTransactions(
    userId: string,
  ): Promise<TransactionResponseDto[]> {
    try {
      const transactions = await this.transactionsRepository.find({
        where: {
          userId,
          status: TransactionStatus.PENDING,
          isActive: true,
        },
        relations: ['category', 'paymentMethod', 'invoice'],
        order: { dueDate: 'ASC' },
      });

      return transactions.map(
        (transaction) => new TransactionResponseDto(transaction),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao buscar transações pendentes',
      );
    }
  }

  async getUpcomingTransactions(
    userId: string,
    days: number = 7,
  ): Promise<TransactionResponseDto[]> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const transactions = await this.transactionsRepository.find({
        where: {
          userId,
          isActive: true,
          dueDate: Between(startDate, endDate),
        },
        relations: ['category', 'paymentMethod', 'invoice'],
        order: { dueDate: 'ASC' },
      });

      return transactions.map(
        (transaction) => new TransactionResponseDto(transaction),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao buscar transações futuras',
      );
    }
  }

  async markAsCompleted(
    userId: string,
    id: string,
  ): Promise<TransactionResponseDto> {
    try {
      const transaction = await this.transactionsRepository.findOne({
        where: { id, userId },
      });

      if (!transaction) {
        throw new NotFoundException('Transação não encontrada');
      }

      transaction.status = TransactionStatus.COMPLETED;
      const updatedTransaction =
        await this.transactionsRepository.save(transaction);

      return new TransactionResponseDto(updatedTransaction);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao marcar transação como concluída',
      );
    }
  }

  async markAsCanceled(
    userId: string,
    id: string,
  ): Promise<TransactionResponseDto> {
    try {
      const transaction = await this.transactionsRepository.findOne({
        where: { id, userId },
      });

      if (!transaction) {
        throw new NotFoundException('Transação não encontrada');
      }

      transaction.status = TransactionStatus.CANCELED;
      const updatedTransaction =
        await this.transactionsRepository.save(transaction);

      return new TransactionResponseDto(updatedTransaction);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao cancelar transação');
    }
  }

  private async validateTransactionData(
    userId: string,
    data: any,
  ): Promise<void> {
    // Converter datas se necessário
    const transactionDate =
      data.transactionDate instanceof Date
        ? data.transactionDate
        : new Date(data.transactionDate);

    const dueDate =
      data.dueDate instanceof Date
        ? data.dueDate
        : data.dueDate
          ? new Date(data.dueDate)
          : null;

    // Validar datas
    if (dueDate && transactionDate && dueDate < transactionDate) {
      throw new BadRequestException(
        'Data de vencimento não pode ser anterior à data da transação',
      );
    }

    // Validar parcelas
    if (data.installmentsTotal && data.installmentsTotal > 1) {
      if (
        data.installmentsCurrent &&
        data.installmentsCurrent > data.installmentsTotal
      ) {
        throw new BadRequestException(
          'Parcela atual não pode ser maior que o total de parcelas',
        );
      }
    }

    // Validar método de pagamento vs fatura
    if (data.invoiceId && !data.paymentMethodId) {
      throw new BadRequestException(
        'Método de pagamento é obrigatório quando fatura é informada',
      );
    }

    // Validar se é uma transação de cartão de crédito
    if (data.invoiceId && data.type === TransactionType.INCOME) {
      throw new BadRequestException(
        'Transações de receita não podem ser vinculadas a faturas de cartão',
      );
    }

    // Validar valor
    if (data.amount <= 0) {
      throw new BadRequestException(
        'Valor da transação deve ser maior que zero',
      );
    }

    // TODO: Validar se categoria, paymentMethod e invoice pertencem ao usuário
  }

  private async createInstallments(
    userId: string,
    parentTransaction: Transaction,
  ): Promise<void> {
    const installmentAmount =
      Number(parentTransaction.amount) / parentTransaction.installmentsTotal;

    for (let i = 2; i <= parentTransaction.installmentsTotal; i++) {
      const installmentDate = new Date(parentTransaction.transactionDate);
      installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

      const installment = this.transactionsRepository.create({
        description: parentTransaction.description,
        amount: installmentAmount,
        type: parentTransaction.type,
        status: TransactionStatus.PENDING,
        transactionDate: installmentDate,
        dueDate: parentTransaction.dueDate
          ? new Date(parentTransaction.dueDate)
          : null,
        installmentsCurrent: i,
        installmentsTotal: parentTransaction.installmentsTotal,
        notes: parentTransaction.notes,
        tags: parentTransaction.tags,
        userId,
        categoryId: parentTransaction.categoryId,
        paymentMethodId: parentTransaction.paymentMethodId,
        invoiceId: parentTransaction.invoiceId,
        parentTransactionId: parentTransaction.id,
      });

      await this.transactionsRepository.save(installment);
    }
  }

  async getTransactionStats(userId: string): Promise<{
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    pendingTransactions: number;
    upcomingTransactions: number;
  }> {
    try {
      const allTransactions = await this.transactionsRepository.find({
        where: { userId, isActive: true },
      });

      const totalIncome = allTransactions
        .filter((t) => t.isIncome() && t.isCompleted())
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = allTransactions
        .filter((t) => t.isExpense() && t.isCompleted())
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const pendingTransactions = allTransactions.filter((t) =>
        t.isPending(),
      ).length;

      const upcomingDate = new Date();
      upcomingDate.setDate(upcomingDate.getDate() + 7);

      const upcomingTransactions = allTransactions.filter(
        (t) => t.dueDate && t.dueDate <= upcomingDate && t.isPending(),
      ).length;

      return {
        totalTransactions: allTransactions.length,
        totalIncome,
        totalExpenses,
        pendingTransactions,
        upcomingTransactions,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao calcular estatísticas das transações',
      );
    }
  }
}
