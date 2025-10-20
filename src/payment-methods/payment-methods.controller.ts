// src/payment-methods/payment-methods.controller.ts
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
  ParseUUIDPipe
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
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodResponseDto } from './dto/payment-method-response.dto';
import { PaymentMethodType } from './entities/payment-method.entity';

@ApiTags('payment-methods')
@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo método de pagamento' })
  @ApiResponse({ 
    status: 201, 
    description: 'Método de pagamento criado com sucesso', 
    type: PaymentMethodResponseDto 
  })
  @ApiResponse({ status: 409, description: 'Já existe um método com este nome' })
  @ApiResponse({ status: 400, description: 'Dados inválidos para o tipo selecionado' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createPaymentMethodDto: CreatePaymentMethodDto
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.create(req.user.userId, createPaymentMethodDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os métodos de pagamento do usuário' })
  @ApiQuery({ 
    name: 'includeInactive', 
    required: false, 
    type: Boolean,
    description: 'Incluir métodos de pagamento inativos' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de métodos de pagamento retornada com sucesso',
    type: [PaymentMethodResponseDto]
  })
  async findAll(
    @Request() req,
    @Query('includeInactive') includeInactive?: boolean
  ): Promise<PaymentMethodResponseDto[]> {
    return this.paymentMethodsService.findAll(
      req.user.userId, 
      includeInactive === true
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca método de pagamento por ID' })
  @ApiParam({ name: 'id', type: String, description: 'UUID do método de pagamento' })
  @ApiResponse({ 
    status: 200, 
    description: 'Método de pagamento encontrado', 
    type: PaymentMethodResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Método de pagamento não encontrado' })
  async findOne(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza método de pagamento' })
  @ApiParam({ name: 'id', type: String, description: 'UUID do método de pagamento' })
  @ApiResponse({ 
    status: 200, 
    description: 'Método de pagamento atualizado', 
    type: PaymentMethodResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Método de pagamento não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito na atualização' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.update(req.user.userId, id, updatePaymentMethodDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove método de pagamento (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID do método de pagamento' })
  @ApiResponse({ status: 204, description: 'Método de pagamento removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Método de pagamento não encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    return this.paymentMethodsService.remove(req.user.userId, id);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Busca métodos de pagamento por tipo' })
  @ApiParam({ name: 'type', enum: PaymentMethodType, description: 'Tipo do método de pagamento' })
  @ApiResponse({ 
    status: 200, 
    description: 'Métodos de pagamento encontrados',
    type: [PaymentMethodResponseDto]
  })
  async findByType(
    @Request() req,
    @Param('type') type: PaymentMethodType
  ): Promise<PaymentMethodResponseDto[]> {
    return this.paymentMethodsService.findByType(req.user.userId, type);
  }

  @Get('credit-cards/all')
  @ApiOperation({ summary: 'Busca todos os cartões de crédito' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cartões de crédito encontrados',
    type: [PaymentMethodResponseDto]
  })
  async getCreditCards(
    @Request() req
  ): Promise<PaymentMethodResponseDto[]> {
    return this.paymentMethodsService.getCreditCards(req.user.userId);
  }

  @Post('defaults')
  @ApiOperation({ summary: 'Cria métodos de pagamento padrão para o usuário' })
  @ApiResponse({ 
    status: 201, 
    description: 'Métodos de pagamento padrão criados com sucesso',
    type: [PaymentMethodResponseDto]
  })
  @HttpCode(HttpStatus.CREATED)
  async createDefaultPaymentMethods(
    @Request() req
  ): Promise<PaymentMethodResponseDto[]> {
    return this.paymentMethodsService.getDefaultPaymentMethods(req.user.userId);
  }

  @Get('types/available')
  @ApiOperation({ summary: 'Obter todos os tipos de métodos de pagamento disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Tipos retornados com sucesso',
  })
  async getAvailableTypes() {
    return {
      types: PaymentMethodType,
      description: {
        [PaymentMethodType.CREDIT_CARD]: 'Cartão de Crédito',
        [PaymentMethodType.DEBIT_CARD]: 'Cartão de Débito',
        [PaymentMethodType.PIX]: 'PIX',
        [PaymentMethodType.CASH]: 'Dinheiro',
        [PaymentMethodType.BANK_TRANSFER]: 'Transferência Bancária',
        [PaymentMethodType.OTHER]: 'Outro'
      }
    };
  }
}