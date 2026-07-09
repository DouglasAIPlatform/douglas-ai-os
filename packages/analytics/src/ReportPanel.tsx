"use client";

import type { Report } from "./AnalyticsTypes";
import { ANALYTICS_DOMAIN_LABELS, METRIC_PERIOD_LABELS } from "./AnalyticsTypes";

interface ReportPanelProps {
  report: Report;
}

export function ReportPanel({ report }: ReportPanelProps) {
  return (
    <article className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
      <div className="flex flex-col gap-[var(--ds-space-2)]">
        <div>
          <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
            {report.title}
          </p>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            {ANALYTICS_DOMAIN_LABELS[report.domain] ?? report.domain} ·{" "}
            {METRIC_PERIOD_LABELS[report.period]} · {report.status}
          </p>
        </div>

        <div className="space-y-[var(--ds-space-3)]">
          {report.sections.map((section) => (
            <div key={section.id}>
              <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                {section.title}
              </p>
              <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
                {section.summary}
              </p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
