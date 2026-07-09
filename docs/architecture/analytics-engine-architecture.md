# Analytics Engine Architecture — Douglas AI Platform

> Status: Foundation v0.1  
> Sprint: 3.8  
> Escopo: motor de analytics em `packages/analytics/`.

## Objetivo

Centralizar métricas, KPIs, gráficos, relatórios e estatísticas da Douglas AI Platform com arquitetura **desacoplada via interfaces**.

Nesta sprint **não há integração** com Event Bus, Core, AppShell, APIs externas ou bancos de dados. A entrega é arquitetura pura preparada para sete domínios corporativos.

## Pacote

```
packages/analytics/src/
├── AnalyticsTypes.ts              # Domínios, métricas, charts, reports
├── interfaces/
│   ├── IMetricsRepository.ts      # Contrato de persistência de métricas
│   ├── IChartDataProvider.ts      # Contrato de séries temporais
│   ├── IReportRepository.ts       # Contrato de relatórios
│   └── IStatisticsEngine.ts       # Contrato de cálculos estatísticos
├── InMemoryMetricsRepository.ts   # Implementação mock
├── Metrics.ts                     # Facade sobre IMetricsRepository
├── KPI.ts                         # KPIBuilder + formatação
├── Statistics.ts                  # Implementação de IStatisticsEngine
├── Charts.ts                      # Facade + InMemoryChartDataProvider
├── Reports.ts                     # Facade + InMemoryReportRepository
├── DashboardMetrics.ts            # Agregação por domínio
├── AnalyticsContext.ts
├── AnalyticsProvider.tsx          # DI de interfaces
├── useAnalytics.ts
├── KPICard.tsx                    # UI de KPI
├── ChartPanel.tsx                 # UI de gráfico (barra mock)
├── ReportPanel.tsx                # UI de relatório
├── DashboardMetricsPanel.tsx      # Dashboard completo
└── index.ts
```

## Seeds (app)

```
apps/headquarters/features/analytics-engine/
├── seeds.ts    # 7 métricas, 3 charts, 3 reports
└── index.ts
```

Sem wiring no `AppShell` nesta sprint.

## Domínios preparados

| Domínio | Uso futuro |
|---------|------------|
| `calma` | Sessões, retenção, jornadas |
| `youtube` | Views, subscribers, engagement |
| `crm` | Leads, pipeline, conversão |
| `marketing` | Campanhas, ROI, funil |
| `financeiro` | Receita, custos, margem |
| `usuarios` | MAU, DAU, churn |
| `infraestrutura` | Uptime, latência, erros |

Cada domínio é membro de `AnalyticsDomain` com label via `ANALYTICS_DOMAIN_LABELS`.

## Arquitetura desacoplada

```
┌──────────────────────────────────────────────────────────────┐
│  UI: DashboardMetricsPanel → KPICard / ChartPanel / Report   │
├──────────────────────────────────────────────────────────────┤
│  React: AnalyticsProvider + useAnalytics()                   │
├──────────────────────────────────────────────────────────────┤
│  Orquestração: DashboardMetrics, KPIBuilder                  │
├──────────────────────────────────────────────────────────────┤
│  Facades: Metrics │ Charts │ Reports │ Statistics            │
├──────────────────────────────────────────────────────────────┤
│  Interfaces (contratos):                                     │
│    IMetricsRepository │ IChartDataProvider                   │
│    IReportRepository  │ IStatisticsEngine                    │
├──────────────────────────────────────────────────────────────┤
│  Implementações atuais: InMemory* (mock)                     │
│  Implementações futuras: Supabase, BigQuery, PostHog, etc.   │
└──────────────────────────────────────────────────────────────┘
```

### Princípio de inversão de dependência

O pacote `@douglas/analytics` **não importa** nenhum outro pacote `@douglas/*`. Módulos externos (Event Bus, Workflow, Core) publicarão métricas via `recordMetric()` ou implementações custom de `IMetricsRepository`.

