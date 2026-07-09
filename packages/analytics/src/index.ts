export type {
  AnalyticsDomain,
  ChartDataPoint,
  ChartFilter,
  ChartSeries,
  ChartType,
  DomainStatistics,
  Metric,
  MetricFilter,
  MetricInput,
  MetricMetadata,
  MetricPeriod,
  MetricValueFormat,
  Report,
  ReportFilter,
  ReportSection,
  ReportStatus,
  StatisticsSummary,
  TrendDirection,
  TrendResult,
} from "./AnalyticsTypes";

export {
  ANALYTICS_DOMAIN_LABELS,
  CHART_TYPE_LABELS,
  METRIC_FORMAT_LABELS,
  METRIC_PERIOD_LABELS,
} from "./AnalyticsTypes";

export type {
  IMetricsRepository,
  IChartDataProvider,
  IReportRepository,
  IStatisticsEngine,
} from "./interfaces";

export { InMemoryMetricsRepository } from "./InMemoryMetricsRepository";
export { Metrics } from "./Metrics";

export { KPIBuilder, formatKPIValue, type KPI, type KPIFilter } from "./KPI";

export { Statistics } from "./Statistics";

export {
  Charts,
  InMemoryChartDataProvider,
  getChartMaxValue,
  getChartTotal,
} from "./Charts";

export { Reports, InMemoryReportRepository } from "./Reports";

export {
  DashboardMetrics,
  type DashboardSection,
  type DashboardMetricsOptions,
} from "./DashboardMetrics";

export {
  AnalyticsContext,
  type AnalyticsContextValue,
  type AnalyticsServices,
} from "./AnalyticsContext";

export {
  AnalyticsProvider,
  type AnalyticsProviderProps,
} from "./AnalyticsProvider";

export { useAnalytics } from "./useAnalytics";
export { KPICard } from "./KPICard";
export { ChartPanel } from "./ChartPanel";
export { ReportPanel } from "./ReportPanel";
export { DashboardMetricsPanel } from "./DashboardMetricsPanel";
