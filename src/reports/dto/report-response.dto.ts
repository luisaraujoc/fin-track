import { ReportType, ReportFormat, ReportStatus } from '../entities/report.entity';

export class ReportResponseDto {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  parameters?: any;
  data?: any;
  file_url?: string;
  generated_at?: Date;
  start_date: Date;
  end_date: Date;
  error_message?: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}