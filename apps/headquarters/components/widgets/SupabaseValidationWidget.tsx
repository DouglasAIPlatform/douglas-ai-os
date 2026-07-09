"use client";

import {
  SUPABASE_READINESS_STATUS_DESCRIPTIONS,
  SUPABASE_READINESS_STATUS_LABELS,
} from "@douglas/supabase";
import { StatusBadge, type StatusBadgeVariant } from "@douglas/ui";
import { useSupabaseStagingValidation } from "@/features/platform-supabase/staging-validation";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type SupabaseValidationWidgetProps = WidgetStateProps;

function readinessVariant(
  status: NonNullable<
    ReturnType<typeof useSupabaseStagingValidation>["report"]
  >["readinessStatus"],
): StatusBadgeVariant {
  switch (status) {
    case "ready_for_auth":
      return "available";
    case "ready_for_migration":
    case "partially_configured":
      return "development";
    case "error":
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

export function SupabaseValidationWidget({
  isLoading: externalLoading,
  error: externalError,
}: SupabaseValidationWidgetProps) {
  const { report, isValidating, validationError, refreshValidation } =
    useSupabaseStagingValidation();

  const isLoading = externalLoading ?? isValidating;
  const error = externalError ?? validationError;

  return (
    <WidgetFrame
      title="Supabase Staging Validation"
      description="Console read-only — nenhuma migration, insert ou deploy é executado daqui"
      isLoading={isLoading}
      error={error}
      footer={
        report
          ? `${report.passedChecks.length} checks OK · ${report.alertChecks.length} alertas · ${new Date(report.checkedAt).toLocaleString("pt-BR")}`
          : "Aguardando primeira validação…"
      }
    >
      {report ? (
        <div className="space-y-[var(--ds-space-4)]">
          <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
            <StatusBadge
              label={SUPABASE_READINESS_STATUS_LABELS[report.readinessStatus]}
              variant={readinessVariant(report.readinessStatus)}
            />
            <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {SUPABASE_READINESS_STATUS_DESCRIPTIONS[report.readinessStatus]}
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

          {report.alertChecks.length ? (
            <section>
              <h3 className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                Checks com alerta ({report.alertChecks.length})
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
                Próximos passos sugeridos
              </h3>
              <ol className="mt-[var(--ds-space-2)] list-decimal space-y-[var(--ds-space-2)] pl-[var(--ds-space-4)] text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
                {report.suggestedNextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Referências:{" "}
                <code>docs/operations/supabase-staging-validation.md</code> ·{" "}
                <code>docs/operations/apply-supabase-migrations.md</code> ·{" "}
                <code>docs/operations/supabase-migration-checklist.md</code>
              </p>
            </section>
          ) : null}

          <button
            type="button"
            onClick={() => void refreshValidation()}
            disabled={isValidating}
            className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)] transition-colors hover:bg-[var(--ds-color-surface-muted)] disabled:opacity-60"
          >
            {isValidating ? "Validando…" : "Reexecutar validação (read-only)"}
          </button>
        </div>
      ) : (
        <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          Console de staging — verifica conexão, auth, tabelas e adapters sem alterar dados.
        </p>
      )}
    </WidgetFrame>
  );
}
