// src/invoices/invoices.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { InvoiceSchedulerService } from './invoice-scheduler.service';
import { Invoice } from './entities/invoice.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { InvoiceLimitService } from './invoice-limit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, PaymentMethod]), // ✅ Adicionar PaymentMethod
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceSchedulerService, InvoiceLimitService],
  exports: [InvoicesService, InvoiceLimitService], // ✅ Exportar InvoiceLimitService
})
export class InvoicesModule {}