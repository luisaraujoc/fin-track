// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('FinTrack API')
    .setDescription('Sistema de gestão financeira pessoal - FinTrack API')
    .setVersion('1.0')
    .addTag('users', 'Operações relacionadas a usuários')
    .addTag('auth', 'Operações de autenticação')
    .addTag('transactions', 'Gestão de transações financeiras')
    .addTag('categories', 'Gestão de categorias')
    .addBearerAuth() // Para JWT (futuro)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'FinTrack API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .topbar { background-color: #1e40af; }
      .swagger-ui .info h2 { color: #1e40af; }
    `,
  });
  
  const port = process.env.PORT ?? 8082;
  await app.listen(port);
  
  console.log(`🎉 API funcionando em: http://localhost:${port}`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api`);
  console.log(`👤 Users API: http://localhost:${port}/users`);
}
bootstrap();