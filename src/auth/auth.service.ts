// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(usernameOrEmail: string, password: string): Promise<any> {
    // Tenta encontrar por username ou email
    let user = await this.usersService.findByUsername(usernameOrEmail);
    if (!user) {
      user = await this.usersService.findByEmail(usernameOrEmail);
    }

    if (user && await user.validatePassword(password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      username: user.username,
      email: user.email,
      sub: user.id,
    };

    // Atualizar último login
    await this.usersService.updateLastLogin(user.id);

    return {
      access_token: this.jwtService.sign(payload),
      user: new UserResponseDto(user),
    };
  }

  async register(registerDto: RegisterDto) {
    try {
      // Criar usuário usando o UsersService
      const user = await this.usersService.create(registerDto);

      // Gerar token JWT
      const payload = {
        username: user.username,
        email: user.email,
        sub: user.id,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: user,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Erro ao criar usuário');
    }
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }
}
