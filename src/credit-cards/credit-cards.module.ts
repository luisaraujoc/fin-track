import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditCardsService } from './credit-cards.service';
import { CreditCardsController } from './credit-cards.controller';
import { CreditCardTransactionsService } from './credit-card-transactions.service';
import { CreditCardTransactionsController } from './credit-card-transactions.controller';
import { CreditCard } from './entities/credit-card.entity';
import { CreditCardTransaction } from './entities/credit-card-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CreditCard, CreditCardTransaction])],
  controllers: [CreditCardsController, CreditCardTransactionsController],
  providers: [CreditCardsService, CreditCardTransactionsService],
  exports: [CreditCardsService],
})
export class CreditCardsModule {}