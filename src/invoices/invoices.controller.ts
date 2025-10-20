// src/invoices/invoices.controller.ts
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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { InvoiceStatus } from './entities/invoice.entity';
import { InvoicesService } from './invoices.service';
import { InvoiceSchedulerService } from './invoice-scheduler.service';
import { InvoiceLimitService } from './invoice-limit.service';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly invoiceSchedulerService: InvoiceSchedulerService,
    private readonly invoiceLimitService: InvoiceLimitService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova fatura' })
  @ApiResponse({
    status: 201,
    description: 'Fatura criada com sucesso',
    type: InvoiceResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma fatura com este nome',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.create(req.user.userId, createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as faturas do usuário' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir faturas inativas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de faturas retornada com sucesso',
    type: [InvoiceResponseDto],
  })
  async findAll(
    @Request() req,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<InvoiceResponseDto[]> {
    return this.invoicesService.findAll(
      req.user.userId,
      includeInactive === true,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca fatura por ID' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Fatura encontrada',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  async findOne(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza fatura' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Fatura atualizada',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  @ApiResponse({ status: 409, description: 'Conflito na atualização' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.update(req.user.userId, id, updateInvoiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove fatura (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da fatura' })
  @ApiResponse({ status: 204, description: 'Fatura removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Fatura possui métodos de pagamento vinculados',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.invoicesService.remove(req.user.userId, id);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Busca faturas por status' })
  @ApiParam({
    name: 'status',
    enum: InvoiceStatus,
    description: 'Status da fatura',
  })
  @ApiResponse({
    status: 200,
    description: 'Faturas encontradas',
    type: [InvoiceResponseDto],
  })
  async findByStatus(
    @Request() req,
    @Param('status') status: InvoiceStatus,
  ): Promise<InvoiceResponseDto[]> {
    return this.invoicesService.findByStatus(req.user.userId, status);
  }

  @Get('status/open')
  @ApiOperation({ summary: 'Busca todas as faturas abertas' })
  @ApiResponse({
    status: 200,
    description: 'Faturas abertas encontradas',
    type: [InvoiceResponseDto],
  })
  async getOpenInvoices(@Request() req): Promise<InvoiceResponseDto[]> {
    return this.invoicesService.getOpenInvoices(req.user.userId);
  }

  @Get('status/closed')
  @ApiOperation({ summary: 'Busca todas as faturas fechadas' })
  @ApiResponse({
    status: 200,
    description: 'Faturas fechadas encontradas',
    type: [InvoiceResponseDto],
  })
  async getClosedInvoices(@Request() req): Promise<InvoiceResponseDto[]> {
    return this.invoicesService.getClosedInvoices(req.user.userId);
  }

  @Get('status/overdue')
  @ApiOperation({ summary: 'Busca todas as faturas atrasadas' })
  @ApiResponse({
    status: 200,
    description: 'Faturas atrasadas encontradas',
    type: [InvoiceResponseDto],
  })
  async getOverdueInvoices(@Request() req): Promise<InvoiceResponseDto[]> {
    return this.invoicesService.getOverdueInvoices(req.user.userId);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Fecha uma fatura' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Fatura fechada com sucesso',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  @ApiResponse({ status: 400, description: 'Fatura não pode ser fechada' })
  async closeInvoice(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('totalAmount') totalAmount: number,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.closeInvoice(req.user.userId, id, totalAmount);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Marca fatura como paga' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Fatura paga com sucesso',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  @ApiResponse({ status: 400, description: 'Fatura não pode ser paga' })
  async payInvoice(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.payInvoice(req.user.userId, id);
  }

  @Post('defaults')
  @ApiOperation({ summary: 'Cria faturas padrão para o usuário' })
  @ApiResponse({
    status: 201,
    description: 'Faturas padrão criadas com sucesso',
    type: [InvoiceResponseDto],
  })
  @HttpCode(HttpStatus.CREATED)
  async createDefaultInvoices(@Request() req): Promise<InvoiceResponseDto[]> {
    return this.invoicesService.getDefaultInvoices(req.user.userId);
  }

  @Get('status/available')
  @ApiOperation({ summary: 'Obter todos os status de fatura disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Status retornados com sucesso',
  })
  async getAvailableStatus() {
    return {
      status: InvoiceStatus,
      description: {
        [InvoiceStatus.OPEN]: 'Aberta - Aguardando fechamento',
        [InvoiceStatus.CLOSED]: 'Fechada - Aguardando pagamento',
        [InvoiceStatus.PAID]: 'Paga - Pagamento realizado',
        [InvoiceStatus.OVERDUE]: 'Atrasada - Vencida',
        [InvoiceStatus.PENDING]: 'Pendente - Em processamento',
      },
    };
  }

  // No Invoices Controller - adicione este método
  @Post('scheduler/test')
  @ApiOperation({ summary: '[DEV] Executa processamento manual do agendador' })
  @ApiResponse({
    status: 200,
    description: 'Processamento executado com sucesso',
  })
  async testScheduler(@Request() req): Promise<{ message: string }> {
    // Apenas para desenvolvimento - em produção remover ou proteger
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException(
        'Este endpoint não está disponível em produção',
      );
    }

    const result = await this.invoiceSchedulerService.manualProcessForTesting();
    return { message: result };
  }

  // No Invoices Controller - adicionar estes métodos
  @Get(':id/limit-info')
  @ApiOperation({ summary: 'Obter informações detalhadas do limite da fatura' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Informações do limite retornadas com sucesso',
  })
  async getLimitInfo(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceLimitService.getLimitInfo(id);
  }

  @Patch(':id/credit-limit')
  @ApiOperation({ summary: 'Atualizar limite de crédito da fatura' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Limite atualizado com sucesso',
    type: InvoiceResponseDto,
  })
  async updateCreditLimit(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('creditLimit') creditLimit: number,
  ): Promise<InvoiceResponseDto> {
    const updatedInvoice = await this.invoiceLimitService.updateCreditLimit(
      id,
      creditLimit,
    );
    return new InvoiceResponseDto(updatedInvoice);
  }

  @Get('user/limit-overview')
  @ApiOperation({ summary: 'Obter visão geral dos limites do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Visão geral retornada com sucesso',
  })
  async getUserLimitOverview(@Request() req) {
    return this.invoiceLimitService.getUserInvoicesWithLimitInfo(
      req.user.userId,
    );
  }

  @Get('user/limit-statistics')
  @ApiOperation({ summary: 'Obter estatísticas de limite do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
  })
  async getLimitStatistics(@Request() req) {
    return this.invoiceLimitService.getLimitStatistics(req.user.userId);
  }
}
