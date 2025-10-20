// src/users/users.controller.ts
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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Public } from '../common/decorators';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiCreatedResponse({ 
    description: 'Usuário criado com sucesso', 
    type: UserResponseDto 
  })
  @ApiResponse({ status: 409, description: 'Username ou email já existe' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os usuários com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiOkResponse({ 
    description: 'Lista de usuários retornada com sucesso',
    schema: {
      example: {
        users: [],
        total: 0,
        page: 1,
        limit: 10
      }
    }
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<{ users: UserResponseDto[]; total: number; page: number; limit: number }> {
    const result = await this.usersService.findAll(page, limit);
    
    return {
      ...result,
      page,
      limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca usuário por ID' })
  @ApiParam({ name: 'id', type: String, description: 'UUID do usuário' })
  @ApiOkResponse({ description: 'Usuário encontrado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza usuário' })
  @ApiParam({ name: 'id', type: String, description: 'UUID do usuário' })
  @ApiOkResponse({ description: 'Usuário atualizado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Username ou email já existe' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove usuário (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID do usuário' })
  @ApiNoContentResponse({ description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }

  @Patch(':id/verify-email')
  @ApiOperation({ summary: 'Marca email como verificado' })
  @ApiParam({ name: 'id', type: String, description: 'UUID do usuário' })
  @ApiOkResponse({ description: 'Email verificado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async verifyEmail(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.verifyEmail(id);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Busca estatísticas de usuários' })
  @ApiOkResponse({
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      example: {
        totalUsers: 10,
        activeUsers: 8,
        verifiedUsers: 5
      }
    }
  })
  async getStats() {
    return this.usersService.getStats();
  }

  @Get('username/:username')
  @Public()
  @ApiOperation({ summary: 'Verifica disponibilidade de username' })
  @ApiParam({ name: 'username', type: String, description: 'Username para verificar' })
  @ApiOkResponse({
    description: 'Disponibilidade verificada',
    schema: {
      example: {
        exists: false,
        username: 'joaosilva'
      }
    }
  })
  async findByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    
    return {
      exists: !!user,
      username: username,
    };
  }

  @Get('email/:email')
  @Public()
  @ApiOperation({ summary: 'Verifica disponibilidade de email' })
  @ApiParam({ name: 'email', type: String, description: 'Email para verificar' })
  @ApiOkResponse({
    description: 'Disponibilidade verificada',
    schema: {
      example: {
        exists: false,
        email: 'joao@email.com'
      }
    }
  })
  async findByEmail(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    
    return {
      exists: !!user,
      email: email,
    };
  }
}