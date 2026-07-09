import type {
  DomainStatistics,
  Metric,
  StatisticsSummary,
  TrendResult,
} from "../AnalyticsTypes";

export interface IStatisticsEngine {
  summarize(values: number[]): StatisticsSummary;
  compare(current: number, previous: number): TrendResult;
  aggregateByDomain(metrics: Metric[]): DomainStatistics[];
}
