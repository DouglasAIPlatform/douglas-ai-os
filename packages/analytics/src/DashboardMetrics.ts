import type { AnalyticsDomain, ChartSeries, DomainStatistics } from "./AnalyticsTypes";
import type { KPI, KPIBuilder } from "./KPI";
import type { Charts } from "./Charts";
import type { Metrics } from "./Metrics";
import type { Reports } from "./Reports";
import type { IStatisticsEngine } from "./interfaces/IStatisticsEngine";

export interface DashboardSection {
  domain: AnalyticsDomain;
  kpis: KPI[];
  charts: ChartSeries[];
  statistics: DomainStatistics | undefined;
  reportCount: number;
}

export interface DashboardMetricsOptions {
  domain?: AnalyticsDomain;
}

export class DashboardMetrics {
  constructor(
    private readonly metrics: Metrics,
    private readonly charts: Charts,
    private readonly reports: Reports,
    private readonly statistics: IStatisticsEngine,
    private readonly kpiBuilder: KPIBuilder,
  ) {}

  build(options: DashboardMetricsOptions = {}): DashboardSection[] {
    const { domain } = options;
    const metricItems = domain ? this.metrics.byDomain(domain) : this.metrics.list();
    const chartItems = domain ? this.charts.byDomain(domain) : this.charts.listSeries();
    const reportItems = domain ? this.reports.byDomain(domain) : this.reports.list();
    const domainStats = this.statistics.aggregateByDomain(metricItems);

    const domains = domain
      ? [domain]
      : Array.from(
          new Set([
            ...metricItems.map((item) => item.domain),
            ...chartItems.map((item) => item.domain),
            ...reportItems.map((item) => item.domain),
          ]),
        );

    return domains.map((sectionDomain) => ({
      domain: sectionDomain,
      kpis: this.kpiBuilder.fromMetrics(metricItems, { domain: sectionDomain }),
      charts: chartItems.filter((item) => item.domain === sectionDomain),
      statistics: domainStats.find((item) => item.domain === sectionDomain),
      reportCount: reportItems.filter((item) => item.domain === sectionDomain).length,
    }));
  }

  buildForDomain(domain: AnalyticsDomain): DashboardSection | undefined {
    return this.build({ domain })[0];
  }
}
