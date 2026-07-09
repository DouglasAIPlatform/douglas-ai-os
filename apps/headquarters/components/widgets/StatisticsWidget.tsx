import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export interface StatisticWidgetItem {
  id: string;
  label: string;
  value: string | number;
  detail?: string;
}

export interface StatisticsWidgetProps extends WidgetStateProps {
  statistics: StatisticWidgetItem[];
  footer?: string;
}

export function StatisticsWidget({
  statistics,
  footer,
  isLoading,
  error,
}: StatisticsWidgetProps) {
  return (
    <WidgetFrame
      title="Indicadores"
      description="Resumo operacional da plataforma"
      count={statistics.length}
      footer={footer}
      isLoading={isLoading}
      isEmpty={statistics.length === 0}
      error={error}
      emptyTitle="Nenhum indicador disponível"
      emptyDescription="Indicadores serão exibidos quando houver dados agregados."
    >
      <dl className="grid grid-cols-1 gap-[var(--ds-space-3)] sm:grid-cols-3">
        {statistics.map((statistic) => (
          <div
            key={statistic.id}
            className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-4)] py-[var(--ds-space-3)]"
          >
            <dt className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-muted)]">
              {statistic.label}
            </dt>
            <dd className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-2xl)] font-[var(--ds-font-weight-semibold)] tabular-nums tracking-[var(--ds-letter-spacing-tight)] text-[var(--ds-color-text-primary)]">
              {statistic.value}
            </dd>
            {statistic.detail ? (
              <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-subtle)]">
                {statistic.detail}
              </p>
            ) : null}
          </div>
        ))}
      </dl>
    </WidgetFrame>
  );
}
