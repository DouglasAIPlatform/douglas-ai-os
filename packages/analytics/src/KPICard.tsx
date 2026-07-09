"use client";

import type { KPI } from "./KPI";
import { formatKPIValue } from "./KPI";

interface KPICardProps {
  kpi: KPI;
}

const TREND_LABELS = {
  up: "↑",
  down: "↓",
  flat: "→",
} as const;

export function KPICard({ kpi }: KPICardProps) {
  return (
    <article className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
      <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] uppercase tracking-[var(--ds-letter-spacing-wide)] text-[var(--ds-color-text-muted)]">
        {kpi.label}
      </p>
      <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-2xl)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
        {formatKPIValue(kpi.value, kpi.format)}
      </p>
      <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-subtle)]">
        {TREND_LABELS[kpi.trend]} {Math.abs(kpi.trendPercent).toFixed(1)}% vs período anterior
      </p>
    </article>
  );
}
