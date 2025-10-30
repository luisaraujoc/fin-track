// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthProvider } from '../common/enums';

interface OAuthUserData {
  provider: AuthProvider.GOOGLE;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
}

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

    if (!user) {
      return null;
    }

    // Verificar se é usuário local
    if (user.authProvider !== AuthProvider.LOCAL) {
      throw new BadRequestException(
        `Este usuário foi criado via ${user.authProvider}. Use o login social.`,
      );
    }

    if (await user.validatePassword(password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateOAuthUser(oauthData: OAuthUserData): Promise<any> {
    try {
      // Tenta encontrar usuário pelo providerId
      let user = await this.usersService.findByProviderId(
        oauthData.provider,
        oauthData.providerId,
      );

      if (!user) {
        // Se não encontrou, tenta pelo email
        user = await this.usersService.findByEmail(oauthData.email);

        if (user) {
          // Se usuário existe mas com provedor diferente, atualizar
          user = await this.usersService.linkOAuthProvider(user.id, oauthData);
        } else {
          // Criar novo usuário OAuth
          user = await this.usersService.createFromOAuth(oauthData);
        }
      }

      const { password, ...result } = user;
      return result;
    } catch (error) {
      throw new UnauthorizedException('Erro na autenticação OAuth');
    }
  }

  async login(user: any) {
    const payload = {
      username: user.username,
      email: user.email,
      sub: user.id,
      authProvider: user.authProvider,
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
      const user = await this.usersService.create({
        ...registerDto,
        authProvider: AuthProvider.LOCAL, // Definir como local por padrão
      });

      // Gerar token JWT
      const payload = {
        username: user.username,
        email: user.email,
        sub: user.id,
        authProvider: user.authProvider,
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