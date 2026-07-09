import type { Report, ReportFilter } from "../AnalyticsTypes";

export interface IReportRepository {
  get(reportId: string): Report | undefined;
  list(filter?: ReportFilter): Report[];
  seed(reports: Report[]): void;
  clear(): void;
}
