export type AnalyticsDomain =
  | "calma"
  | "youtube"
  | "crm"
  | "marketing"
  | "financeiro"
  | "usuarios"
  | "infraestrutura"
  | (string & {});

export type MetricValueFormat =
  | "number"
  | "percentage"
  | "currency"
  | "duration"
  | "count";

export type MetricPeriod = "hour" | "day" | "week" | "month" | "quarter" | "year";

export type TrendDirection = "up" | "down" | "flat";

export type ChartType = "line" | "bar" | "area" | "pie" | "donut";

export type ReportStatus = "draft" | "ready" | "archived";

export interface MetricMetadata {
  sourceId?: string;
  correlationId?: string;
  tags?: string[];
  [key: string]: string | number | boolean | string[] | null | undefined;
}

export interface Metric {
  id: string;
  key: string;
  label: string;
  domain: AnalyticsDomain;
  value: number;
  format: MetricValueFormat;
  period: MetricPeriod;
  recordedAt: string;
  previousValue?: number;
  metadata: MetricMetadata;
}

export interface MetricInput {
  key: string;
  label: string;
  domain: AnalyticsDomain;
  value: number;
  format?: MetricValueFormat;
  period?: MetricPeriod;
  previousValue?: number;
  metadata?: MetricMetadata;
}

export interface MetricFilter {
  domain?: AnalyticsDomain;
  key?: string;
  period?: MetricPeriod;
  format?: MetricValueFormat;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  id: string;
  title: string;
  domain: AnalyticsDomain;
  chartType: ChartType;
  period: MetricPeriod;
  points: ChartDataPoint[];
  updatedAt: string;
}

export interface ChartFilter {
  domain?: AnalyticsDomain;
  chartType?: ChartType;
  period?: MetricPeriod;
}

export interface ReportSection {
  id: string;
  title: string;
  summary: string;
  metricKeys: string[];
}

export interface Report {
  id: string;
  title: string;
  domain: AnalyticsDomain;
  status: ReportStatus;
  period: MetricPeriod;
  sections: ReportSection[];
  generatedAt: string;
}

export interface ReportFilter {
  domain?: AnalyticsDomain;
  status?: ReportStatus;
  period?: MetricPeriod;
}

export interface StatisticsSummary {
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
}

export interface TrendResult {
  direction: TrendDirection;
  delta: number;
  percentChange: number;
}

export interface DomainStatistics {
  domain: AnalyticsDomain;
  summary: StatisticsSummary;
  trend: TrendResult;
}

export const ANALYTICS_DOMAIN_LABELS: Record<string, string> = {
  calma: "Calma",
  youtube: "YouTube",
  crm: "CRM",
  marketing: "Marketing",
  financeiro: "Financeiro",
  usuarios: "Usuários",
  infraestrutura: "Infraestrutura",
};

export const METRIC_FORMAT_LABELS: Record<MetricValueFormat, string> = {
  number: "Número",
  percentage: "Percentual",
  currency: "Moeda",
  duration: "Duração",
  count: "Contagem",
};

export const METRIC_PERIOD_LABELS: Record<MetricPeriod, string> = {
  hour: "Hora",
  day: "Dia",
  week: "Semana",
  month: "Mês",
  quarter: "Trimestre",
  year: "Ano",
};

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  line: "Linha",
  bar: "Barras",
  area: "Área",
  pie: "Pizza",
  donut: "Rosca",
};
