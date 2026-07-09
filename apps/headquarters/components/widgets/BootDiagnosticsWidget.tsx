"use client";

import { READINESS_STATUS_LABELS, useBootDiagnostics } from "@douglas/diagnostics";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type BootDiagnosticsWidgetProps = WidgetStateProps;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function BootDiagnosticsWidget({
  isLoading: externalLoading,
  error: externalError,
}: BootDiagnosticsWidgetProps) {
  const { report, isGenerating, regenerate } = useBootDiagnostics();

  const isLoading = externalLoading ?? isGenerating;
  const error =
    externalError ??
    (report?.status === "not_ready" && report.criticalIssues.length > 0
      ? `${report.criticalIssues.length} problema(s) crítico(s) detectado(s).`
      : null);

  return (
    <WidgetFrame
      title="Boot Diagnostics"
      description="Diagnóstico de boot e readiness da Douglas AI OS"
      isLoading={isLoading}
      error={error}
      isEmpty={!report && !isLoading}
      emptyTitle="Diagnóstico não disponível"
      emptyDescription="Aguardando bootstrap completar."
      footer={
        report
          ? `Gerado ${formatTime(report.generatedAt)} · Boot ${formatDuration(report.startupTimeline.bootDurationMs)}`
          : undefined
      }
    >
      {report ? (
        <div className="space-y-[var(--ds-space-4)]">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void regenerate()}
              disabled={isGenerating}
              className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)] hover:bg-[var(--ds-color-surface-muted)] disabled:opacity-50"
            >
              {isGenerating ? "Gerando…" : "Atualizar"}
            </button>
          </div>
          <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Readiness Score" value={`${report.score}%`} highlight={report.score < 80} />
            <Stat
              label="Status geral"
              value={READINESS_STATUS_LABELS[report.status]}
              highlight={report.status !== "ready"}
            />
            <Stat
              label="Pronta para operar"
              value={report.ready ? "Sim" : "Não"}
              highlight={!report.ready}
            />
            <Stat
              label="Tempo de boot"
              value={formatDuration(report.startupTimeline.bootDurationMs)}
            />
          </div>

          {report.criticalIssues.length > 0 ? (
            <IssueSection
              title="Problemas críticos"
              items={report.criticalIssues.map((issue) => issue.message)}
              variant="critical"
            />
          ) : null}

          {report.warnings.length > 0 ? (
            <IssueSection
              title="Alertas"
              items={report.warnings.map((warning) => warning.message)}
              variant="warning"
            />
          ) : null}

          {report.recommendations.length > 0 ? (
            <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
              <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
                Recomendações
              </p>
              <ul className="mt-[var(--ds-space-2)] list-inside list-disc text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                {report.recommendations.map((rec) => (
                  <li key={rec.id}>
                    [{rec.priority}] {rec.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {report.recentCriticalEvents.length > 0 ? (
            <div>
              <h3 className="mb-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] uppercase tracking-wide text-[var(--ds-color-text-muted)]">
                Eventos críticos recentes
              </h3>
              <ul className="space-y-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                {report.recentCriticalEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)]"
                  >
                    <span className="text-[var(--ds-color-text-primary)]">{event.message}</span>
                    <span className="ml-[var(--ds-space-2)] opacity-70">
                      {formatTime(event.timestamp)} · {event.source}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {report.startupTimeline.entries.length > 0 ? (
            <div>
              <h3 className="mb-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] uppercase tracking-wide text-[var(--ds-color-text-muted)]">
                Timeline de boot
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-[length:var(--ds-font-size-xs)]">
                  <thead>
                    <tr className="border-b border-[var(--ds-color-border-subtle)] text-[var(--ds-color-text-muted)]">
                      <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                        #
                      </th>
                      <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                        Módulo
                      </th>
                      <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                        Status
                      </th>
                      <th className="pb-[var(--ds-space-2)] font-[var(--ds-font-weight-medium)]">
                        Init
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.startupTimeline.entries.map((entry) => (
                      <tr
                        key={entry.moduleId}
                        className="border-b border-[var(--ds-color-border-subtle)] last:border-0"
                      >
                        <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-muted)]">
                          {entry.order}
                        </td>
                        <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-primary)]">
                          {entry.moduleName}
                        </td>
                        <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] capitalize text-[var(--ds-color-text-muted)]">
                          {entry.status}
                        </td>
                        <td className="py-[var(--ds-space-2)] text-[var(--ds-color-text-muted)]">
                          {entry.initTimeMs}ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
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

function IssueSection({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "critical" | "warning";
}) {
  return (
    <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
      <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
        {title}
        {variant === "critical" ? " ⚠" : ""}
      </p>
      <ul className="mt-[var(--ds-space-2)] list-inside list-disc text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
