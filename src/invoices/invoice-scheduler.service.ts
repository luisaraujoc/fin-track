// src/invoices/invoice-scheduler.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';

@Injectable()
export class InvoiceSchedulerService {
  private readonly logger = new Logger(InvoiceSchedulerService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
  ) {}

  /**
   * Executa TODO DIA às 06:00 AM
   * Processa: Fechamento, Criação nova fatura, Marcar atrasadas
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async processInvoicesAutomatically() {
    this.logger.log('🚀 Iniciando processamento automático de faturas...');
    
    const today = new Date();
    const currentDay = today.getDate();

    try {
      // 1. FECHAR faturas abertas cujo closingDay é hoje
      await this.closeDueInvoices(currentDay);
      
      // 2. CRIAR novas faturas para o próximo mês
      await this.createNextMonthInvoices();
      
      // 3. MARCAR como ATRASADAS faturas vencidas
      await this.markOverdueInvoices(today);

      this.logger.log('✅ Processamento automático de faturas concluído');
    } catch (error) {
      this.logger.error('❌ Erro no processamento automático:', error);
    }
  }

  /**
   * Fecha faturas abertas cujo dia de fechamento é hoje
   */
  private async closeDueInvoices(currentDay: number): Promise<void> {
    const invoicesToClose = await this.invoicesRepository.find({
      where: {
        status: InvoiceStatus.OPEN,
        closingDay: currentDay,
        isActive: true,
      },
      relations: ['user', 'paymentMethods'],
    });

    this.logger.log(`📋 Encontradas ${invoicesToClose.length} faturas para fechar`);

    for (const invoice of invoicesToClose) {
      try {
        // Calcular valor total (placeholder por enquanto)
        const totalAmount = await this.calculateInvoiceTotal(invoice);
        
        // Fechar fatura
        invoice.status = InvoiceStatus.CLOSED;
        invoice.totalAmount = totalAmount;
        invoice.closingDate = new Date();
        
        // Calcular data de vencimento
        invoice.dueDate = this.calculateDueDate(invoice.closingDate, invoice.dueDay);
        
        await this.invoicesRepository.save(invoice);
        this.logger.log(`🔒 Fatura "${invoice.name}" fechada automaticamente - Vencimento: ${invoice.dueDate.toISOString().split('T')[0]}`);
      } catch (error) {
        this.logger.error(`❌ Erro ao fechar fatura ${invoice.id}:`, error);
      }
    }
  }

  /**
   * Cria novas faturas para o próximo mês baseado nas faturas atuais
   */
  private async createNextMonthInvoices(): Promise<void> {
    // Buscar todas as faturas ativas para criar as do próximo mês
    const activeInvoices = await this.invoicesRepository.find({
      where: {
        isActive: true,
      },
      relations: ['user'],
    });

    this.logger.log(`📊 Verificando ${activeInvoices.length} faturas ativas para criar próximas`);

    const nextMonth = this.getNextMonth();
    const nextMonthName = nextMonth.toLocaleString('pt-BR', { month: 'long' });
    const nextMonthYear = nextMonth.getFullYear();

    let createdCount = 0;

    for (const invoice of activeInvoices) {
      try {
        // Nome da nova fatura: "Fatura Nubank Novembro 2025"
        const newInvoiceName = `${invoice.name} ${nextMonthName.charAt(0).toUpperCase() + nextMonthName.slice(1)} ${nextMonthYear}`;
        
        // Verificar se já existe fatura com este nome para o usuário
        const existingInvoice = await this.invoicesRepository.findOne({
          where: {
            name: newInvoiceName,
            userId: invoice.userId,
            isActive: true,
          },
        });

        if (!existingInvoice) {
          // Criar nova fatura para o próximo mês
          const newInvoice = this.invoicesRepository.create({
            name: newInvoiceName,
            description: invoice.description,
            closingDay: invoice.closingDay,
            dueDay: invoice.dueDay,
            color: invoice.color,
            icon: invoice.icon,
            order: invoice.order,
            userId: invoice.userId,
            status: InvoiceStatus.OPEN,
          });

          await this.invoicesRepository.save(newInvoice);
          createdCount++;
          this.logger.log(`🆕 Nova fatura criada: "${newInvoice.name}"`);
        }
      } catch (error) {
        this.logger.error(`❌ Erro ao criar próxima fatura para ${invoice.name}:`, error);
      }
    }

    this.logger.log(`🎉 ${createdCount} novas faturas criadas para ${nextMonthName} ${nextMonthYear}`);
  }

  /**
   * Marca faturas fechadas como ATRASADAS se passaram do vencimento
   */
  private async markOverdueInvoices(today: Date): Promise<void> {
    // Buscar faturas fechadas com vencimento hoje ou antes
    const overdueInvoices = await this.invoicesRepository.find({
      where: {
        status: InvoiceStatus.CLOSED,
        dueDate: LessThanOrEqual(today),
        isActive: true,
      },
    });

    this.logger.log(`⏰ Verificando ${overdueInvoices.length} faturas para marcar como atrasadas`);

    let markedCount = 0;

    for (const invoice of overdueInvoices) {
      try {
        invoice.status = InvoiceStatus.OVERDUE;
        await this.invoicesRepository.save(invoice);
        markedCount++;
        this.logger.log(`⚠️ Fatura "${invoice.name}" marcada como ATRASADA (vencimento: ${invoice.dueDate.toISOString().split('T')[0]})`);
      } catch (error) {
        this.logger.error(`❌ Erro ao marcar fatura ${invoice.id} como atrasada:`, error);
      }
    }

    if (markedCount > 0) {
      this.logger.log(`🔔 ${markedCount} faturas marcadas como ATRASADAS`);
    }
  }

  /**
   * Calcula o total da fatura (placeholder - será implementado com Transactions)
   */
  private async calculateInvoiceTotal(invoice: Invoice): Promise<number> {
    // TODO: Implementar cálculo real baseado nas transações dos payment methods
    // Por enquanto, retorna um valor aleatório para demonstração
    const randomAmount = Math.floor(Math.random() * 1000) + 100;
    this.logger.log(`💰 Total calculado para fatura "${invoice.name}": R$ ${randomAmount.toFixed(2)}`);
    return randomAmount;
  }

  /**
   * Calcula data de vencimento baseada na data de fechamento e dia de vencimento
   */
  private calculateDueDate(closingDate: Date, dueDay: number): Date {
    const dueDate = new Date(closingDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(dueDay);
    
    // Ajustar se o dia não existe no mês (ex: 31 em fevereiro)
    if (dueDate.getDate() !== dueDay) {
      dueDate.setDate(0); // Último dia do mês anterior
    }
    
    return dueDate;
  }

  /**
   * Retorna a data do próximo mês
   */
  private getNextMonth(): Date {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }

  /**
   * Método manual para testar o processamento (útil para desenvolvimento)
   */
  async manualProcessForTesting(): Promise<string> {
    this.logger.log('🧪 Executando processamento manual para testes...');
    await this.processInvoicesAutomatically();
    return 'Processamento manual executado com sucesso!';
  }
}