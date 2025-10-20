import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ForecastsService } from './forecasts.service';
import { CreateForecastDto } from './dto/create-forecast.dto';
import { UpdateForecastDto } from './dto/update-forecast.dto';
import { ForecastResponseDto } from './dto/forecast-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('forecasts')
@UseGuards(JwtAuthGuard)
export class ForecastsController {
  constructor(private readonly forecastsService: ForecastsService) {}

  @Post()
  create(
    @Body() createForecastDto: CreateForecastDto,
    @Request() req,
  ): Promise<ForecastResponseDto> {
    return this.forecastsService.create(createForecastDto, req.user.id);
  }

  @Get()
  findAll(@Request() req): Promise<ForecastResponseDto[]> {
    return this.forecastsService.findAll(req.user.id);
  }

  @Get('active')
  findActive(@Request() req): Promise<ForecastResponseDto[]> {
    return this.forecastsService.findActive(req.user.id);
  }

  @Get('period')
  findByPeriod(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<ForecastResponseDto[]> {
    return this.forecastsService.findByPeriod(
      req.user.id, 
      new Date(startDate), 
      new Date(endDate)
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req): Promise<ForecastResponseDto> {
    return this.forecastsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateForecastDto: UpdateForecastDto,
    @Request() req,
  ): Promise<ForecastResponseDto> {
    return this.forecastsService.update(id, updateForecastDto, req.user.id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Request() req): Promise<ForecastResponseDto> {
    return this.forecastsService.complete(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.forecastsService.remove(id, req.user.id);
  }
}