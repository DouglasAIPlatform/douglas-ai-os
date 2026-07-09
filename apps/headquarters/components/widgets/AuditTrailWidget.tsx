"use client";

import { useCallback, useState } from "react";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_INGEST_ERROR_CODE_LABELS,
  AUDIT_INGEST_RESPONSE_STATUS_LABELS,
  AUDIT_PERSISTENCE_MODE_LABELS,
  AUDIT_RETRY_STATUS_LABELS,
  AUDIT_SEVERITY_LABELS,
  AUDIT_SOURCE_LABELS,
  SUPABASE_AUDIT_WRITE_MODE_LABELS,
  getAuditCorrelationRef,
  isAuditEntryPersistedLocally,
  sanitizeAuditErrorForDisplay,
  type AuditIngestErrorCode,
  type AuditRetryStatus,
  type AuditSeverity,
  useAudit,
} from "@douglas/audit";
import { OPERATOR_ROLE_LABELS, type OperatorRole } from "@douglas/security";
import { StatusBadge, type StatusBadgeVariant } from "@douglas/ui";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type AuditTrailWidgetProps = WidgetStateProps;

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

function formatRole(role: string): string {
  if (role in OPERATOR_ROLE_LABELS) {
    return OPERATOR_ROLE_LABELS[role as OperatorRole];
  }
  return role;
}

function adapterVariant(
  activeAdapter: ReturnType<typeof useAudit>["persistenceStatus"]["activeAdapter"],
): StatusBadgeVariant {
  switch (activeAdapter) {
    case "supabase":
      return "available";
    case "composite":
      return "development";
    default:
      return "neutral";
  }
}

function remoteStatusVariant(
  status: ReturnType<typeof useAudit>["persistenceStatus"]["lastRemoteStatus"],
): StatusBadgeVariant {
  switch (status) {
    case "accepted":
      return "available";
    case "rejected":
      return "development";
    case "error":
      return "development";
    default:
      return "neutral";
  }
}

const SEVERITY_STYLES: Record<AuditSeverity, string> = {
  info: "text-[var(--ds-color-text-muted)]",
  warning: "text-[var(--ds-color-text-primary)]",
  error: "font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]",
  critical: "font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]",
};

function syncStatusVariant(status: AuditRetryStatus | undefined): StatusBadgeVariant {
  switch (status) {
    case "synced":
      return "available";
    case "pending":
    case "retrying":
      return "development";
    case "failed":
      return "development";
    default:
      return "neutral";
  }
}

