// src/invoices/invoice-limit.service.ts
import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';

@Injectable()
export class InvoiceLimitService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(PaymentMethod)
    private paymentMethodsRepository: Repository<PaymentMethod>,
  ) {}

  /**
   * Verifica se há limite disponível para uma compra
   */
  async canMakePurchase(invoiceId: string, amount: number): Promise<boolean> {
    try {
      const invoice = await this.invoicesRepository.findOne({
        where: { id: invoiceId, isActive: true }
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      if (!invoice.creditLimit) {
        throw new BadRequestException('Esta fatura não possui limite de crédito definido');
      }

      return invoice.hasAvailableLimit(amount);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao verificar limite disponível');
    }
  }

  /**
   * Utiliza parte do limite da fatura
   */
  async useLimit(invoiceId: string, amount: number): Promise<Invoice> {
    try {
      const invoice = await this.invoicesRepository.findOne({
        where: { id: invoiceId, isActive: true }
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      if (!invoice.creditLimit) {
        throw new BadRequestException('Esta fatura não possui limite de crédito definido');
      }

      // Verificar se há limite disponível
      if (!invoice.hasAvailableLimit(amount)) {
        throw new BadRequestException(
          `Limite insuficiente. Disponível: R$ ${invoice.availableLimit.toFixed(2)}, Necessário: R$ ${amount.toFixed(2)}`
        );
      }

      // Utilizar o limite
      invoice.useLimit(amount);
      
      const updatedInvoice = await this.invoicesRepository.save(invoice);
      
      console.log(`💰 Limite utilizado: R$ ${amount.toFixed(2)} na fatura "${invoice.name}". Disponível: R$ ${updatedInvoice.availableLimit.toFixed(2)}`);
      
      return updatedInvoice;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao utilizar limite');
    }
  }

  /**
   * Libera limite (para estornos, cancelamentos, exclusões)
   */
  async releaseLimit(invoiceId: string, amount: number): Promise<Invoice> {
    try {
      const invoice = await this.invoicesRepository.findOne({
        where: { id: invoiceId, isActive: true }
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      // Liberar o limite
      invoice.releaseLimit(amount);
      
      const updatedInvoice = await this.invoicesRepository.save(invoice);
      
      console.log(`🔄 Limite liberado: R$ ${amount.toFixed(2)} na fatura "${invoice.name}". Disponível: R$ ${updatedInvoice.availableLimit.toFixed(2)}`);
      
      return updatedInvoice;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao liberar limite');
    }
  }

  /**
   * Atualiza o limite total da fatura
   */
  async updateCreditLimit(invoiceId: string, newLimit: number): Promise<Invoice> {
    try {
      const invoice = await this.invoicesRepository.findOne({
        where: { id: invoiceId, isActive: true }
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      // Validar novo limite
      if (newLimit < Number(invoice.usedLimit)) {
        throw new BadRequestException(
          `Novo limite (R$ ${newLimit.toFixed(2)}) não pode ser menor que o limite já utilizado (R$ ${Number(invoice.usedLimit).toFixed(2)})`
        );
      }

      if (newLimit <= 0) {
        throw new BadRequestException('Limite deve ser maior que zero');
      }

      invoice.updateCreditLimit(newLimit);
      
      const updatedInvoice = await this.invoicesRepository.save(invoice);
      
      console.log(`📈 Limite atualizado: R$ ${newLimit.toFixed(2)} na fatura "${invoice.name}". Disponível: R$ ${updatedInvoice.availableLimit.toFixed(2)}`);
      
      return updatedInvoice;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao atualizar limite');
    }
  }

  /**
   * Obtém informações detalhadas do limite
   */
  async getLimitInfo(invoiceId: string): Promise<{
    available: number;
    used: number;
    total: number;
    usagePercentage: number;
    creditCards: number;
    status: string;
  }> {
    try {
      const invoice = await this.invoicesRepository.findOne({
        where: { id: invoiceId, isActive: true },
        relations: ['paymentMethods']
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      const creditCardsCount = invoice.getCreditCards().length;
      const limitInfo = invoice.getLimitInfo();

      return {
        ...limitInfo,
        creditCards: creditCardsCount,
        status: this.getLimitStatus(limitInfo.usagePercentage),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao obter informações do limite');
    }
  }

  /**
   * Obtém o limite disponível
   */
  async getAvailableLimit(invoiceId: string): Promise<number> {
    try {
      const invoice = await this.invoicesRepository.findOne({
        where: { id: invoiceId, isActive: true }
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      return invoice.availableLimit;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao obter limite disponível');
    }
  }

  /**
   * Obtém todas as faturas com informações de limite para um usuário
   */
  async getUserInvoicesWithLimitInfo(userId: string): Promise<any[]> {
    try {
      const invoices = await this.invoicesRepository.find({
        where: { userId, isActive: true },
        relations: ['paymentMethods']
      });

      return invoices.map(invoice => {
        const limitInfo = invoice.getLimitInfo();
        const creditCards = invoice.getCreditCards();
        
        return {
          id: invoice.id,
          name: invoice.name,
          status: invoice.status,
          creditLimit: invoice.creditLimit ? Number(invoice.creditLimit) : null,
          usedLimit: Number(invoice.usedLimit),
          availableLimit: invoice.availableLimit,
          usagePercentage: limitInfo.usagePercentage,
          limitStatus: this.getLimitStatus(limitInfo.usagePercentage),
          creditCardsCount: creditCards.length,
          creditCards: creditCards.map(card => ({
            id: card.id,
            name: card.getDisplayName(),
            lastFourDigits: card.lastFourDigits,
          })),
          canMakePurchases: invoice.creditLimit ? invoice.availableLimit > 0 : false,
        };
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar faturas com informações de limite');
    }
  }

  /**
   * Valida se uma transação pode ser criada considerando o limite
   */
  async validateTransactionWithLimit(
    invoiceId: string, 
    amount: number, 
    type: string
  ): Promise<{ canProceed: boolean; availableLimit?: number; message?: string }> {
    try {
      // Apenas transações de despesa em cartão de crédito usam limite
      if (type !== 'expense' || !invoiceId) {
        return { canProceed: true };
      }

      const invoice = await this.invoicesRepository.findOne({
        where: { id: invoiceId, isActive: true }
      });

      if (!invoice) {
        return { 
          canProceed: false, 
          message: 'Fatura não encontrada' 
        };
      }

      if (!invoice.creditLimit) {
        return { 
          canProceed: false, 
          message: 'Esta fatura não possui limite de crédito definido' 
        };
      }

      if (!invoice.hasAvailableLimit(amount)) {
        return {
          canProceed: false,
          availableLimit: invoice.availableLimit,
          message: `Limite insuficiente. Disponível: R$ ${invoice.availableLimit.toFixed(2)}`
        };
      }

      return { 
        canProceed: true, 
        availableLimit: invoice.availableLimit 
      };
    } catch (error) {
      return {
        canProceed: false,
        message: 'Erro ao validar limite'
      };
    }
  }

  /**
   * Retorna o status do limite baseado na porcentagem de uso
   */
  private getLimitStatus(usagePercentage: number): string {
    if (usagePercentage >= 90) return 'critical';
    if (usagePercentage >= 75) return 'warning';
    if (usagePercentage >= 50) return 'attention';
    return 'healthy';
  }

  /**
   * Obtém estatísticas de limite para dashboard
   */
  async getLimitStatistics(userId: string): Promise<{
    totalLimit: number;
    totalUsed: number;
    totalAvailable: number;
    averageUsage: number;
    criticalInvoices: number;
    healthyInvoices: number;
  }> {
    try {
      const invoices = await this.invoicesRepository.find({
        where: { userId, isActive: true, creditLimit: Not(IsNull()) }
      });

      let totalLimit = 0;
      let totalUsed = 0;
      let criticalCount = 0;
      let healthyCount = 0;

      invoices.forEach(invoice => {
        totalLimit += Number(invoice.creditLimit);
        totalUsed += Number(invoice.usedLimit);
        
        const usagePercentage = invoice.getLimitUsagePercentage();
        if (usagePercentage >= 75) {
          criticalCount++;
        } else {
          healthyCount++;
        }
      });

      const totalAvailable = totalLimit - totalUsed;
      const averageUsage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

      return {
        totalLimit,
        totalUsed,
        totalAvailable,
        averageUsage,
        criticalInvoices: criticalCount,
        healthyInvoices: healthyCount,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao calcular estatísticas de limite');
    }
  }
}