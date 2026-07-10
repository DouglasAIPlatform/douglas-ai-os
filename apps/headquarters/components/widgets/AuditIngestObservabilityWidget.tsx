"use client";

import {
  AUDIT_INGEST_ERROR_CODE_LABELS,
  AUDIT_INGEST_OUTCOME_LABELS,
  AUDIT_INGEST_RESPONSE_STATUS_LABELS,
  resolveOverallIngestObservabilityStatus,
  useAudit,
  type AuditIngestErrorCode,
} from "@douglas/audit";
import { StatusBadge, type StatusBadgeVariant } from "@douglas/ui";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type AuditIngestObservabilityWidgetProps = WidgetStateProps;

function overallVariant(
  status: ReturnType<typeof resolveOverallIngestObservabilityStatus>,
): StatusBadgeVariant {
  switch (status) {
    case "accepted":
      return "available";
    case "rejected":
    case "failed":
      return "development";
    case "fallback":
      return "development";
    default:
      return "neutral";
  }
}

function overallLabel(
  status: ReturnType<typeof resolveOverallIngestObservabilityStatus>,
): string {
  if (status === "idle") {
    return "Sem tentativas na sessão";
  }
  return AUDIT_INGEST_OUTCOME_LABELS[status];
}

export function AuditIngestObservabilityWidget({
  isLoading: externalLoading,
  error: externalError,
}: AuditIngestObservabilityWidgetProps) {
  const { ingestObservability } = useAudit();

  const overallStatus = resolveOverallIngestObservabilityStatus(ingestObservability);
  const isLoading = externalLoading ?? false;
  const error = externalError;

  const lastErrorCodeLabel =
    ingestObservability.lastErrorCode &&
    ingestObservability.lastErrorCode in AUDIT_INGEST_ERROR_CODE_LABELS
      ? AUDIT_INGEST_ERROR_CODE_LABELS[
          ingestObservability.lastErrorCode as AuditIngestErrorCode
        ]
      : ingestObservability.lastErrorCode;

  return (
    <WidgetFrame
      title="Audit Ingest Observability"
      description="Métricas locais da sessão atual — complementa logs server-side da Edge Function"
      isLoading={isLoading}
      error={error}
      footer={
        ingestObservability.lastAttemptAt
          ? `Último envio: ${new Date(ingestObservability.lastAttemptAt).toLocaleString("pt-BR")} · ${ingestObservability.totalAttempts} tentativa(s)`
          : "Nenhum envio registrado nesta sessão"
      }
    >
      <div className="space-y-[var(--ds-space-4)]">
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)]">
          <p className="text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
            Estas métricas refletem apenas a <span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">sessão atual do browser</span>.
            Logs estruturados JSON permanecem no runtime Deno (`event: audit_ingest`). Nenhum token, email ou payload completo é armazenado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
          <StatusBadge label={overallLabel(overallStatus)} variant={overallVariant(overallStatus)} />
          {ingestObservability.lastRemoteStatus ? (
            <StatusBadge
              label={
                AUDIT_INGEST_RESPONSE_STATUS_LABELS[ingestObservability.lastRemoteStatus] ??
                ingestObservability.lastRemoteStatus
              }
              variant={
                ingestObservability.lastRemoteStatus === "accepted" ? "available" : "development"
              }
            />
          ) : null}
        </div>

        <dl className="grid gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
            <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Tentativas
            </dt>
            <dd className="text-[length:var(--ds-font-size-lg)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
              {ingestObservability.totalAttempts}
            </dd>
          </div>
          <div className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
            <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Accepted
            </dt>
            <dd className="text-[length:var(--ds-font-size-lg)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
              {ingestObservability.accepted}
            </dd>
          </div>
          <div className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
            <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Rejected
            </dt>
            <dd className="text-[length:var(--ds-font-size-lg)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
              {ingestObservability.rejected}
            </dd>
          </div>
          <div className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
            <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Fallback
            </dt>
            <dd className="text-[length:var(--ds-font-size-lg)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
              {ingestObservability.fallback}
            </dd>
          </div>
          <div className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
            <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Failed
            </dt>
            <dd className="text-[length:var(--ds-font-size-lg)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
              {ingestObservability.failed}
            </dd>
          </div>
          <div className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
            <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Última latência
            </dt>
            <dd className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              {ingestObservability.lastLatencyMs != null
                ? `${ingestObservability.lastLatencyMs} ms`
                : "—"}
            </dd>
          </div>
          <div className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)] sm:col-span-2">
            <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Último erro (sanitizado)
            </dt>
            <dd className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
              {ingestObservability.lastError ?? "—"}
              {lastErrorCodeLabel ? (
                <span className="mt-[var(--ds-space-1)] block text-[var(--ds-color-text-muted)]">
                  Código: {lastErrorCodeLabel}
                </span>
              ) : null}
            </dd>
          </div>
        </dl>

        <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          Referência: <code>docs/architecture/audit-ingest-observability.md</code>
        </p>
      </div>
    </WidgetFrame>
  );
}