### Injeção de dependência no Provider

```tsx
<AnalyticsProvider
  seedMetrics={analyticsMetricSeeds}
  seedCharts={analyticsChartSeeds}
  seedReports={analyticsReportSeeds}
  metricsRepository={customRepo}      // opcional
  chartProvider={customChartProvider} // opcional
  reportRepository={customReportRepo} // opcional
  statisticsEngine={customStats}      // opcional
>
  {children}
</AnalyticsProvider>
```

Defaults: implementações `InMemory*` para desenvolvimento e testes.

## Interfaces

### IMetricsRepository

```ts
interface IMetricsRepository {
  record(input: MetricInput): Metric;
  get(id: string): Metric | undefined;
  list(filter?: MetricFilter): Metric[];
  seed(metrics: Metric[]): void;
  clear(): void;
}
```

Responsável por **persistência e consulta** de métricas brutas.

### IChartDataProvider

```ts
interface IChartDataProvider {
  getSeries(chartId: string): ChartSeries | undefined;
  listSeries(filter?: ChartFilter): ChartSeries[];
  seed(series: ChartSeries[]): void;
  clear(): void;
}
```

Fornece **séries temporais** para visualização. Futuro: adapter para Recharts, Chart.js ou API de analytics.

### IReportRepository

```ts
interface IReportRepository {
  get(reportId: string): Report | undefined;
  list(filter?: ReportFilter): Report[];
  seed(reports: Report[]): void;
  clear(): void;
}
```

Gerencia **relatórios estruturados** com seções e referências a metric keys.

### IStatisticsEngine

```ts
interface IStatisticsEngine {
  summarize(values: number[]): StatisticsSummary;
  compare(current: number, previous: number): TrendResult;
  aggregateByDomain(metrics: Metric[]): DomainStatistics[];
}
```

Cálculos puros — substituível por engine estatística avançada ou serviço externo.

## Módulos core

### Metrics

Facade sobre `IMetricsRepository`:

- `record`, `get`, `list`, `byDomain`, `byKey`, `latestByKey`
- `count`, `seed`, `clear`

### KPI

Transforma `Metric` em `KPI` com trend:

```ts
interface KPI {
  id: string;
  key: string;
  label: string;
  domain: AnalyticsDomain;
  value: number;
  format: MetricValueFormat;
  period: MetricPeriod;
  trend: TrendDirection;      // up | down | flat
  trendPercent: number;
  previousValue?: number;
  recordedAt: string;
}
```

`KPIBuilder.fromMetrics()` deduplica por `domain:key` mantendo o registro mais recente.

### DashboardMetrics

Agrega KPIs, charts, reports e estatísticas por domínio:

```ts
interface DashboardSection {
  domain: AnalyticsDomain;
  kpis: KPI[];
  charts: ChartSeries[];
  statistics: DomainStatistics | undefined;
  reportCount: number;
}
```

### Charts

- `ChartSeries` com `points: ChartDataPoint[]`
- Tipos: `line`, `bar`, `area`, `pie`, `donut`
- `ChartPanel` renderiza barras horizontais mock (sem lib externa)

### Reports

- `Report` com `sections[]` referenciando `metricKeys`
- Status: `draft`, `ready`, `archived`
- `ReportPanel` exibe seções em cards

### Statistics

Implementação default de `IStatisticsEngine`:

- `summarize` — count, sum, average, min, max
- `compare` — delta e percentChange com direction
- `aggregateByDomain` — estatísticas agrupadas por domínio

## Modelo de dados

### Metric

```ts
interface Metric {
  id: string;
  key: string;
  label: string;
  domain: AnalyticsDomain;
  value: number;
  format: MetricValueFormat;  // number | percentage | currency | duration | count
  period: MetricPeriod;       // hour | day | week | month | quarter | year
  recordedAt: string;
  previousValue?: number;
  metadata: MetricMetadata;
}
```

### MetricValueFormat

