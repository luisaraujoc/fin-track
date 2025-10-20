// src/users/users.service.ts
import { Injectable, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Cria um novo usuário
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // Verificar se username já existe
      const existingUserByUsername = await this.usersRepository.findOne({
        where: { username: createUserDto.username },
      });
      
      if (existingUserByUsername) {
        throw new ConflictException('Username já está em uso');
      }

      // Verificar se email já existe
      const existingUserByEmail = await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUserByEmail) {
        throw new ConflictException('Email já está em uso');
      }

      // Criar novo usuário
      const user = this.usersRepository.create(createUserDto);
      const savedUser = await this.usersRepository.save(user);

      return new UserResponseDto(savedUser);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao criar usuário');
    }
  }

  /**
   * Busca todos os usuários (com paginação)
   */
  async findAll(page: number = 1, limit: number = 10): Promise<{ users: UserResponseDto[]; total: number }> {
    try {
      const [users, total] = await this.usersRepository.findAndCount({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      const userDtos = users.map(user => new UserResponseDto(user));
      
      return {
        users: userDtos,
        total,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar usuários');
    }
  }

  /**
   * Busca usuário por ID
   */
  async findOne(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id, isActive: true },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      return new UserResponseDto(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao buscar usuário');
    }
  }

  /**
   * Busca usuário por email (para auth)
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({
        where: { email, isActive: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar usuário por email');
    }
  }

  /**
   * Busca usuário por username (para auth)
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({
        where: { username, isActive: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar usuário por username');
    }
  }

  /**
   * Atualiza um usuário
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id, isActive: true },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Verificar se novo username já existe (se estiver sendo alterado)
      if (updateUserDto.username && updateUserDto.username !== user.username) {
        const existingUser = await this.usersRepository.findOne({
          where: { username: updateUserDto.username },
        });
        
        if (existingUser) {
          throw new ConflictException('Username já está em uso');
        }
      }

      // Verificar se novo email já existe (se estiver sendo alterado)
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.usersRepository.findOne({
          where: { email: updateUserDto.email },
        });
        
        if (existingUser) {
          throw new ConflictException('Email já está em uso');
        }
      }

      // Atualizar campos (exceto password)
      const { password, ...updateData } = updateUserDto;
      Object.assign(user, updateData);

      // Se tiver nova password, fazer hash manualmente
      if (password) {
        const saltRounds = 12;
        user.password = await bcrypt.hash(password, saltRounds);
      }
      
      const updatedUser = await this.usersRepository.save(user);
      return new UserResponseDto(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao atualizar usuário');
    }
  }

  /**
   * Remove um usuário (soft delete)
   */
  async remove(id: string): Promise<void> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id, isActive: true },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Soft delete - marca como inativo
      user.isActive = false;
      await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao remover usuário');
    }
  }

  /**
   * Atualiza último login
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id, isActive: true },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      user.lastLogin = new Date();
      await this.usersRepository.save(user);
    } catch (error) {
      // Não lançamos erro aqui para não quebrar o fluxo de login
      console.error('Erro ao atualizar último login:', error);
    }
  }

  /**
   * Marca email como verificado
   */
  async verifyEmail(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id, isActive: true },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      user.emailVerified = true;
      const updatedUser = await this.usersRepository.save(user);
      
      return new UserResponseDto(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao verificar email');
    }
  }

  /**
   * Busca estatísticas de usuários (para dashboard futuro)
   */
  async getStats(): Promise<{ totalUsers: number; activeUsers: number; verifiedUsers: number }> {
    try {
      const totalUsers = await this.usersRepository.count();
      const activeUsers = await this.usersRepository.count({ where: { isActive: true } });
      const verifiedUsers = await this.usersRepository.count({ where: { emailVerified: true } });

      return {
        totalUsers,
        activeUsers,
        verifiedUsers,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar estatísticas');
    }
  }
}