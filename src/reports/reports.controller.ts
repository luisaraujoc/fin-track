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
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportResponseDto } from './dto/report-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(
    @Body() createReportDto: CreateReportDto,
    @Request() req,
  ): Promise<ReportResponseDto> {
    return this.reportsService.create(createReportDto, req.user.id);
  }

  @Get()
  findAll(@Request() req): Promise<ReportResponseDto[]> {
    return this.reportsService.findAll(req.user.id);
  }

  @Get('type/:type')
  findByType(
    @Param('type') type: string,
    @Request() req,
  ): Promise<ReportResponseDto[]> {
    return this.reportsService.findByType(req.user.id, type);
  }

  @Get('period')
  findByPeriod(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<ReportResponseDto[]> {
    return this.reportsService.findByPeriod(
      req.user.id, 
      new Date(startDate), 
      new Date(endDate)
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req): Promise<ReportResponseDto> {
    return this.reportsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
    @Request() req,
  ): Promise<ReportResponseDto> {
    return this.reportsService.update(id, updateReportDto, req.user.id);
  }

  @Post(':id/regenerate')
  regenerate(@Param('id') id: string, @Request() req): Promise<ReportResponseDto> {
    return this.reportsService.regenerate(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.reportsService.remove(id, req.user.id);
  }
}