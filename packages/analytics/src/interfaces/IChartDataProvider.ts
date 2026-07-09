import type { ChartFilter, ChartSeries } from "../AnalyticsTypes";

export interface IChartDataProvider {
  getSeries(chartId: string): ChartSeries | undefined;
  listSeries(filter?: ChartFilter): ChartSeries[];
  seed(series: ChartSeries[]): void;
  clear(): void;
}
