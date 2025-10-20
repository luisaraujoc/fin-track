// src/invoices/invoices.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
  ) {}

  async create(userId: string, createInvoiceDto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    try {
      // Validações
      this.validateInvoiceData(createInvoiceDto);

      // Verificar se já existe fatura com mesmo nome para o usuário
      const existingInvoice = await this.invoicesRepository.findOne({
        where: { 
          name: createInvoiceDto.name, 
          userId,
          isActive: true 
        },
      });

      if (existingInvoice) {
        throw new ConflictException('Já existe uma fatura com este nome');
      }

      const invoice = this.invoicesRepository.create({
        ...createInvoiceDto,
        userId,
      });

      const savedInvoice = await this.invoicesRepository.save(invoice);
      
      // Carregar relações para a resposta
      const invoiceWithRelations = await this.invoicesRepository.findOne({
        where: { id: savedInvoice.id },
        relations: ['paymentMethods'],
      });

      return new InvoiceResponseDto(invoiceWithRelations);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao criar fatura');
    }
  }

  async findAll(userId: string, includeInactive: boolean = false): Promise<InvoiceResponseDto[]> {
    try {
      const where: any = { userId };
      
      if (!includeInactive) {
        where.isActive = true;
      }

      const invoices = await this.invoicesRepository.find({
        where,
        relations: ['paymentMethods'],
        order: { 
          order: 'ASC',
          name: 'ASC' 
        },
      });

      return invoices.map(invoice => new InvoiceResponseDto(invoice));
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar faturas');
    }
  }

  async findOne(userId: string, id: string): Promise<InvoiceResponseDto> {
    try {
      const invoice = await this.invoicesRepository.findOne({
        where: { id, userId },
        relations: ['paymentMethods'],
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      return new InvoiceResponseDto(invoice);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao buscar fatura');
    }
  }

  async update(userId: string, id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<InvoiceResponseDto> {
    try {
      const invoice = await this.invoicesRepository.findOne({
        where: { id, userId },
        relations: ['paymentMethods'],
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      // Validações
      if (Object.keys(updateInvoiceDto).length > 0) {
        const dataToValidate = {
          closingDay: updateInvoiceDto.closingDay ?? invoice.closingDay,
          dueDay: updateInvoiceDto.dueDay ?? invoice.dueDay,
        };
        this.validateInvoiceData(dataToValidate);
      }

      // Verificar se novo nome já existe (se estiver sendo alterado)
      if (updateInvoiceDto.name && updateInvoiceDto.name !== invoice.name) {
        const existingInvoice = await this.invoicesRepository.findOne({
          where: { 
            name: updateInvoiceDto.name, 
            userId,
            isActive: true 
          },
        });
        
        if (existingInvoice) {
          throw new ConflictException('Já existe uma fatura com este nome');
        }
      }

      // Atualizar campos
      Object.assign(invoice, updateInvoiceDto);
      
      const updatedInvoice = await this.invoicesRepository.save(invoice);
      return new InvoiceResponseDto(updatedInvoice);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao atualizar fatura');
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    try {
      const invoice = await this.invoicesRepository.findOne({
        where: { id, userId },
        relations: ['paymentMethods'],
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      // Verificar se existem payment methods vinculados
      if (invoice.paymentMethods && invoice.paymentMethods.length > 0) {
        throw new ConflictException('Não é possível excluir uma fatura com métodos de pagamento vinculados');
      }

      // Soft delete
      invoice.isActive = false;
      await this.invoicesRepository.save(invoice);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao remover fatura');
    }
  }

  async findByStatus(userId: string, status: InvoiceStatus): Promise<InvoiceResponseDto[]> {
    try {
      const invoices = await this.invoicesRepository.find({
        where: { 
          userId,
          status,
          isActive: true 
        },
        relations: ['paymentMethods'],
        order: { dueDate: 'ASC' },
      });

      return invoices.map(invoice => new InvoiceResponseDto(invoice));
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar faturas por status');
    }
  }

  async getOpenInvoices(userId: string): Promise<InvoiceResponseDto[]> {
    return this.findByStatus(userId, InvoiceStatus.OPEN);
  }

  async getClosedInvoices(userId: string): Promise<InvoiceResponseDto[]> {
    return this.findByStatus(userId, InvoiceStatus.CLOSED);
  }

  async getOverdueInvoices(userId: string): Promise<InvoiceResponseDto[]> {
    return this.findByStatus(userId, InvoiceStatus.OVERDUE);
  }

  async closeInvoice(userId: string, id: string, totalAmount: number): Promise<InvoiceResponseDto> {
    try {
      const invoice = await this.invoicesRepository.findOne({
        where: { id, userId },
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      if (!invoice.canClose()) {
        throw new BadRequestException('Fatura não pode ser fechada no momento');
      }

      invoice.status = InvoiceStatus.CLOSED;
      invoice.totalAmount = totalAmount;
      invoice.closingDate = new Date();

      // Calcular data de vencimento baseada no dueDay
      const dueDate = this.calculateDueDate(invoice.closingDate, invoice.dueDay);
      invoice.dueDate = dueDate;

      const updatedInvoice = await this.invoicesRepository.save(invoice);
      return new InvoiceResponseDto(updatedInvoice);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao fechar fatura');
    }
  }

  async payInvoice(userId: string, id: string): Promise<InvoiceResponseDto> {
    try {
      const invoice = await this.invoicesRepository.findOne({
        where: { id, userId },
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      if (!invoice.canPay()) {
        throw new BadRequestException('Fatura não pode ser paga no momento');
      }

      invoice.status = InvoiceStatus.PAID;
      invoice.paymentDate = new Date();

      const updatedInvoice = await this.invoicesRepository.save(invoice);
      return new InvoiceResponseDto(updatedInvoice);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao pagar fatura');
    }
  }

  async getDefaultInvoices(userId: string): Promise<InvoiceResponseDto[]> {
    const defaultInvoices = [
      { 
        name: 'Fatura Nubank', 
        description: 'Fatura consolidada dos cartões Nubank',
        closingDay: 5, 
        dueDay: 10, 
        color: '#8B5CF6', 
        icon: '📄', 
        order: 1 
      },
      { 
        name: 'Fatura Inter', 
        description: 'Fatura consolidada dos cartões Inter',
        closingDay: 8, 
        dueDay: 13, 
        color: '#FF6B6B', 
        icon: '📄', 
        order: 2 
      },
    ];

    const createdInvoices: InvoiceResponseDto[] = [];

    for (const invoiceData of defaultInvoices) {
      try {
        const createDto: CreateInvoiceDto = {
          name: invoiceData.name,
          description: invoiceData.description,
          closingDay: invoiceData.closingDay,
          dueDay: invoiceData.dueDay,
          color: invoiceData.color,
          icon: invoiceData.icon,
          order: invoiceData.order,
        };

        const invoice = await this.create(userId, createDto);
        createdInvoices.push(invoice);
      } catch (error) {
        // Se já existir, ignora e continua
        if (error.getStatus && error.getStatus() === 409) {
          continue;
        }
        // Para outros erros, apenas continua sem parar o processo
      }
    }

    return createdInvoices;
  }

  private validateInvoiceData(data: Partial<Invoice>): void {
    if (data.closingDay && data.dueDay && data.closingDay >= data.dueDay) {
      throw new BadRequestException('Dia de fechamento deve ser anterior ao dia de vencimento');
    }

    if (data.closingDay && (data.closingDay < 1 || data.closingDay > 31)) {
      throw new BadRequestException('Dia de fechamento deve ser entre 1 e 31');
    }

    if (data.dueDay && (data.dueDay < 1 || data.dueDay > 31)) {
      throw new BadRequestException('Dia de vencimento deve ser entre 1 e 31');
    }
  }

  private calculateDueDate(closingDate: Date, dueDay: number): Date {
    const dueDate = new Date(closingDate);
    
    // Ir para o próximo mês
    dueDate.setMonth(dueDate.getMonth() + 1);
    
    // Definir o dia de vencimento
    dueDate.setDate(dueDay);
    
    return dueDate;
  }
}