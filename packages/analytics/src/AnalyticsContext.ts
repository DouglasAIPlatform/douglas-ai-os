import { createContext } from "react";
import type { DashboardMetrics } from "./DashboardMetrics";
import type { Charts } from "./Charts";
import type { KPIBuilder } from "./KPI";
import type { Metrics } from "./Metrics";
import type { Reports } from "./Reports";
import type { IStatisticsEngine } from "./interfaces/IStatisticsEngine";
import type {
  AnalyticsDomain,
  ChartSeries,
  DomainStatistics,
  Metric,
  MetricInput,
  Report,
} from "./AnalyticsTypes";
import type { DashboardSection } from "./DashboardMetrics";
import type { KPI } from "./KPI";

export interface AnalyticsServices {
  metrics: Metrics;
  charts: Charts;
  reports: Reports;
  statistics: IStatisticsEngine;
  kpiBuilder: KPIBuilder;
  dashboardMetrics: DashboardMetrics;
}

export interface AnalyticsContextValue extends AnalyticsServices {
  domainStatistics: DomainStatistics[];
  recordMetric: (input: MetricInput) => Metric;
  listKPIs: (domain?: AnalyticsDomain) => KPI[];
  getDashboard: (domain?: AnalyticsDomain) => DashboardSection[];
  listCharts: (domain?: AnalyticsDomain) => ChartSeries[];
  listReports: (domain?: AnalyticsDomain) => Report[];
}

export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);
