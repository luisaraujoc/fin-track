// src/auth/oauth.controller.ts
import { Controller, Get, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators';

@ApiTags('auth')
@Controller('auth/oauth')
export class OAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Iniciar autenticação com Google' })
  @ApiResponse({ status: 302, description: 'Redireciona para Google OAuth' })
  async googleAuth() {
    // Inicia o fluxo OAuth - o guard redireciona automaticamente
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback do Google OAuth' })
  @ApiResponse({ status: 302, description: 'Redireciona com token' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.authService.login(req.user);

      // Redireciona para frontend com token
      const redirectUrl = `${process.env.FRONTEND_URL}/oauth/callback?token=${result.access_token}&user=${encodeURIComponent(JSON.stringify(result.user))}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      const redirectUrl = `${process.env.FRONTEND_URL}/oauth/error?message=${encodeURIComponent('Falha na autenticação')}`;
      return res.redirect(redirectUrl);
    }
  }

  @Get('google/mobile')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback do Google OAuth para mobile' })
  @ApiResponse({ status: 200, description: 'Retorna token JSON para apps mobile' })
  async googleAuthMobile(@Req() req: Request) {
    return this.authService.login(req.user);
  }
}