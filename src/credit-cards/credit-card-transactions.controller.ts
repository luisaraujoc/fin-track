import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CreditCardTransactionsService } from './credit-card-transactions.service';
import { CreateCreditCardTransactionDto } from './dto/create-credit-card-transaction.dto';
import { UpdateCreditCardTransactionDto } from './dto/update-credit-card-transaction.dto';
import { CreditCardTransactionResponseDto } from './dto/credit-card-transaction-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('credit-cards/:creditCardId/transactions')
@UseGuards(JwtAuthGuard)
export class CreditCardTransactionsController {
  constructor(
    private readonly creditCardTransactionsService: CreditCardTransactionsService,
  ) {}

  @Post()
  create(
    @Param('creditCardId') creditCardId: string,
    @Body() createTransactionDto: CreateCreditCardTransactionDto,
    @Request() req,
  ): Promise<CreditCardTransactionResponseDto> {
    return this.creditCardTransactionsService.create(
      { ...createTransactionDto, credit_card_id: creditCardId },
      req.user.id,
    );
  }

  @Get()
  findAll(
    @Param('creditCardId') creditCardId: string,
    @Request() req,
  ): Promise<CreditCardTransactionResponseDto[]> {
    return this.creditCardTransactionsService.findAllByCreditCard(creditCardId, req.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<CreditCardTransactionResponseDto> {
    return this.creditCardTransactionsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateCreditCardTransactionDto,
    @Request() req,
  ): Promise<CreditCardTransactionResponseDto> {
    return this.creditCardTransactionsService.update(id, updateTransactionDto, req.user.id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    return this.creditCardTransactionsService.remove(id, req.user.id);
  }
}