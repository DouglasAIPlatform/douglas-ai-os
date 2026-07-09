import type {
  DomainStatistics,
  Metric,
  StatisticsSummary,
  TrendResult,
  TrendDirection,
} from "./AnalyticsTypes";
import type { IStatisticsEngine } from "./interfaces/IStatisticsEngine";

function resolveDirection(delta: number): TrendDirection {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

export class Statistics implements IStatisticsEngine {
  summarize(values: number[]): StatisticsSummary {
    if (!values.length) {
      return { count: 0, sum: 0, average: 0, min: 0, max: 0 };
    }

    const sum = values.reduce((total, value) => total + value, 0);

    return {
      count: values.length,
      sum,
      average: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  compare(current: number, previous: number): TrendResult {
    const delta = current - previous;
    const percentChange =
      previous === 0 ? (current === 0 ? 0 : 100) : (delta / previous) * 100;

    return {
      direction: resolveDirection(delta),
      delta,
      percentChange: Math.round(percentChange * 10) / 10,
    };
  }

  aggregateByDomain(metrics: Metric[]): DomainStatistics[] {
    const grouped = new Map<string, Metric[]>();

    metrics.forEach((metric) => {
      const bucket = grouped.get(metric.domain) ?? [];
      bucket.push(metric);
      grouped.set(metric.domain, bucket);
    });

    return Array.from(grouped.entries()).map(([domain, domainMetrics]) => {
      const values = domainMetrics.map((metric) => metric.value);
      const summary = this.summarize(values);
      const previousValues = domainMetrics
        .map((metric) => metric.previousValue)
        .filter((value): value is number => value !== undefined);
      const previousAverage = previousValues.length
        ? this.summarize(previousValues).average
        : summary.average;

      return {
        domain,
        summary,
        trend: this.compare(summary.average, previousAverage),
      };
    });
  }
}
