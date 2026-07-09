import type { ChartFilter, ChartSeries } from "./AnalyticsTypes";
import type { IChartDataProvider } from "./interfaces/IChartDataProvider";

function matchesFilter(series: ChartSeries, filter: ChartFilter = {}): boolean {
  if (filter.domain && series.domain !== filter.domain) return false;
  if (filter.chartType && series.chartType !== filter.chartType) return false;
  if (filter.period && series.period !== filter.period) return false;
  return true;
}

export class InMemoryChartDataProvider implements IChartDataProvider {
  private series = new Map<string, ChartSeries>();

  getSeries(chartId: string): ChartSeries | undefined {
    return this.series.get(chartId);
  }

  listSeries(filter?: ChartFilter): ChartSeries[] {
    return Array.from(this.series.values())
      .filter((item) => matchesFilter(item, filter))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  seed(items: ChartSeries[]): void {
    items.forEach((item) => {
      this.series.set(item.id, item);
    });
  }

  clear(): void {
    this.series.clear();
  }
}

export class Charts {
  constructor(private readonly provider: IChartDataProvider) {}

  getSeries(chartId: string): ChartSeries | undefined {
    return this.provider.getSeries(chartId);
  }

  listSeries(filter?: ChartFilter): ChartSeries[] {
    return this.provider.listSeries(filter);
  }

  byDomain(domain: ChartSeries["domain"]): ChartSeries[] {
    return this.provider.listSeries({ domain });
  }

  seed(items: ChartSeries[]): void {
    this.provider.seed(items);
  }

  getProvider(): IChartDataProvider {
    return this.provider;
  }
}

export function getChartMaxValue(series: ChartSeries): number {
  if (!series.points.length) return 0;
  return Math.max(...series.points.map((point) => point.value));
}

export function getChartTotal(series: ChartSeries): number {
  return series.points.reduce((total, point) => total + point.value, 0);
}
