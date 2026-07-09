"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { AnalyticsContext } from "./AnalyticsContext";
import type { AnalyticsServices } from "./AnalyticsContext";
import { Charts, InMemoryChartDataProvider } from "./Charts";
import { DashboardMetrics } from "./DashboardMetrics";
import { InMemoryMetricsRepository } from "./InMemoryMetricsRepository";
import { KPIBuilder } from "./KPI";
import { Metrics } from "./Metrics";
import { InMemoryReportRepository, Reports } from "./Reports";
import { Statistics } from "./Statistics";
import type {
  AnalyticsDomain,
  ChartSeries,
  Metric,
  MetricInput,
  Report,
} from "./AnalyticsTypes";
import type { IChartDataProvider } from "./interfaces/IChartDataProvider";
import type { IMetricsRepository } from "./interfaces/IMetricsRepository";
import type { IReportRepository } from "./interfaces/IReportRepository";
import type { IStatisticsEngine } from "./interfaces/IStatisticsEngine";

export interface AnalyticsProviderProps {
  children: ReactNode;
  seedMetrics?: Metric[];
  seedCharts?: ChartSeries[];
  seedReports?: Report[];
  metricsRepository?: IMetricsRepository;
  chartProvider?: IChartDataProvider;
  reportRepository?: IReportRepository;
  statisticsEngine?: IStatisticsEngine;
}

function createServices(
  metricsRepository: IMetricsRepository,
  chartProvider: IChartDataProvider,
  reportRepository: IReportRepository,
  statisticsEngine: IStatisticsEngine,
): AnalyticsServices {
  const metrics = new Metrics(metricsRepository);
  const charts = new Charts(chartProvider);
  const reports = new Reports(reportRepository);
  const statistics = statisticsEngine ?? new Statistics();
  const kpiBuilder = new KPIBuilder(statistics);
  const dashboardMetrics = new DashboardMetrics(
    metrics,
    charts,
    reports,
    statistics,
    kpiBuilder,
  );

  return {
    metrics,
    charts,
    reports,
    statistics,
    kpiBuilder,
    dashboardMetrics,
  };
}

export function AnalyticsProvider({
  children,
  seedMetrics = [],
  seedCharts = [],
  seedReports = [],
  metricsRepository,
  chartProvider,
  reportRepository,
  statisticsEngine,
}: AnalyticsProviderProps) {
  const [version, setVersion] = useState(0);

  const services = useMemo(() => {
    const repository = metricsRepository ?? new InMemoryMetricsRepository();
    const charts = chartProvider ?? new InMemoryChartDataProvider();
    const reports = reportRepository ?? new InMemoryReportRepository();
    const statistics = statisticsEngine ?? new Statistics();

    const nextServices = createServices(repository, charts, reports, statistics);

    if (seedMetrics.length) nextServices.metrics.seed(seedMetrics);
    if (seedCharts.length) nextServices.charts.seed(seedCharts);
    if (seedReports.length) nextServices.reports.seed(seedReports);

    return nextServices;
  }, [
    chartProvider,
    metricsRepository,
    reportRepository,
    seedCharts,
    seedMetrics,
    seedReports,
    statisticsEngine,
  ]);

  const refresh = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  const domainStatistics = useMemo(
    () => services.statistics.aggregateByDomain(services.metrics.list()),
    [services, version],
  );

  const recordMetric = useCallback(
    (input: MetricInput) => {
      const metric = services.metrics.record(input);
      refresh();
      return metric;
    },
    [refresh, services.metrics],
  );

  const listKPIs = useCallback(
    (domain?: AnalyticsDomain) =>
      services.kpiBuilder.fromMetrics(services.metrics.list(), { domain }),
    [services.kpiBuilder, services.metrics],
  );

  const getDashboard = useCallback(
    (domain?: AnalyticsDomain) => services.dashboardMetrics.build({ domain }),
    [services.dashboardMetrics],
  );

  const listCharts = useCallback(
    (domain?: AnalyticsDomain) =>
      domain ? services.charts.byDomain(domain) : services.charts.listSeries(),
    [services.charts],
  );

  const listReports = useCallback(
    (domain?: AnalyticsDomain) =>
      domain ? services.reports.byDomain(domain) : services.reports.list(),
    [services.reports],
  );

  const value = useMemo(
    () => ({
      ...services,
      domainStatistics,
      recordMetric,
      listKPIs,
      getDashboard,
      listCharts,
      listReports,
    }),
    [
      domainStatistics,
      getDashboard,
      listCharts,
      listKPIs,
      listReports,
      recordMetric,
      services,
    ],
  );

  return (
    <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
  );
}
