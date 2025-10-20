// src/categories/categories.controller.ts
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategoryType } from './entities/category-type.enum';
import { CategoryIcon } from '../common/enums';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova categoria' })
  @ApiResponse({
    status: 201,
    description: 'Categoria criada com sucesso',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma categoria com este nome',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.create(req.user.userId, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as categorias do usuário' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: CategoryType,
    description: 'Filtrar por tipo de categoria',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir categorias inativas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorias retornada com sucesso',
    type: [CategoryResponseDto],
  })
  async findAll(
    @Request() req,
    @Query('type') type?: CategoryType,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findAll(
      req.user.userId,
      type,
      includeInactive === true,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca categoria por ID' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da categoria' })
  @ApiResponse({
    status: 200,
    description: 'Categoria encontrada',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  async findOne(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza categoria' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da categoria' })
  @ApiResponse({
    status: 200,
    description: 'Categoria atualizada',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiResponse({ status: 409, description: 'Conflito na atualização' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.update(
      req.user.userId,
      id,
      updateCategoryDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove categoria (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID da categoria' })
  @ApiResponse({ status: 204, description: 'Categoria removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiResponse({ status: 409, description: 'Categoria possui subcategorias' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.categoriesService.remove(req.user.userId, id);
  }

  @Post('defaults')
  @ApiOperation({ summary: 'Cria categorias padrão para o usuário' })
  @ApiResponse({
    status: 201,
    description: 'Categorias padrão criadas com sucesso',
    type: [CategoryResponseDto],
  })
  @HttpCode(HttpStatus.CREATED)
  async createDefaultCategories(
    @Request() req,
  ): Promise<CategoryResponseDto[]> {
    return this.categoriesService.getDefaultCategories(req.user.userId);
  }

  @Post('setup/parents')
  @ApiOperation({ summary: 'Cria todas as categorias pais principais' })
  @ApiResponse({
    status: 201,
    description: 'Categorias pais criadas com sucesso',
    type: [CategoryResponseDto],
  })
  @HttpCode(HttpStatus.CREATED)
  async createParentCategories(@Request() req): Promise<CategoryResponseDto[]> {
    return this.categoriesService.createParentCategories(req.user.userId);
  }

  @Get('icons/available')
  @ApiOperation({ summary: 'Obter todos os ícones disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Ícones retornados com sucesso',
  })
  async getAvailableIcons() {
    const { CategoryIcon, IconLibraries } = await import(
      '../common/enums/category-icons.enum'
    );

    return {
      icons: CategoryIcon,
      libraries: Object.keys(IconLibraries),
      defaultLibrary: 'lucide',
    };
  }

  @Get('types/available')
  @ApiOperation({ summary: 'Obter todos os tipos de categoria disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Tipos retornados com sucesso',
  })
  async getAvailableTypes() {
    return {
      types: CategoryType,
      description: {
        [CategoryType.INCOME]: 'Receitas - Dinheiro entrando',
        [CategoryType.EXPENSE]: 'Despesas - Dinheiro saindo',
        [CategoryType.BOTH]: 'Ambos - Pode ser usado para ambos',
      },
    };
  }
}