| Formato | Exemplo |
|---------|---------|
| `number` | 1.234 |
| `percentage` | 18,4% |
| `currency` | R$ 284.500,00 |
| `duration` | 45 min |
| `count` | 3.420 |

## Escalabilidade

### 1. Interfaces substituíveis

Trocar `InMemoryMetricsRepository` por `SupabaseMetricsRepository` sem alterar `Metrics`, `DashboardMetrics` ou UI.

### 2. Domínios extensíveis

`AnalyticsDomain` usa union conhecida + `(string & {})`. Novos departamentos entram sem breaking change.

### 3. Adapters por fonte de dados

```
Calma App     → CalmaMetricsAdapter  → IMetricsRepository
YouTube API   → YouTubeMetricsAdapter → IMetricsRepository
Event Bus     → EventMetricsBridge   → recordMetric()
PostHog       → PostHogChartProvider  → IChartDataProvider
```

### 4. Separação de responsabilidades

| Camada | Responsabilidade |
|--------|------------------|
| Repository | Persistência |
| Facade (Metrics/Charts/Reports) | API de domínio |
| Statistics | Cálculos puros |
| DashboardMetrics | Composição |
| Provider | DI + estado reativo |
| UI | Apresentação |

### 5. Volume e performance

| Fase | Estratégia |
|------|------------|
| v0.1 (atual) | In-memory, seed estático |
| v0.2 | IndexedDB + cache local |
| v1.0 | TimescaleDB / Supabase + agregações materializadas |
| v2.0 | Data warehouse (BigQuery) + dashboards em tempo real |

### 6. Integração com Event Bus (Sprint 3.6)

Integração futura sem acoplamento:

```ts
subscribe("workflow:completed", (_, payload) => {
  recordMetric({
    key: "workflow_completions",
    label: "Workflows concluídos",
    domain: "infraestrutura",
    value: 1,
    format: "count",
    metadata: { correlationId: payload.executionId },
  });
});
```

### 7. Relação com Douglas Core (Sprint 3.5)

Core registra `analytics` como último módulo na DAG de bootstrap. O Analytics Engine consome eventos **depois** que todos os módulos estão prontos.

### 8. UI composável

- `KPICard` — tile isolado para dashboards
- `ChartPanel` — gráfico mock, substituível por lib real
- `ReportPanel` — bloco de relatório
- `DashboardMetricsPanel` — visão completa filtrável por domínio

## Integração futura (fora desta sprint)

1. `AnalyticsProvider` no `AppShell` após `EventProvider`
2. Subscribers no Corporate Event Bus mapeando topics → métricas
3. Rota `/analytics` consumindo `DashboardMetricsPanel`
4. Persistência Supabase (`metrics`, `chart_series`, `reports`)
5. Adapters por domínio (Calma, YouTube, CRM, etc.)
6. Export PDF/CSV de relatórios

## Uso arquitetural (referência)

```tsx
import {
  AnalyticsProvider,
  DashboardMetricsPanel,
} from "@douglas/analytics";
import {
  analyticsChartSeeds,
  analyticsMetricSeeds,
  analyticsReportSeeds,
} from "@/features/analytics-engine";

function AnalyticsPage() {
  return (
    <AnalyticsProvider
      seedMetrics={analyticsMetricSeeds}
      seedCharts={analyticsChartSeeds}
      seedReports={analyticsReportSeeds}
    >
      <DashboardMetricsPanel />
    </AnalyticsProvider>
  );
}
```

Não conectado ao app nesta sprint — apenas contrato documentado.

## Testabilidade

Interfaces permitem mocks isolados:

```ts
const mockRepo: IMetricsRepository = {
  record: vi.fn(),
  get: vi.fn(),
  list: vi.fn(() => []),
  seed: vi.fn(),
  clear: vi.fn(),
};

const metrics = new Metrics(mockRepo);
```

Cada facade pode ser testada independentemente da UI e do Provider.
