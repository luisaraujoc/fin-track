import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './common/decorators';
import { publishBehavior } from 'rxjs';

@Controller()
@ApiExcludeController()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private dataSource: DataSource,
  ) {}

  @Get()
  @Public()
  getHello(): string {
    return '✅ API funcionando!';
  }

  @Get('database-test')
  @Public()
  async testDatabase() {
    try {
      await this.dataSource.query('SELECT 1');
      return { 
        status: '✅ Database connected successfully!',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        status: '❌ Database connection failed!', 
        error: error.message 
      };
    }
  }
}