import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ReportType, ReportFormat } from '../entities/report.entity';

export class CreateReportDto {
  @IsString()
  name: string;

  @IsEnum(ReportType)
  type: ReportType;

  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @IsOptional()
  @IsObject()
  parameters?: any;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}