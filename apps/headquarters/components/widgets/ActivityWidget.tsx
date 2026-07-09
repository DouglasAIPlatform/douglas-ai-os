import { StatusBadge } from "@douglas/ui";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export interface ActivityWidgetItem {
  id: string;
  title: string;
  description: string;
  time: string;
  status?: string;
}

export interface ActivityWidgetProps extends WidgetStateProps {
  activities: ActivityWidgetItem[];
  footer?: string;
}

export function ActivityWidget({
  activities,
  footer,
  isLoading,
  error,
}: ActivityWidgetProps) {
  return (
    <WidgetFrame
      title="Atividade Recente"
      description="Eventos mockados da operação"
      count={activities.length}
      footer={footer}
      isLoading={isLoading}
      isEmpty={activities.length === 0}
      error={error}
      emptyTitle="Nenhuma atividade recente"
      emptyDescription="Eventos aparecerão aqui quando a plataforma receber dados reais."
    >
      <ol className="space-y-[var(--ds-space-3)]">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]"
          >
            <div className="flex flex-col gap-[var(--ds-space-3)] sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                  {activity.title}
                </p>
                <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
                  {activity.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-[var(--ds-space-2)]">
                {activity.status ? (
                  <StatusBadge label={activity.status} variant="neutral" />
                ) : null}
                <time className="text-[length:var(--ds-font-size-xs)] tabular-nums text-[var(--ds-color-text-subtle)]">
                  {activity.time}
                </time>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </WidgetFrame>
  );
}
