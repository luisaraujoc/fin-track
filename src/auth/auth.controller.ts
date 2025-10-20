// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { Public } from '../common/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login do usuário' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login realizado com sucesso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'joaosilva',
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao@email.com',
          currency: 'BRL',
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          isActive: true,
          emailVerified: false,
          lastLogin: '2025-01-19T14:30:00.000Z',
          createdAt: '2025-01-19T10:00:00.000Z',
          updatedAt: '2025-01-19T11:30:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Registro de novo usuário' })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuário criado e autenticado com sucesso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'joaosilva',
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao@email.com',
          currency: 'BRL',
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          isActive: true,
          emailVerified: false,
          lastLogin: null,
          createdAt: '2025-01-19T10:00:00.000Z',
          updatedAt: '2025-01-19T10:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 409, description: 'Username ou email já existe' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil retornado com sucesso', 
    type: UserResponseDto // ✅ Agora funciona
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh token (futura implementação)' })
  @ApiResponse({ status: 200, description: 'Token atualizado' })
  async refreshToken(@Request() req) {
    // Implementação futura para refresh tokens
    return this.authService.login(req.user);
  }
}