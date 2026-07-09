import type {
  AnalyticsDomain,
  Metric,
  MetricPeriod,
  MetricValueFormat,
  TrendDirection,
} from "./AnalyticsTypes";
import type { IStatisticsEngine } from "./interfaces/IStatisticsEngine";

export interface KPI {
  id: string;
  key: string;
  label: string;
  domain: AnalyticsDomain;
  value: number;
  format: MetricValueFormat;
  period: MetricPeriod;
  trend: TrendDirection;
  trendPercent: number;
  previousValue?: number;
  recordedAt: string;
}

export interface KPIFilter {
  domain?: AnalyticsDomain;
  period?: MetricPeriod;
}

export function formatKPIValue(value: number, format: MetricValueFormat): string {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "duration":
      return `${value} min`;
    case "count":
      return new Intl.NumberFormat("pt-BR").format(value);
    default:
      return new Intl.NumberFormat("pt-BR").format(value);
  }
}

export class KPIBuilder {
  constructor(private readonly statistics: IStatisticsEngine) {}

  fromMetric(metric: Metric): KPI {
    const trend = this.statistics.compare(
      metric.value,
      metric.previousValue ?? metric.value,
    );

    return {
      id: `kpi:${metric.id}`,
      key: metric.key,
      label: metric.label,
      domain: metric.domain,
      value: metric.value,
      format: metric.format,
      period: metric.period,
      trend: trend.direction,
      trendPercent: trend.percentChange,
      previousValue: metric.previousValue,
      recordedAt: metric.recordedAt,
    };
  }

  fromMetrics(metrics: Metric[], filter?: KPIFilter): KPI[] {
    const latestByKey = new Map<string, Metric>();

    metrics.forEach((metric) => {
      if (filter?.domain && metric.domain !== filter.domain) return;
      if (filter?.period && metric.period !== filter.period) return;

      const compositeKey = `${metric.domain}:${metric.key}`;
      const existing = latestByKey.get(compositeKey);

      if (!existing || metric.recordedAt > existing.recordedAt) {
        latestByKey.set(compositeKey, metric);
      }
    });

    return Array.from(latestByKey.values()).map((metric) =>
      this.fromMetric(metric),
    );
  }

  formatDisplay(kpi: KPI): string {
    return formatKPIValue(kpi.value, kpi.format);
  }
}
