import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportResponseDto } from './dto/report-response.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async create(createReportDto: CreateReportDto, userId: string): Promise<ReportResponseDto> {
    const report = this.reportRepository.create({
      ...createReportDto,
      user_id: userId,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.reportRepository.save(report);
    
    // Simulate report generation (in a real app, this would be a background job)
    await this.generateReportData(savedReport.id, userId);
    
    return this.toResponseDto(savedReport);
  }

  async findAll(userId: string): Promise<ReportResponseDto[]> {
    const reports = await this.reportRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    return reports.map(report => this.toResponseDto(report));
  }

  async findByType(userId: string, type: string): Promise<ReportResponseDto[]> {
    const reports = await this.reportRepository.find({
      where: { 
        user_id: userId,
        type: type as any
      },
      order: { created_at: 'DESC' },
    });

    return reports.map(report => this.toResponseDto(report));
  }

  async findByPeriod(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ReportResponseDto[]> {
    const reports = await this.reportRepository.find({
      where: {
        user_id: userId,
        start_date: Between(startDate, endDate),
      },
      order: { start_date: 'ASC' },
    });

    return reports.map(report => this.toResponseDto(report));
  }

  async findOne(id: string, userId: string): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.toResponseDto(report);
  }

  async update(
    id: string,
    updateReportDto: UpdateReportDto,
    userId: string,
  ): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updatedReport = await this.reportRepository.save({
      ...report,
      ...updateReportDto,
    });

    return this.toResponseDto(updatedReport);
  }

  async remove(id: string, userId: string): Promise<void> {
    const report = await this.reportRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.reportRepository.remove(report);
  }

  async regenerate(id: string, userId: string): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = ReportStatus.PENDING;
    report.generated_at = null;
    report.data = null;
    report.file_url = null;
    report.error_message = null;

    const updatedReport = await this.reportRepository.save(report);
    
    // Regenerate report data
    await this.generateReportData(id, userId);
    
    return this.toResponseDto(updatedReport);
  }

  private async generateReportData(reportId: string, userId: string): Promise<void> {
    // Simulate report generation delay
    setTimeout(async () => {
      try {
        const report = await this.reportRepository.findOne({
          where: { id: reportId, user_id: userId },
        });

        if (!report) return;

        // Simulate report data generation
        const mockData = {
          summary: {
            total_income: 5000,
            total_expenses: 3500,
            net_flow: 1500,
            period: `${report.start_date} to ${report.end_date}`
          },
          categories: [
            { name: 'Food', amount: 800, percentage: 22.8 },
            { name: 'Transport', amount: 400, percentage: 11.4 },
            { name: 'Entertainment', amount: 300, percentage: 8.6 },
            { name: 'Other', amount: 2000, percentage: 57.2 }
          ]
        };

        report.data = mockData;
        report.status = ReportStatus.COMPLETED;
        report.generated_at = new Date();

        await this.reportRepository.save(report);
      } catch (error) {
        const report = await this.reportRepository.findOne({
          where: { id: reportId, user_id: userId },
        });

        if (report) {
          report.status = ReportStatus.FAILED;
          report.error_message = error.message;
          await this.reportRepository.save(report);
        }
      }
    }, 2000);
  }

  private toResponseDto(report: Report): ReportResponseDto {
    return {
      id: report.id,
      name: report.name,
      type: report.type,
      format: report.format,
      status: report.status,
      parameters: report.parameters,
      data: report.data,
      file_url: report.file_url,
      generated_at: report.generated_at,
      start_date: report.start_date,
      end_date: report.end_date,
      error_message: report.error_message,
      user_id: report.user_id,
      created_at: report.created_at,
      updated_at: report.updated_at,
    };
  }
}