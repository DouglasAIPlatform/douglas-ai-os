import type { Metric, MetricFilter, MetricInput } from "../AnalyticsTypes";

export interface IMetricsRepository {
  record(input: MetricInput): Metric;
  get(id: string): Metric | undefined;
  list(filter?: MetricFilter): Metric[];
  seed(metrics: Metric[]): void;
  clear(): void;
}
