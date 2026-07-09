"use client";

import type { AnalyticsDomain } from "./AnalyticsTypes";
import { ANALYTICS_DOMAIN_LABELS } from "./AnalyticsTypes";
import { ChartPanel } from "./ChartPanel";
import { KPICard } from "./KPICard";
import { ReportPanel } from "./ReportPanel";
import { useAnalytics } from "./useAnalytics";

interface DashboardMetricsPanelProps {
  domainFilter?: AnalyticsDomain;
  emptyMessage?: string;
}

export function DashboardMetricsPanel({
  domainFilter,
  emptyMessage = "Nenhuma métrica disponível no dashboard.",
}: DashboardMetricsPanelProps) {
  const { getDashboard, listReports } = useAnalytics();
  const sections = getDashboard(domainFilter);

  if (!sections.length) {
    return (
      <div className="rounded-[var(--ds-radius-md)] border border-dashed border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
        <p className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-[var(--ds-space-6)]">
      <div>
        <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
          Analytics Engine
        </p>
        <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          Infraestrutura mockada — métricas centralizadas da Douglas AI.
        </p>
      </div>

      {sections.map((section) => {
        const reports = listReports(section.domain);

        return (
          <div key={section.domain} className="space-y-[var(--ds-space-4)]">
            <h3 className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
              {ANALYTICS_DOMAIN_LABELS[section.domain] ?? section.domain}
            </h3>

            {section.kpis.length ? (
              <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 xl:grid-cols-3">
                {section.kpis.map((kpi) => (
                  <KPICard key={kpi.id} kpi={kpi} />
                ))}
              </div>
            ) : null}

            {section.charts.length ? (
              <div className="grid gap-[var(--ds-space-3)] lg:grid-cols-2">
                {section.charts.map((chart) => (
                  <ChartPanel key={chart.id} series={chart} />
                ))}
              </div>
            ) : null}

            {reports.length ? (
              <div className="grid gap-[var(--ds-space-3)] lg:grid-cols-2">
                {reports.map((report) => (
                  <ReportPanel key={report.id} report={report} />
                ))}
              </div>
            ) : null}

            {section.statistics ? (
              <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
                <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] uppercase tracking-[var(--ds-letter-spacing-wide)] text-[var(--ds-color-text-muted)]">
                  Estatísticas agregadas
                </p>
                <div className="mt-[var(--ds-space-3)] grid gap-[var(--ds-space-2)] sm:grid-cols-2 lg:grid-cols-5">
                  <StatItem label="Contagem" value={section.statistics.summary.count} />
                  <StatItem label="Soma" value={section.statistics.summary.sum} />
                  <StatItem label="Média" value={section.statistics.summary.average} />
                  <StatItem label="Mín" value={section.statistics.summary.min} />
                  <StatItem label="Máx" value={section.statistics.summary.max} />
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
        {label}
      </p>
      <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </p>
    </div>
  );
}
