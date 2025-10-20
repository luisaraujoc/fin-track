import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Forecast, ForecastStatus } from './entities/forecast.entity';
import { CreateForecastDto } from './dto/create-forecast.dto';
import { UpdateForecastDto } from './dto/update-forecast.dto';
import { ForecastResponseDto } from './dto/forecast-response.dto';

@Injectable()
export class ForecastsService {
  constructor(
    @InjectRepository(Forecast)
    private readonly forecastRepository: Repository<Forecast>,
  ) {}

  async create(createForecastDto: CreateForecastDto, userId: string): Promise<ForecastResponseDto> {
    const forecast = this.forecastRepository.create({
      ...createForecastDto,
      user_id: userId,
    });

    const savedForecast = await this.forecastRepository.save(forecast);
    return this.toResponseDto(savedForecast);
  }

  async findAll(userId: string): Promise<ForecastResponseDto[]> {
    const forecasts = await this.forecastRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    return forecasts.map(forecast => this.toResponseDto(forecast));
  }

  async findActive(userId: string): Promise<ForecastResponseDto[]> {
    const forecasts = await this.forecastRepository.find({
      where: { 
        user_id: userId,
        status: ForecastStatus.ACTIVE
      },
      order: { created_at: 'DESC' },
    });

    return forecasts.map(forecast => this.toResponseDto(forecast));
  }

  async findByPeriod(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ForecastResponseDto[]> {
    const forecasts = await this.forecastRepository.find({
      where: {
        user_id: userId,
        start_date: Between(startDate, endDate),
        status: ForecastStatus.ACTIVE
      },
      order: { start_date: 'ASC' },
    });

    return forecasts.map(forecast => this.toResponseDto(forecast));
  }

  async findOne(id: string, userId: string): Promise<ForecastResponseDto> {
    const forecast = await this.forecastRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!forecast) {
      throw new NotFoundException('Forecast not found');
    }

    return this.toResponseDto(forecast);
  }

  async update(
    id: string,
    updateForecastDto: UpdateForecastDto,
    userId: string,
  ): Promise<ForecastResponseDto> {
    const forecast = await this.forecastRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!forecast) {
      throw new NotFoundException('Forecast not found');
    }

    const updatedForecast = await this.forecastRepository.save({
      ...forecast,
      ...updateForecastDto,
    });

    return this.toResponseDto(updatedForecast);
  }

  async remove(id: string, userId: string): Promise<void> {
    const forecast = await this.forecastRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!forecast) {
      throw new NotFoundException('Forecast not found');
    }

    await this.forecastRepository.remove(forecast);
  }

  async complete(id: string, userId: string): Promise<ForecastResponseDto> {
    const forecast = await this.forecastRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!forecast) {
      throw new NotFoundException('Forecast not found');
    }

    forecast.status = ForecastStatus.COMPLETED;
    const updatedForecast = await this.forecastRepository.save(forecast);

    return this.toResponseDto(updatedForecast);
  }

  private toResponseDto(forecast: Forecast): ForecastResponseDto {
    return {
      id: forecast.id,
      name: forecast.name,
      description: forecast.description,
      type: forecast.type,
      period: forecast.period,
      status: forecast.status,
      amount: forecast.amount,
      start_date: forecast.start_date,
      end_date: forecast.end_date,
      category: forecast.category,
      metadata: forecast.metadata,
      user_id: forecast.user_id,
      created_at: forecast.created_at,
      updated_at: forecast.updated_at,
    };
  }
}