import type { Report, ReportFilter } from "./AnalyticsTypes";
import type { IReportRepository } from "./interfaces/IReportRepository";

function matchesFilter(report: Report, filter: ReportFilter = {}): boolean {
  if (filter.domain && report.domain !== filter.domain) return false;
  if (filter.status && report.status !== filter.status) return false;
  if (filter.period && report.period !== filter.period) return false;
  return true;
}

export class InMemoryReportRepository implements IReportRepository {
  private reports = new Map<string, Report>();

  get(reportId: string): Report | undefined {
    return this.reports.get(reportId);
  }

  list(filter?: ReportFilter): Report[] {
    return Array.from(this.reports.values())
      .filter((report) => matchesFilter(report, filter))
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  }

  seed(reports: Report[]): void {
    reports.forEach((report) => {
      this.reports.set(report.id, report);
    });
  }

  clear(): void {
    this.reports.clear();
  }
}

export class Reports {
  constructor(private readonly repository: IReportRepository) {}

  get(reportId: string): Report | undefined {
    return this.repository.get(reportId);
  }

  list(filter?: ReportFilter): Report[] {
    return this.repository.list(filter);
  }

  byDomain(domain: Report["domain"]): Report[] {
    return this.repository.list({ domain });
  }

  ready(): Report[] {
    return this.repository.list({ status: "ready" });
  }

  seed(items: Report[]): void {
    this.repository.seed(items);
  }

  getRepository(): IReportRepository {
    return this.repository;
  }
}
