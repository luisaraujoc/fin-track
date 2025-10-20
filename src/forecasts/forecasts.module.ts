import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForecastsService } from './forecasts.service';
import { ForecastsController } from './forecasts.controller';
import { Forecast } from './entities/forecast.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Forecast])],
  controllers: [ForecastsController],
  providers: [ForecastsService],
  exports: [ForecastsService],
})
export class ForecastsModule {}