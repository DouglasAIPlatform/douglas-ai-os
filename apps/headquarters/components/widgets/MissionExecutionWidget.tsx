"use client";

import {
  MISSION_EXECUTION_STATUS_LABELS,
  MISSION_STATUS_LABELS,
} from "@douglas/missions";
import { OPERATOR_ROLE_LABELS } from "@douglas/security";
import { useState } from "react";
import { useMissionExecution } from "@/features/mission-control/useMissionExecution";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type MissionExecutionWidgetProps = WidgetStateProps;

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

export function MissionExecutionWidget({
  isLoading: externalLoading,
  error: externalError,
}: MissionExecutionWidgetProps) {
  const {
    title,
    context,
    result,
    timeline,
    boardMission,
    isRunning,
    error,
    canExecute,
    canCancel,
    canRetry,
    role,
    operatorName,
    abbreviatedCorrelationId,
    agentName,
    agentVersion,
    agentCapabilities,
    agentReadOnly,
    agentStatus,
    agentMetrics,
    agentReport,
    executeDiagnostic,
    cancelExecution,
    retryExecution,
  } = useMissionExecution();

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmExecute, setConfirmExecute] = useState(false);

  const isLoading = externalLoading ?? isRunning;
  const displayError = externalError ?? error;
  const statusLabel = context
    ? MISSION_EXECUTION_STATUS_LABELS[context.status]
    : "Aguardando";

  const boardStatus = boardMission?.status;
  const canCancelNow =
    canCancel &&
    context &&
    (context.status === "running" || context.status === "assigned");

  const handleExecute = async () => {
    if (!confirmExecute) {
      setConfirmExecute(true);
      return;
    }
    setConfirmExecute(false);
    await executeDiagnostic();
  };

  const handleCancel = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    setConfirmCancel(false);
    await cancelExecution();
  };

  return (
    <WidgetFrame
      title="Execução de Missão"
      description="System Diagnostics Agent · fluxo Mission → Agent → Result (read-only)"
      isLoading={isLoading}
      error={displayError}
      footer={
        result
          ? `${result.success ? "Sucesso" : "Falha"} · ${result.summary.slice(0, 80)}`
          : "Nenhuma execução iniciada"
      }
    >
      <div className="space-y-[var(--ds-space-4)]">
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
          <div className="flex flex-wrap items-center justify-between gap-[var(--ds-space-2)]">
            <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              {agentName} v{agentVersion}
            </p>
            {agentReadOnly ? (
              <span className="rounded-[var(--ds-radius-sm)] bg-[var(--ds-color-surface-default)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Agente read-only
              </span>
            ) : null}
          </div>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Status agente: {agentStatus} · Disponibilidade:{" "}
            {agentStatus === "running" || agentStatus === "assigned" ? "ocupado" : "disponível"}
          </p>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Capabilities: {agentCapabilities.join(", ")}
          </p>
        </div>

        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
          <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
            {title}
          </p>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Operador: {operatorName} · Role {OPERATOR_ROLE_LABELS[role]}
            {abbreviatedCorrelationId ? ` · Corr ${abbreviatedCorrelationId}` : ""}
          </p>
        </div>

        <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Status execução" value={statusLabel} />
          <Metric
            label="Board"
            value={boardStatus ? MISSION_STATUS_LABELS[boardStatus] : "—"}
          />
          <Metric label="Etapa" value={context?.currentStep ?? "—"} />
          <Metric label="Progresso" value={`${context?.progress ?? 0}%`} />
        </div>

        {context?.assignedAgentId ? (
          <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Agente atribuído: {context.assignedAgentId}
            {agentMetrics.lastExecutionAt
              ? ` · última execução ${formatTime(agentMetrics.lastExecutionAt)}`
              : ""}
            {agentMetrics.averageDurationMs
              ? ` · média ${agentMetrics.averageDurationMs}ms`
              : ""}
          </p>
        ) : null}

        {agentReport ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] p-[var(--ds-space-3)]">
            <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              Relatório do agente · {agentReport.overallStatus}
            </p>
            {agentReport.identifiedRisks.length ? (
              <ul className="mt-[var(--ds-space-2)] list-disc pl-[var(--ds-space-4)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-status-warning)]">
                {agentReport.identifiedRisks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            ) : null}
            {agentReport.recommendations.length ? (
              <ul className="mt-[var(--ds-space-2)] list-disc pl-[var(--ds-space-4)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                {agentReport.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-[var(--ds-space-2)]">
          <button
            type="button"
            disabled={!canExecute || isRunning}
            onClick={() => void handleExecute()}
            className="rounded-[var(--ds-radius-sm)] bg-[var(--ds-color-brand-accent)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-inverse)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmExecute ? "Confirmar execução" : "Executar diagnóstico"}
          </button>

          {canCancelNow ? (
            <button
              type="button"
              disabled={isRunning}
              onClick={() => void handleCancel()}
              className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)] disabled:opacity-50"
            >
              {confirmCancel ? "Confirmar cancelamento" : "Cancelar"}
            </button>
          ) : null}

          {canRetry ? (
            <button
              type="button"
              disabled={isRunning}
              onClick={() => void retryExecution()}
              className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]"
            >
              Tentar novamente
            </button>
          ) : null}

          {!canExecute ? (
            <span className="self-center text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Execução bloqueada para role {OPERATOR_ROLE_LABELS[role]}
            </span>
          ) : null}
        </div>

        {result ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] p-[var(--ds-space-3)]">
            <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              Resultado
            </p>
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {result.summary}
            </p>
            {context?.sanitizedError ? (
              <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-status-warning)]">
                {context.sanitizedError}
              </p>
            ) : null}
          </div>
        ) : null}

        {timeline.length > 0 ? (
          <div>
            <p className="mb-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              Timeline
            </p>
            <ul className="max-h-48 space-y-[var(--ds-space-2)] overflow-y-auto text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {timeline.map((entry) => (
                <li
                  key={entry.id}
                  className="flex gap-[var(--ds-space-2)] border-b border-[var(--ds-color-border-subtle)] pb-[var(--ds-space-1)]"
                >
                  <span className="shrink-0 tabular-nums">{formatTime(entry.timestamp)}</span>
                  <span>
                    {entry.title}
                    {entry.description ? ` · ${entry.description}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </WidgetFrame>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] p-[var(--ds-space-2)]">
      <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">{label}</p>
      <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