export function AuditTrailWidget({
  isLoading: externalLoading,
  error: externalError,
}: AuditTrailWidgetProps) {
  const { entries, totalCount, persistenceStatus, retryPendingEntries } = useAudit();
  const [retryInFlight, setRetryInFlight] = useState(false);

  const handleRetryPending = useCallback(async () => {
    if (!retryPendingEntries || retryInFlight) return;

    setRetryInFlight(true);
    try {
      await retryPendingEntries();
    } finally {
      setRetryInFlight(false);
    }
  }, [retryInFlight, retryPendingEntries]);

  const isLoading = externalLoading ?? false;
  const safeError = sanitizeAuditErrorForDisplay(
    externalError ?? persistenceStatus.lastError,
  );
  const safeRetryError = sanitizeAuditErrorForDisplay(persistenceStatus.lastRetryError);
  const syncStatus = persistenceStatus.syncStatus ?? "idle";
  const canRetryPending =
    Boolean(retryPendingEntries) &&
    persistenceStatus.supabaseConfigured &&
    persistenceStatus.pendingEntries > 0 &&
    syncStatus !== "retrying";
  const persistedCount = entries.filter(isAuditEntryPersistedLocally).length;
  const edgeFunctionMode = persistenceStatus.supabaseWriteMode === "edge_function";
  const remoteErrorLabel = persistenceStatus.lastRemoteErrorCode
    ? (AUDIT_INGEST_ERROR_CODE_LABELS[
        persistenceStatus.lastRemoteErrorCode as AuditIngestErrorCode
      ] ?? persistenceStatus.lastRemoteErrorCode)
    : null;

  const persistenceSummary = [
    `modo ${AUDIT_PERSISTENCE_MODE_LABELS[persistenceStatus.mode]}`,
    `adapter ${persistenceStatus.activeAdapter}`,
    persistenceStatus.fallbackUsed ? "fallback local ativo" : null,
    persistenceStatus.pendingEntries > 0
      ? `${persistenceStatus.pendingEntries} pendentes Supabase`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <WidgetFrame
      title="Operational Audit Trail"
      description="Auditoria operacional — Event Bus + persistência com fallback"
      isLoading={isLoading}
      error={safeError}
      isEmpty={!entries.length && !isLoading}
      emptyTitle="Nenhuma entrada de auditoria"
      emptyDescription="Ações de segurança, runtime e diagnostics aparecerão aqui."
      footer={
        persistenceStatus.enabled
          ? `${totalCount} entradas · ${persistedCount} persistidas localmente · ${persistenceSummary}`
          : `${totalCount} entradas no log · exibindo ${entries.length}`
      }
    >
      <div className="mb-[var(--ds-space-4)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
        <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
          <StatusBadge
            label={AUDIT_PERSISTENCE_MODE_LABELS[persistenceStatus.mode]}
            variant={adapterVariant(persistenceStatus.activeAdapter)}
          />
          <StatusBadge
            label={`Adapter: ${persistenceStatus.activeAdapter}`}
            variant={adapterVariant(persistenceStatus.activeAdapter)}
          />
          {persistenceStatus.fallbackUsed ? (
            <StatusBadge label="Fallback local" variant="development" />
          ) : null}
          <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Supabase:{" "}
            {persistenceStatus.supabaseConfigured ? "configurado" : "não configurado"}
            {persistenceStatus.supabaseConfigured
              ? ` · tabela ${
                  persistenceStatus.supabaseTableReady === null
                    ? "não verificada"
                    : persistenceStatus.supabaseTableReady
                      ? "OK"
                      : "indisponível"
                }`
              : ""}
          </span>
        </div>

        {persistenceStatus.supabaseWriteMode ? (
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Write mode: {SUPABASE_AUDIT_WRITE_MODE_LABELS[persistenceStatus.supabaseWriteMode]}
          </p>
        ) : null}

        {edgeFunctionMode ? (
          <div className="mt-[var(--ds-space-3)] rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)]">
            <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              Edge Function audit-ingest
            </p>
            <dl className="mt-[var(--ds-space-2)] grid gap-[var(--ds-space-2)] sm:grid-cols-2">
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Modo
                </dt>
                <dd className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                  edge_function (preparado)
                </dd>
              </div>
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Último status remoto
                </dt>
                <dd>
                  {persistenceStatus.lastRemoteStatus ? (
                    <StatusBadge
                      label={
                        AUDIT_INGEST_RESPONSE_STATUS_LABELS[persistenceStatus.lastRemoteStatus]
                      }
                      variant={remoteStatusVariant(persistenceStatus.lastRemoteStatus)}
                    />
                  ) : (
                    <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                      aguardando invoke
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Fallback local
                </dt>
                <dd className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                  {persistenceStatus.fallbackUsed ? "ativo" : "inativo"}
                </dd>
              </div>
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Deploy
                </dt>
                <dd className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                  {persistenceStatus.edgeFunctionNotDeployed
                    ? "função não deployada — localStorage continua"
                    : "invoke configurado"}
                </dd>
              </div>
            </dl>
            {safeError ? (
              <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                Último erro seguro: {safeError}
                {remoteErrorLabel ? ` · ${remoteErrorLabel}` : null}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-[var(--ds-space-3)] rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)]">
          <div className="flex flex-wrap items-center justify-between gap-[var(--ds-space-2)]">
            <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              Fila de pendências (retry manual)
            </p>
            <StatusBadge
              label={AUDIT_RETRY_STATUS_LABELS[syncStatus]}
              variant={syncStatusVariant(syncStatus)}
            />
          </div>
          <dl className="mt-[var(--ds-space-2)] grid gap-[var(--ds-space-2)] sm:grid-cols-2">
            <div>
              <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Pendências
              </dt>
              <dd className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                {persistenceStatus.pendingEntries}
              </dd>
            </div>
            <div>
              <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Último retry
              </dt>
              <dd className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                {persistenceStatus.lastRetryAt
                  ? new Date(persistenceStatus.lastRetryAt).toLocaleString("pt-BR")
                  : "nunca executado"}
              </dd>
            </div>
            <div>
              <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Último erro (retry)
              </dt>
              <dd className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                {safeRetryError ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Último resultado
              </dt>
              <dd className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                {persistenceStatus.lastSyncResult
                  ? `${persistenceStatus.lastSyncResult.succeeded} ok · ${persistenceStatus.lastSyncResult.failed} falha · ${persistenceStatus.lastSyncResult.remaining} restantes`
                  : "—"}
              </dd>
            </div>
          </dl>
          {persistenceStatus.pendingQueueError ? (
            <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
              Erro na fila local:{" "}
              {sanitizeAuditErrorForDisplay(persistenceStatus.pendingQueueError)}
            </p>
          ) : null}
          <div className="mt-[var(--ds-space-3)] flex flex-wrap items-center gap-[var(--ds-space-2)]">
            <button
              type="button"
              disabled={!canRetryPending || retryInFlight}
              onClick={() => void handleRetryPending()}
              className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {retryInFlight || syncStatus === "retrying"
                ? "Retry em andamento…"
                : "Retry pendências Supabase"}
            </button>
            {!persistenceStatus.supabaseConfigured ? (
              <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Supabase não configurado — retry remoto desabilitado
              </span>
            ) : null}
          </div>
        </div>

        {persistenceStatus.lastSyncAt ? (
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Último sync Supabase:{" "}
            {new Date(persistenceStatus.lastSyncAt).toLocaleString("pt-BR")}
          </p>
        ) : null}
        {!edgeFunctionMode && safeError ? (
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
            Último erro: {safeError}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-[length:var(--ds-font-size-xs)]">
          <thead>
            <tr className="border-b border-[var(--ds-color-border-subtle)] text-[var(--ds-color-text-muted)]">
              <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                Horário
              </th>
              <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                Ator
              </th>
              <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                Role
              </th>
              <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                Ação
              </th>
              <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                Origem
              </th>
              <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                Severidade
              </th>
              <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                Correlação
              </th>
              <th className="pb-[var(--ds-space-2)] font-[var(--ds-font-weight-medium)]">
                Alvo / Mensagem
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const correlationRef = getAuditCorrelationRef(entry);
              const actorId =
                typeof entry.metadata.actorId === "string" ? entry.metadata.actorId : null;
              const persisted = isAuditEntryPersistedLocally(entry);

              return (
                <tr
                  key={entry.id}
                  className="border-b border-[var(--ds-color-border-subtle)] last:border-0"
                >
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] whitespace-nowrap text-[var(--ds-color-text-muted)]">
                    {formatTime(entry.timestamp)}
                  </td>
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-primary)]">
                    <span>{entry.actor}</span>
                    {actorId && actorId !== entry.actor ? (
                      <span className="mt-[var(--ds-space-1)] block text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                        {actorId}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-muted)]">
                    {formatRole(entry.role)}
                  </td>
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-primary)]">
                    {AUDIT_ACTION_LABELS[entry.action]}
                  </td>
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-muted)]">
                    {AUDIT_SOURCE_LABELS[entry.source]}
                  </td>
                  <td
                    className={`py-[var(--ds-space-2)] pr-[var(--ds-space-3)] capitalize ${SEVERITY_STYLES[entry.severity]}`}
                  >
                    {AUDIT_SEVERITY_LABELS[entry.severity]}
                  </td>
                  <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-muted)]">
                    {correlationRef ? (
                      <span title={correlationRef}>{correlationRef}</span>
                    ) : (
                      "—"
                    )}
                    {persisted ? (
                      <span
                        title="Entrada persistida em localStorage"
                        className="ml-[var(--ds-space-1)] rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] uppercase tracking-wide"
                      >
                        local
                      </span>
                    ) : null}
                  </td>
                  <td className="py-[var(--ds-space-2)] text-[var(--ds-color-text-muted)]">
                    <span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                      {entry.target}
                    </span>
                    <span className="ml-[var(--ds-space-2)]">{entry.message}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  );
}
