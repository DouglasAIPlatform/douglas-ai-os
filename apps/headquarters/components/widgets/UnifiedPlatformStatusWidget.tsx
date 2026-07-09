"use client";

import { READINESS_STATUS_LABELS } from "@douglas/diagnostics";
import {
  PLATFORM_OVERALL_STATUS_LABELS,
  PLATFORM_READINESS_LABELS,
} from "@douglas/platform-state";
import { useOperationalCommandCenter } from "@/features/operational-command-center";
import { usePlatformState } from "@douglas/platform-state";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type UnifiedPlatformStatusWidgetProps = WidgetStateProps;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function UnifiedPlatformStatusWidget({
  isLoading: externalLoading,
  error: externalError,
}: UnifiedPlatformStatusWidgetProps) {
  const command = useOperationalCommandCenter();
  const { snapshot } = usePlatformState();
  const { status, recentActions, recentCriticalEvents, recommendations } = command;

  const isLoading = externalLoading ?? false;
  const error = externalError ?? null;

  return (
    <WidgetFrame
      title="Operational Command Center"
      description="Visão principal da operação — Douglas AI OS"
      isLoading={isLoading}
      error={error}
      footer={`Atualizado ${formatTime(status.generatedAt)} · Readiness ${status.readinessScore}% · fonte: ${snapshot.readiness.source === "boot-diagnostics" ? "Boot Diagnostics" : "Platform fallback"}`}
    >
      <div className="space-y-[var(--ds-space-4)]">
        <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Status geral"
            value={PLATFORM_OVERALL_STATUS_LABELS[status.overallStatus as keyof typeof PLATFORM_OVERALL_STATUS_LABELS] ?? status.overallStatus}
            highlight={status.overallStatus !== "healthy"}
          />
          <Stat
            label="Readiness score"
            value={`${status.readinessScore}%`}
            highlight={status.readinessScore < 80}
          />
          <Stat
            label="Nível readiness"
            value={PLATFORM_READINESS_LABELS[status.readinessLevel as keyof typeof PLATFORM_READINESS_LABELS] ?? status.readinessLevel}
          />
          <Stat
            label="Pronta para operar"
            value={status.platformReady ? "Sim" : "Não"}
            highlight={!status.platformReady}
          />
        </div>

        <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Módulos prontos" value={`${status.readyModules}/${status.loadedModules}`} />
          <Stat label="Módulos com alerta" value={String(status.alertModules)} highlight={status.alertModules > 0} />
          <Stat label="Módulos críticos" value={String(status.criticalModules)} highlight={status.criticalModules > 0} />
          <Stat label="Health geral" value={status.healthLabel} highlight={status.healthStatus !== "healthy"} />
        </div>

        {status.diagnosticsGeneratedAt ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
            <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
              Último diagnóstico
            </p>
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {status.diagnosticsStatus
                ? READINESS_STATUS_LABELS[status.diagnosticsStatus as keyof typeof READINESS_STATUS_LABELS] ?? status.diagnosticsStatus
                : "—"}{" "}
              · Score {status.diagnosticsScore}% ·{" "}
              {status.diagnosticsReady ? "Pronta" : "Não pronta"} ·{" "}
              {formatTime(status.diagnosticsGeneratedAt)}
            </p>
          </div>
        ) : null}

        {status.blockers.length > 0 ? (
          <IssueBlock title="Blockers" items={status.blockers} />
        ) : null}

        {recommendations.length > 0 ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
            <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
              Recomendações operacionais
            </p>
            <ul className="mt-[var(--ds-space-2)] list-inside list-disc text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {recommendations.slice(0, 5).map((rec) => (
                <li key={rec.id}>
                  [{rec.priority}] {rec.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-[var(--ds-space-4)] lg:grid-cols-2">
          <div>
            <h3 className="mb-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] uppercase tracking-wide text-[var(--ds-color-text-muted)]">
              Últimas ações executadas
            </h3>
            {recentActions.length > 0 ? (
              <ul className="space-y-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)]">
                {recentActions.map((action) => (
                  <li
                    key={action.commandId}
                    className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[var(--ds-color-text-muted)]"
                  >
                    <span className="text-[var(--ds-color-text-primary)]">
                      {action.actionLabel}
                    </span>{" "}
                    em {action.moduleId} — {action.success ? "OK" : "Falhou"} ·{" "}
                    {formatTime(action.completedAt)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Nenhuma ação executada nesta sessão.
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] uppercase tracking-wide text-[var(--ds-color-text-muted)]">
              Últimos eventos críticos
            </h3>
            {recentCriticalEvents.length > 0 ? (
              <ul className="space-y-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)]">
                {recentCriticalEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[var(--ds-color-text-muted)]"
                  >
                    <span className="text-[var(--ds-color-text-primary)]">{event.message}</span>{" "}
                    · {event.source} · {formatTime(event.timestamp)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Nenhum evento crítico recente.
              </p>
            )}
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
      <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
        {label}
      </p>
      <p
        className={`mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] capitalize ${
          highlight
            ? "text-[var(--ds-color-text-primary)]"
            : "text-[var(--ds-color-text-primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function IssueBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
      <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
        {title}
      </p>
      <ul className="mt-[var(--ds-space-2)] list-inside list-disc text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
