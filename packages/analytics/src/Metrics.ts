import type {
  AnalyticsDomain,
  Metric,
  MetricFilter,
  MetricInput,
} from "./AnalyticsTypes";
import type { IMetricsRepository } from "./interfaces/IMetricsRepository";

export class Metrics {
  constructor(private readonly repository: IMetricsRepository) {}

  record(input: MetricInput): Metric {
    return this.repository.record(input);
  }

  get(id: string): Metric | undefined {
    return this.repository.get(id);
  }

  list(filter?: MetricFilter): Metric[] {
    return this.repository.list(filter);
  }

  byDomain(domain: AnalyticsDomain): Metric[] {
    return this.repository.list({ domain });
  }

  byKey(key: string): Metric[] {
    return this.repository.list({ key });
  }

  latestByKey(key: string, domain?: AnalyticsDomain): Metric | undefined {
    const items = this.repository.list({ key, domain });
    return items[0];
  }

  seed(metrics: Metric[]): void {
    this.repository.seed(metrics);
  }

  count(filter?: MetricFilter): number {
    return this.repository.list(filter).length;
  }

  clear(): void {
    this.repository.clear();
  }

  getRepository(): IMetricsRepository {
    return this.repository;
  }
}
