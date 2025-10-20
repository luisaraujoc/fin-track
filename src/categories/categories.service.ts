// src/categories/categories.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Category } from './entities/category.entity';
import { CategoryType } from './entities/category-type.enum';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategoryIcon } from '../common/enums';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(
    userId: string,
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    try {
      // Verificar se já existe categoria com mesmo nome para o usuário
      const existingCategory = await this.categoriesRepository.findOne({
        where: {
          name: createCategoryDto.name,
          userId,
          isActive: true,
        },
      });

      if (existingCategory) {
        throw new ConflictException('Já existe uma categoria com este nome');
      }

      // Verificar categoria pai (se fornecida)
      let parent: Category | null = null;
      if (createCategoryDto.parentId) {
        parent = await this.categoriesRepository.findOne({
          where: {
            id: createCategoryDto.parentId,
            userId,
            isActive: true,
          },
        });

        if (!parent) {
          throw new NotFoundException('Categoria pai não encontrada');
        }

        // Verificar se a categoria pai permite filhos
        if (parent.hasChildren()) {
          throw new ConflictException('Categoria pai já possui subcategorias');
        }
      }

      const category = this.categoriesRepository.create({
        ...createCategoryDto,
        userId,
        parent,
      });

      const savedCategory = await this.categoriesRepository.save(category);
      return new CategoryResponseDto(savedCategory);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao criar categoria');
    }
  }

  async findAll(
    userId: string,
    type?: CategoryType,
    includeInactive: boolean = false,
  ): Promise<CategoryResponseDto[]> {
    try {
      const where: any = { userId };

      if (!includeInactive) {
        where.isActive = true;
      }

      if (type) {
        where.type = type;
      }

      const categories = await this.categoriesRepository.find({
        where,
        relations: ['parent', 'children'],
        order: {
          order: 'ASC',
          name: 'ASC',
        },
      });

      return categories.map((category) => new CategoryResponseDto(category));
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar categorias');
    }
  }

  async findOne(userId: string, id: string): Promise<CategoryResponseDto> {
    try {
      const category = await this.categoriesRepository.findOne({
        where: { id, userId },
        relations: ['parent', 'children'],
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }

      return new CategoryResponseDto(category);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao buscar categoria');
    }
  }

  async update(
    userId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    try {
      const category = await this.categoriesRepository.findOne({
        where: { id, userId },
        relations: ['parent', 'children'],
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }

      // Verificar se novo nome já existe (se estiver sendo alterado)
      if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
        const existingCategory = await this.categoriesRepository.findOne({
          where: {
            name: updateCategoryDto.name,
            userId,
            isActive: true,
          },
        });

        if (existingCategory) {
          throw new ConflictException('Já existe uma categoria com este nome');
        }
      }

      // Verificar categoria pai (se fornecida)
      if (updateCategoryDto.parentId) {
        const parent = await this.categoriesRepository.findOne({
          where: {
            id: updateCategoryDto.parentId,
            userId,
            isActive: true,
          },
        });

        if (!parent) {
          throw new NotFoundException('Categoria pai não encontrada');
        }

        // Evitar referência circular
        if (parent.id === id) {
          throw new ConflictException(
            'Uma categoria não pode ser pai de si mesma',
          );
        }

        category.parent = parent;
      }

      // Atualizar campos
      Object.assign(category, updateCategoryDto);

      const updatedCategory = await this.categoriesRepository.save(category);
      return new CategoryResponseDto(updatedCategory);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao atualizar categoria');
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    try {
      const category = await this.categoriesRepository.findOne({
        where: { id, userId },
        relations: ['children'],
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }

      // Verificar se tem transações associadas (futuramente)
      // Por enquanto, apenas soft delete
      if (category.hasChildren()) {
        throw new ConflictException(
          'Não é possível excluir uma categoria que possui subcategorias',
        );
      }

      category.isActive = false;
      await this.categoriesRepository.save(category);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao remover categoria');
    }
  }

  // No método getDefaultCategories do Categories Service
  // No método getDefaultCategories do Categories Service
  async getDefaultCategories(userId: string): Promise<CategoryResponseDto[]> {
    const defaultCategories = [
      // Despesas
      {
        name: 'Alimentação',
        type: CategoryType.EXPENSE,
        color: '#EF4444',
        icon: CategoryIcon.FOOD,
        order: 1,
      },
      {
        name: 'Transporte',
        type: CategoryType.EXPENSE,
        color: '#3B82F6',
        icon: CategoryIcon.TRANSPORT,
        order: 2,
      },
      {
        name: 'Moradia',
        type: CategoryType.EXPENSE,
        color: '#8B5CF6',
        icon: CategoryIcon.HOME,
        order: 3,
      },
      {
        name: 'Saúde',
        type: CategoryType.EXPENSE,
        color: '#10B981',
        icon: CategoryIcon.HEALTH,
        order: 4,
      },
      {
        name: 'Educação',
        type: CategoryType.EXPENSE,
        color: '#F59E0B',
        icon: CategoryIcon.EDUCATION,
        order: 5,
      },
      {
        name: 'Lazer',
        type: CategoryType.EXPENSE,
        color: '#EC4899',
        icon: CategoryIcon.ENTERTAINMENT,
        order: 6,
      },
      {
        name: 'Vestuário',
        type: CategoryType.EXPENSE,
        color: '#6366F1',
        icon: CategoryIcon.SHOPPING,
        order: 7,
      },
      {
        name: 'Contas',
        type: CategoryType.EXPENSE,
        color: '#6B7280',
        icon: CategoryIcon.BILLS,
        order: 8,
      },

      // Receitas
      {
        name: 'Salário',
        type: CategoryType.INCOME,
        color: '#10B981',
        icon: CategoryIcon.SALARY,
        order: 9,
      },
      {
        name: 'Freelance',
        type: CategoryType.INCOME,
        color: '#F59E0B',
        icon: CategoryIcon.FREELANCE,
        order: 10,
      },
      {
        name: 'Investimentos',
        type: CategoryType.INCOME,
        color: '#8B5CF6',
        icon: CategoryIcon.INVESTMENTS,
        order: 11,
      },
    ];

    const createdCategories: Category[] = [];

    for (const categoryData of defaultCategories) {
      const category = this.categoriesRepository.create({
        ...categoryData,
        userId,
      });
      const savedCategory = await this.categoriesRepository.save(category);
      createdCategories.push(savedCategory);
    }

    return createdCategories.map((cat) => new CategoryResponseDto(cat));
  }

  // No Categories Service - adicione este método se ainda não tiver
  async createParentCategories(userId: string): Promise<CategoryResponseDto[]> {
    const parentCategoriesData = [
      // Despesas
      {
        name: 'Alimentação',
        type: CategoryType.EXPENSE,
        color: '#EF4444',
        icon: CategoryIcon.FOOD,
        order: 1,
      },
      {
        name: 'Transporte',
        type: CategoryType.EXPENSE,
        color: '#3B82F6',
        icon: CategoryIcon.TRANSPORT,
        order: 2,
      },
      {
        name: 'Moradia',
        type: CategoryType.EXPENSE,
        color: '#8B5CF6',
        icon: CategoryIcon.HOME,
        order: 3,
      },
      {
        name: 'Saúde',
        type: CategoryType.EXPENSE,
        color: '#10B981',
        icon: CategoryIcon.HEALTH,
        order: 4,
      },
      {
        name: 'Educação',
        type: CategoryType.EXPENSE,
        color: '#F59E0B',
        icon: CategoryIcon.EDUCATION,
        order: 5,
      },
      {
        name: 'Lazer',
        type: CategoryType.EXPENSE,
        color: '#EC4899',
        icon: CategoryIcon.ENTERTAINMENT,
        order: 6,
      },
      {
        name: 'Compras',
        type: CategoryType.EXPENSE,
        color: '#6366F1',
        icon: CategoryIcon.SHOPPING,
        order: 7,
      },
      {
        name: 'Contas & Utilidades',
        type: CategoryType.EXPENSE,
        color: '#6B7280',
        icon: CategoryIcon.BILLS,
        order: 8,
      },

      // Receitas
      {
        name: 'Salário',
        type: CategoryType.INCOME,
        color: '#10B981',
        icon: CategoryIcon.SALARY,
        order: 9,
      },
      {
        name: 'Freelance',
        type: CategoryType.INCOME,
        color: '#F59E0B',
        icon: CategoryIcon.FREELANCE,
        order: 10,
      },
      {
        name: 'Investimentos',
        type: CategoryType.INCOME,
        color: '#8B5CF6',
        icon: CategoryIcon.INVESTMENTS,
        order: 11,
      },
      {
        name: 'Bônus',
        type: CategoryType.INCOME,
        color: '#EC4899',
        icon: CategoryIcon.BONUS,
        order: 12,
      },
    ];

    const createdCategories: CategoryResponseDto[] = [];

    for (const categoryData of parentCategoriesData) {
      try {
        // Verificar se já existe
        const existing = await this.categoriesRepository.findOne({
          where: { name: categoryData.name, userId, isActive: true },
        });

        if (!existing) {
          const createCategoryDto: CreateCategoryDto = {
            name: categoryData.name,
            type: categoryData.type,
            color: categoryData.color,
            icon: categoryData.icon,
            order: categoryData.order,
          };

          const category = await this.create(userId, createCategoryDto);
          createdCategories.push(category);
        } else {
          console.log(
            `Categoria "${categoryData.name}" já existe, continuando...`,
          );
        }
      } catch (error) {
        console.error(
          `Erro ao criar categoria ${categoryData.name}:`,
          error.message,
        );
        // Continua para as próximas categorias mesmo com erro
      }
    }

    return createdCategories;
  }
}
