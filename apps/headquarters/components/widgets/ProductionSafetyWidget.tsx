"use client";

import {
  PRODUCTION_SAFETY_STATUS_DESCRIPTIONS,
  PRODUCTION_SAFETY_STATUS_LABELS,
  SUPABASE_ENVIRONMENT_LABELS,
  type ProductionSafetyStatus,
} from "@douglas/supabase";
import { StatusBadge, type StatusBadgeVariant } from "@douglas/ui";
import { useProductionSafetyGate } from "@/features/platform-supabase/production-safety";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type ProductionSafetyWidgetProps = WidgetStateProps;

function statusVariant(status: ProductionSafetyStatus): StatusBadgeVariant {
  switch (status) {
    case "ready_for_production_review":
      return "available";
    case "ready_for_staging":
      return "development";
    case "blocked":
      return "development";
    default:
      return "neutral";
  }
}

function outcomeLabel(outcome: "pass" | "warn" | "fail" | "skip"): string {
  switch (outcome) {
    case "pass":
      return "OK";
    case "warn":
      return "Alerta";
    case "fail":
      return "Falha";
    default:
      return "N/A";
  }
}

function outcomeVariant(
  outcome: "pass" | "warn" | "fail" | "skip",
): StatusBadgeVariant {
  switch (outcome) {
    case "pass":
      return "available";
    case "warn":
      return "development";
    case "fail":
      return "development";
    default:
      return "neutral";
  }
}

export function ProductionSafetyWidget({
  isLoading: externalLoading,
  error: externalError,
}: ProductionSafetyWidgetProps) {
  const { report, isEvaluating, evaluationError, refreshGate } =
    useProductionSafetyGate();

  const isLoading = externalLoading ?? isEvaluating;
  const error = externalError ?? evaluationError;

  const environmentLabel = report
    ? SUPABASE_ENVIRONMENT_LABELS[report.environment]
    : "—";

  return (
    <WidgetFrame
      title="Production Safety Gate"
      description="Diagnóstico read-only — não substitui revisão humana antes de produção"
      isLoading={isLoading}
      error={error}
      footer={
        report
          ? `${report.passedChecks.length} checks OK · ${report.blockingChecks.length} bloqueantes · ${report.alertChecks.length} alertas · ${new Date(report.checkedAt).toLocaleString("pt-BR")}`
          : "Aguardando primeira avaliação…"
      }
    >
      {report ? (
        <div className="space-y-[var(--ds-space-4)]">
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)]">
            <p className="text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
              <span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                Aviso:
              </span>{" "}
              este gate é diagnóstico. Mesmo com status verde, é obrigatória revisão humana de
              migrations, RLS, secrets, CORS, JWT e runbooks antes de produção.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
            <StatusBadge
              label={PRODUCTION_SAFETY_STATUS_LABELS[report.status]}
              variant={statusVariant(report.status)}
            />
            <StatusBadge label={environmentLabel} variant="neutral" />
            <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {PRODUCTION_SAFETY_STATUS_DESCRIPTIONS[report.status]}
            </span>
          </div>

          {report.passedChecks.length ? (
            <section>
              <h3 className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                Checks aprovados ({report.passedChecks.length})
              </h3>
              <ul className="mt-[var(--ds-space-2)] space-y-[var(--ds-space-2)]">
                {report.passedChecks.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-3)] py-[var(--ds-space-2)]"
                  >
                    <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
                      <StatusBadge
                        label={outcomeLabel(item.outcome)}
                        variant={outcomeVariant(item.outcome)}
                      />
                      <span className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                        {item.label}
                      </span>
                    </div>
                    <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                      {item.message}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {report.blockingChecks.length ? (
            <section>
              <h3 className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                Checks bloqueantes ({report.blockingChecks.length})
              </h3>
              <ul className="mt-[var(--ds-space-2)] space-y-[var(--ds-space-2)]">
                {report.blockingChecks.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)]"
                  >
                    <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
                      <StatusBadge label="Bloqueante" variant="development" />
                      <span className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                        {item.label}
                      </span>
                    </div>
                    <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                      {item.message}
                    </p>
                    {item.docPath ? (
                      <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                        Doc:{" "}
                        <code className="text-[length:var(--ds-font-size-xs)]">{item.docPath}</code>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {report.alertChecks.length ? (
            <section>
              <h3 className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                Alertas ({report.alertChecks.length})
              </h3>
              <ul className="mt-[var(--ds-space-2)] space-y-[var(--ds-space-2)]">
                {report.alertChecks.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)]"
                  >
                    <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
                      <StatusBadge
                        label={outcomeLabel(item.outcome)}
                        variant={outcomeVariant(item.outcome)}
                      />
                      <span className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                        {item.label}
                      </span>
                    </div>
                    <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                      {item.message}
                    </p>
                    {item.docPath ? (
                      <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                        Doc:{" "}
                        <code className="text-[length:var(--ds-font-size-xs)]">{item.docPath}</code>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {report.suggestedNextSteps.length ? (
            <section className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
              <h3 className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                Próximos passos
              </h3>
              <ol className="mt-[var(--ds-space-2)] list-decimal space-y-[var(--ds-space-2)] pl-[var(--ds-space-4)] text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
                {report.suggestedNextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Referência:{" "}
                <code>docs/operations/production-safety-gate.md</code>
              </p>
            </section>
          ) : null}

          <button
            type="button"
            onClick={() => void refreshGate()}
            disabled={isEvaluating}
            className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)] transition-colors hover:bg-[var(--ds-color-surface-muted)] disabled:opacity-60"
          >
            {isEvaluating ? "Avaliando…" : "Reexecutar gate (read-only)"}
          </button>
        </div>
      ) : (
        <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          Avalia readiness de staging/produção — Supabase, auth, RBAC, audit remoto e fila local.
          Nenhum dado sensível (email, UID, tokens ou keys) é exibido.
        </p>
      )}
    </WidgetFrame>
  );
}
