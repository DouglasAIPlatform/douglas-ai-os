"use client";

import {
  MISSION_EXECUTION_STATUS_LABELS,
  MISSION_STATUS_LABELS,
} from "@douglas/missions";
import { OPERATOR_ROLE_LABELS } from "@douglas/security";
import { useState } from "react";
import { useMissionExecution } from "@/features/mission-control/useMissionExecution";
import { useMissionPersistenceRemoteValidationFromContext, useStagingPersistenceAcceptanceFromContext } from "@/features/mission-control/MissionExecutionPersistenceContext";
import { resolveMissionExecutionPersistenceMode } from "@/features/mission-control/missionExecutionPersistenceConfig";
import { useEnvironmentStatus } from "@/features/platform-environment/useEnvironmentStatus";
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
    missionKind,
    setMissionKind,
    title,
    executeLabel,
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
    releaseReadinessReport,
    executeMission,
    cancelExecution,
    retryExecution,
    retryPersistenceSync,
    persistenceStatus,
    recentExecutions,
    persistenceEvents,
    rehydratedExecution,
  } = useMissionExecution();

  const remoteValidation = useMissionPersistenceRemoteValidationFromContext();
  const stagingAcceptance = useStagingPersistenceAcceptanceFromContext();
  const { snapshot: envSnapshot } = useEnvironmentStatus();
  const isStaging = envSnapshot.effectiveEnvironment === "staging";

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmExecute, setConfirmExecute] = useState(false);
  const [confirmRemoteValidation, setConfirmRemoteValidation] = useState(false);
  const [confirmAcceptanceStart, setConfirmAcceptanceStart] = useState(false);
  const [confirmAcceptanceReset, setConfirmAcceptanceReset] = useState(false);

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
    await executeMission();
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
      description="Mission → Agent → Result (read-only) · diagnóstico ou revisão de readiness"
      isLoading={isLoading}
      error={displayError}
      footer={
        result
          ? `${result.success ? "Sucesso" : "Falha"} · ${result.summary.slice(0, 80)}`
          : "Nenhuma execução iniciada"
      }
    >
      <div className="space-y-[var(--ds-space-4)]">
        <div className="flex flex-wrap gap-[var(--ds-space-2)]">
          <MissionKindButton
            active={missionKind === "operational_diagnostic"}
            label="Diagnóstico operacional"
            onClick={() => setMissionKind("operational_diagnostic")}
          />
          <MissionKindButton
            active={missionKind === "release_readiness_review"}
            label="Revisão de readiness"
            onClick={() => setMissionKind("release_readiness_review")}
          />
        </div>

        {missionKind === "release_readiness_review" ? (
          <p className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-status-warning)]/30 bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Não aprova nem executa release — apenas recomenda readiness com base em snapshots internos.
          </p>
        ) : null}
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

        {releaseReadinessReport ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] p-[var(--ds-space-3)]">
            <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              Recomendação · {releaseReadinessReport.verdict}
            </p>
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              v{releaseReadinessReport.version} · {releaseReadinessReport.environment} · channel{" "}
              {releaseReadinessReport.releaseChannel}
            </p>
            {releaseReadinessReport.blockers.length ? (
              <ul className="mt-[var(--ds-space-2)] list-disc pl-[var(--ds-space-4)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-status-warning)]">
                {releaseReadinessReport.blockers.map((blocker) => (
                  <li key={blocker.id}>{blocker.message}</li>
                ))}
              </ul>
            ) : null}
            {releaseReadinessReport.warnings.length ? (
              <ul className="mt-[var(--ds-space-2)] list-disc pl-[var(--ds-space-4)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                {releaseReadinessReport.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
            {releaseReadinessReport.recommendations.length ? (
              <ul className="mt-[var(--ds-space-2)] list-disc pl-[var(--ds-space-4)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                {releaseReadinessReport.recommendations.map((item) => (
                  <li key={item.message}>{item.message}</li>
                ))}
              </ul>
            ) : null}
            {releaseReadinessReport.evidence.length ? (
              <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Evidências: {releaseReadinessReport.evidence.length} snapshot(s) analisado(s)
              </p>
            ) : null}
          </div>
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
            {confirmExecute ? "Confirmar execução" : executeLabel}
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

        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
          <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
            Persistência
          </p>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Modo: {persistenceStatus?.mode ?? "—"} · Adapter:{" "}
            {persistenceStatus?.activeAdapter ?? "—"}
            {persistenceStatus?.lastSyncAt
              ? ` · Sync ${formatTime(persistenceStatus.lastSyncAt)}`
              : ""}
          </p>
          {persistenceStatus?.fallbackActive ? (
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-status-warning)]">
              Fallback sessionStorage ativo
              {persistenceStatus.pendingSyncCount
                ? ` · ${persistenceStatus.pendingSyncCount} pendente(s)`
                : ""}
            </p>
          ) : null}
          {rehydratedExecution ? (
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Reidratada: {rehydratedExecution.executionId.slice(0, 16)}… ·{" "}
              {MISSION_EXECUTION_STATUS_LABELS[rehydratedExecution.status]}
            </p>
          ) : null}
          {persistenceEvents.length > 0 ? (
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Timeline persistida: {persistenceEvents.length} evento(s)
            </p>
          ) : null}
          {recentExecutions.length > 1 ? (
            <ul className="mt-[var(--ds-space-2)] list-disc pl-[var(--ds-space-4)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {recentExecutions.slice(0, 3).map((item) => (
                <li key={item.executionId}>
                  {item.executionId.slice(0, 12)}… ·{" "}
                  {MISSION_EXECUTION_STATUS_LABELS[item.status]}
                </li>
              ))}
            </ul>
          ) : null}
          {persistenceStatus?.fallbackActive ? (
            <button
              type="button"
              onClick={() => void retryPersistenceSync()}
              className="mt-[var(--ds-space-2)] rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)]"
            >
              Retry sync
            </button>
          ) : null}
        </div>

        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
          <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
            Validação de persistência remota
          </p>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Modo configurado: {resolveMissionExecutionPersistenceMode(envSnapshot.effectiveEnvironment)}
            {" · "}
            Modo efetivo: {persistenceStatus?.mode ?? "—"}
            {" · "}
            Adapter: {persistenceStatus?.activeAdapter === "supabase" ? "Supabase" : persistenceStatus?.activeAdapter === "session" ? "sessionStorage" : persistenceStatus?.activeAdapter ?? "—"}
          </p>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Health: {persistenceStatus?.supabaseTableReady === true ? "tabelas OK" : persistenceStatus?.supabaseTableReady === false ? "tabelas indisponíveis" : "desconhecido"}
            {persistenceStatus?.lastHydratedAt
              ? ` · Reidratado ${formatTime(persistenceStatus.lastHydratedAt)}`
              : ""}
            {persistenceStatus?.lastSyncAt
              ? ` · Sync ${formatTime(persistenceStatus.lastSyncAt)}`
              : ""}
          </p>
          {remoteValidation?.fallbackEvaluation.fallbackActive ? (
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-status-warning)]">
              Fallback sessionStorage ativo
              {remoteValidation.fallbackEvaluation.stagingBlocker ? " — blocker em staging" : ""}
            </p>
          ) : null}
          {(persistenceStatus?.pendingSyncCount ?? 0) > 0 ? (
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-status-warning)]">
              Pending queue: {persistenceStatus?.pendingSyncCount} item(ns)
            </p>
          ) : null}
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Checks remotos: {remoteValidation?.report.status ?? "unknown"}
            {remoteValidation?.remoteConfirmed ? " · remoto confirmado" : ""}
          </p>
          {!isStaging ? (
            <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Validação remota disponível apenas em staging (development usa fallback permitido).
            </p>
          ) : null}
          {remoteValidation && isStaging ? (
            <div className="mt-[var(--ds-space-2)] flex flex-wrap gap-[var(--ds-space-2)]">
              {!confirmRemoteValidation ? (
                <button
                  type="button"
                  disabled={!remoteValidation.eligibility.allowed || remoteValidation.running}
                  onClick={() => setConfirmRemoteValidation(true)}
                  className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] disabled:opacity-50"
                >
                  Executar validação segura
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={remoteValidation.running}
                    onClick={() => {
                      void remoteValidation.runValidation();
                      setConfirmRemoteValidation(false);
                    }}
                    className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-status-warning)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)]"
                  >
                    Confirmar validação
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemoteValidation(false)}
                    className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)]"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          ) : null}
          {!remoteValidation?.eligibility.allowed && isStaging ? (
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {remoteValidation?.eligibility.reason}
            </p>
          ) : null}
          {remoteValidation?.running ? (
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Validação em andamento…
            </p>
          ) : null}
        </div>

        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
          <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
            Staging Persistence Acceptance
          </p>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Ambiente: {envSnapshot.effectiveEnvironment}
            {" · "}
            Persistência: {persistenceStatus?.activeAdapter === "supabase" ? "Supabase" : persistenceStatus?.activeAdapter ?? "—"}
            {" · "}
            Status: {stagingAcceptance?.report.status ?? "not_run"}
          </p>
          {!isStaging ? (
            <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Acceptance staging habilitada apenas em staging (development mantém fallback local).
            </p>
          ) : null}
          {isStaging && stagingAcceptance ? (
            <>
              {!stagingAcceptance.eligibility.allowed ? (
                <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  {stagingAcceptance.eligibility.reason}
                </p>
              ) : null}
              {stagingAcceptance.checkpoint ? (
                <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-status-warning)]">
                  Reload checkpoint: {stagingAcceptance.checkpoint.summary}
                </p>
              ) : null}
              {stagingAcceptance.report.blockers.length > 0 ? (
                <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-status-error)]">
                  Blockers: {stagingAcceptance.report.blockers.join(" · ")}
                </p>
              ) : null}
              {stagingAcceptance.report.warnings.length > 0 ? (
                <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-status-warning)]">
                  Warnings: {stagingAcceptance.report.warnings.join(" · ")}
                </p>
              ) : null}
              <ul className="mt-[var(--ds-space-2)] space-y-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                {stagingAcceptance.report.scenarios.map((scenario) => (
                  <li key={scenario.id}>
                    {scenario.label}: {scenario.status}
                  </li>
                ))}
              </ul>
              <div className="mt-[var(--ds-space-2)] flex flex-wrap gap-[var(--ds-space-2)]">
                {!confirmAcceptanceStart ? (
                  <button
                    type="button"
                    disabled={!stagingAcceptance.eligibility.allowed || stagingAcceptance.running}
                    onClick={() => setConfirmAcceptanceStart(true)}
                    className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] disabled:opacity-50"
                  >
                    Iniciar acceptance
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={stagingAcceptance.running}
                      onClick={() => {
                        void stagingAcceptance.startAcceptance();
                        setConfirmAcceptanceStart(false);
                      }}
                      className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-status-warning)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)]"
                    >
                      Confirmar início
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAcceptanceStart(false)}
                      className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)]"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {stagingAcceptance.checkpoint?.awaitingReload ? (
                  <button
                    type="button"
                    disabled={stagingAcceptance.running}
                    onClick={() => void stagingAcceptance.resumeAfterReload()}
                    className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)]"
                  >
                    Retomar após reload
                  </button>
                ) : null}
                {!confirmAcceptanceReset ? (
                  <button
                    type="button"
                    disabled={stagingAcceptance.running}
                    onClick={() => setConfirmAcceptanceReset(true)}
                    className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)]"
                  >
                    Reiniciar acceptance
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        stagingAcceptance.resetAcceptance();
                        setConfirmAcceptanceReset(false);
                      }}
                      className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-status-warning)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)]"
                    >
                      Confirmar reinício
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAcceptanceReset(false)}
                      className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)]"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
              {stagingAcceptance.running ? (
                <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Acceptance em andamento…
                </p>
              ) : null}
              <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                {stagingAcceptance.report.summary}
              </p>
            </>
          ) : null}
        </div>

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

function MissionKindButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[var(--ds-radius-sm)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] ${
        active
          ? "bg-[var(--ds-color-brand-accent)] text-[var(--ds-color-text-inverse)]"
          : "border border-[var(--ds-color-border-subtle)] text-[var(--ds-color-text-muted)]"
      }`}
    >
      {label}
    </button>
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
