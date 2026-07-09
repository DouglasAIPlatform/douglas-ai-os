import type { Metric, MetricFilter, MetricInput } from "./AnalyticsTypes";
import type { IMetricsRepository } from "./interfaces/IMetricsRepository";

function matchesFilter(metric: Metric, filter: MetricFilter = {}): boolean {
  if (filter.domain && metric.domain !== filter.domain) return false;
  if (filter.key && metric.key !== filter.key) return false;
  if (filter.period && metric.period !== filter.period) return false;
  if (filter.format && metric.format !== filter.format) return false;
  return true;
}

export class InMemoryMetricsRepository implements IMetricsRepository {
  private metrics = new Map<string, Metric>();

  record(input: MetricInput): Metric {
    const metric: Metric = {
      id: `metric:${Date.now()}:${this.metrics.size}`,
      key: input.key,
      label: input.label,
      domain: input.domain,
      value: input.value,
      format: input.format ?? "number",
      period: input.period ?? "day",
      recordedAt: new Date().toISOString(),
      previousValue: input.previousValue,
      metadata: input.metadata ?? {},
    };

    this.metrics.set(metric.id, metric);
    return metric;
  }

  get(id: string): Metric | undefined {
    return this.metrics.get(id);
  }

  list(filter?: MetricFilter): Metric[] {
    return Array.from(this.metrics.values())
      .filter((metric) => matchesFilter(metric, filter))
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  }

  seed(metrics: Metric[]): void {
    metrics.forEach((metric) => {
      this.metrics.set(metric.id, metric);
    });
  }

  clear(): void {
    this.metrics.clear();
  }
}
