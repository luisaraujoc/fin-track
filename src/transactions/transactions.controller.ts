// src/transactions/transactions.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionType } from './entities/transaction.entity';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova transação' })
  @ApiResponse({ 
    status: 201, 
    description: 'Transação criada com sucesso', 
    type: TransactionResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createTransactionDto: CreateTransactionDto
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.create(req.user.userId, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as transações do usuário' })
  @ApiQuery({ 
    name: 'includeInactive', 
    required: false, 
    type: Boolean,
    description: 'Incluir transações inativas' 
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Página (padrão: 1)' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Itens por página (padrão: 50)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de transações retornada com sucesso',
    schema: {
      example: {
        transactions: [],
        total: 0
      }
    }
  })
  async findAll(
    @Request() req,
    @Query('includeInactive') includeInactive?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number
  ): Promise<{ transactions: TransactionResponseDto[]; total: number }> {
    return this.transactionsService.findAll(
      req.user.userId, 
      includeInactive === true,
      page,
      limit
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca transação por ID' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da transação' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transação encontrada', 
    type: TransactionResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  async findOne(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza transação' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da transação' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transação atualizada', 
    type: TransactionResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTransactionDto: UpdateTransactionDto
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.update(req.user.userId, id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove transação (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da transação' })
  @ApiResponse({ status: 204, description: 'Transação removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    return this.transactionsService.remove(req.user.userId, id);
  }

  @Get('period/:startDate/:endDate')
  @ApiOperation({ summary: 'Busca transações por período' })
  @ApiParam({ name: 'startDate', type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiParam({ name: 'endDate', type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transações encontradas',
    type: [TransactionResponseDto]
  })
  async findByPeriod(
    @Request() req,
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string
  ): Promise<TransactionResponseDto[]> {
    return this.transactionsService.findByPeriod(req.user.userId, startDate, endDate);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Busca transações por categoria' })
  @ApiParam({ name: 'categoryId', type: String, description: 'UUID da categoria' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transações encontradas',
    type: [TransactionResponseDto]
  })
  async findByCategory(
    @Request() req,
    @Param('categoryId', ParseUUIDPipe) categoryId: string
  ): Promise<TransactionResponseDto[]> {
    return this.transactionsService.findByCategory(req.user.userId, categoryId);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Busca transações por tipo' })
  @ApiParam({ name: 'type', enum: TransactionType, description: 'Tipo da transação' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transações encontradas',
    type: [TransactionResponseDto]
  })
  async findByType(
    @Request() req,
    @Param('type') type: TransactionType
  ): Promise<TransactionResponseDto[]> {
    return this.transactionsService.findByType(req.user.userId, type);
  }

  @Get('summary/monthly')
  @ApiOperation({ summary: 'Resumo mensal das transações' })
  @ApiQuery({ name: 'year', required: true, type: Number, description: 'Ano (ex: 2025)' })
  @ApiQuery({ name: 'month', required: true, type: Number, description: 'Mês (1-12)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Resumo calculado com sucesso',
    schema: {
      example: {
        totalIncome: 5000,
        totalExpenses: 3500,
        balance: 1500,
        transactionsCount: 45
      }
    }
  })
  async getMonthlySummary(
    @Request() req,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number
  ): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionsCount: number;
  }> {
    return this.transactionsService.getMonthlySummary(req.user.userId, year, month);
  }

  @Get('types/available')
  @ApiOperation({ summary: 'Obter todos os tipos de transação disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Tipos retornados com sucesso',
  })
  async getAvailableTypes() {
    return {
      types: TransactionType,
      description: {
        [TransactionType.INCOME]: 'Receita - Dinheiro entrando',
        [TransactionType.EXPENSE]: 'Despesa - Dinheiro saindo',
      }
    };
  }
}