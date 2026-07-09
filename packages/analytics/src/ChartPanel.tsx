"use client";

import type { ChartSeries } from "./AnalyticsTypes";
import { ANALYTICS_DOMAIN_LABELS, CHART_TYPE_LABELS } from "./AnalyticsTypes";
import { getChartMaxValue } from "./Charts";

interface ChartPanelProps {
  series: ChartSeries;
}

export function ChartPanel({ series }: ChartPanelProps) {
  const maxValue = getChartMaxValue(series) || 1;

  return (
    <article className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
      <div className="flex flex-col gap-[var(--ds-space-1)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
            {series.title}
          </p>
          <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            {ANALYTICS_DOMAIN_LABELS[series.domain] ?? series.domain} ·{" "}
            {CHART_TYPE_LABELS[series.chartType]}
          </p>
        </div>
      </div>

      <div className="mt-[var(--ds-space-4)] space-y-[var(--ds-space-2)]">
        {series.points.map((point) => (
          <div key={point.label} className="space-y-[var(--ds-space-1)]">
            <div className="flex items-center justify-between text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              <span>{point.label}</span>
              <span>{point.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--ds-color-surface)]">
              <div
                className="h-full rounded-full bg-[var(--ds-color-border-strong)]"
                style={{ width: `${(point.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
