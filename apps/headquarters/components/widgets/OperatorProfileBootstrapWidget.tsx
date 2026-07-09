"use client";

import {
  OPERATOR_PROFILE_BOOTSTRAP_STATUS_DESCRIPTIONS,
  OPERATOR_PROFILE_BOOTSTRAP_STATUS_LABELS,
  OPERATOR_ROLE_SOURCE_LABELS,
} from "@douglas/supabase";
import { OPERATOR_ROLE_LABELS } from "@douglas/security";
import { StatusBadge, type StatusBadgeVariant } from "@douglas/ui";
import Link from "next/link";
import { useOperatorProfileBootstrap } from "@/features/platform-auth/useOperatorProfileBootstrap";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type OperatorProfileBootstrapWidgetProps = WidgetStateProps;

function statusVariant(
  status: NonNullable<
    ReturnType<typeof useOperatorProfileBootstrap>["report"]
  >["status"],
): StatusBadgeVariant {
  switch (status) {
    case "profile_found":
      return "available";
    case "bootstrap_blocked_by_rls":
    case "bootstrap_required":
    case "profile_missing":
      return "development";
    case "not_authenticated":
      return "neutral";
    default:
      return "neutral";
  }
}

export function OperatorProfileBootstrapWidget({
  isLoading: externalLoading,
  error: externalError,
}: OperatorProfileBootstrapWidgetProps) {
  const {
    report,
    requestResult,
    isChecking,
    authSession,
    bridge,
    operator,
    operatorSource,
    refreshBootstrap,
    requestBootstrap,
  } = useOperatorProfileBootstrap();

  const isLoading = externalLoading ?? isChecking;
  const error = externalError ?? null;

  return (
    <WidgetFrame
      title="Operator Profile Bootstrap"
      description="Orientação segura para o primeiro operator_profiles — sem INSERT automático pelo browser"
      isLoading={isLoading}
      error={error}
      footer={
        report
          ? `Status: ${OPERATOR_PROFILE_BOOTSTRAP_STATUS_LABELS[report.status]} · verificado ${new Date(report.checkedAt).toLocaleString("pt-BR")}`
          : undefined
      }
    >
      {report ? (
        <div className="space-y-[var(--ds-space-4)]">
          <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
            <StatusBadge
              label={OPERATOR_PROFILE_BOOTSTRAP_STATUS_LABELS[report.status]}
              variant={statusVariant(report.status)}
            />
            <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {OPERATOR_PROFILE_BOOTSTRAP_STATUS_DESCRIPTIONS[report.status]}
            </span>
          </div>

          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
            <dl className="grid gap-[var(--ds-space-3)] sm:grid-cols-2">
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Usuário autenticado
                </dt>
                <dd className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)]">
                  {authSession.user?.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  operator_profiles
                </dt>
                <dd className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)]">
                  {report.hasOperatorProfile ? "Encontrado" : "Ausente"}
                  {report.tableDetected === false ? " · tabela não detectada" : null}
                  {report.tableDetected === true && !report.hasOperatorProfile
                    ? " · tabela OK"
                    : null}
                </dd>
              </div>
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Role efetiva (RBAC)
                </dt>
                <dd className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                  {OPERATOR_ROLE_LABELS[bridge.effectiveRole]} · {operator.name}
                </dd>
              </div>
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Fonte da role
                </dt>
                <dd className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)]">
                  {OPERATOR_ROLE_SOURCE_LABELS[operatorSource]}
                </dd>
              </div>
            </dl>
          </div>

          {report.usingMockFallback ? (
            <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)]">
              <p className="text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
                <span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                  Aviso fallback mock:
                </span>{" "}
                RBAC efetivo ainda usa operador mock ({operator.id}) até existir
                operator_profiles para este usuário.
              </p>
            </div>
          ) : null}

          <section className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
            <h3 className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              {report.recommendation.title}
            </h3>
            <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {report.recommendation.summary}
            </p>
            <ol className="mt-[var(--ds-space-3)] list-decimal space-y-[var(--ds-space-2)] pl-[var(--ds-space-4)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {report.recommendation.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {report.recommendation.manualSqlHint ? (
              <pre className="mt-[var(--ds-space-3)] overflow-x-auto rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                {report.recommendation.manualSqlHint}
              </pre>
            ) : null}
            <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Docs:{" "}
              {report.recommendation.docPaths.map((path) => (
                <code key={path} className="mr-[var(--ds-space-2)]">
                  {path}
                </code>
              ))}
            </p>
          </section>

          {requestResult ? (
            <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {requestResult.requestMessage}
            </p>
          ) : null}

          {authSession.status === "unauthenticated" ? (
            <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              <Link href="/login" className="underline">
                Fazer login
              </Link>{" "}
              para verificar bootstrap do profile.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-[var(--ds-space-2)]">
            <button
              type="button"
              onClick={() => void refreshBootstrap()}
              disabled={isChecking}
              className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)] transition-colors hover:bg-[var(--ds-color-surface-muted)] disabled:opacity-60"
            >
              {isChecking ? "Verificando…" : "Reverificar profile"}
            </button>
            <button
              type="button"
              onClick={() => void requestBootstrap()}
              disabled={isChecking || report.status === "profile_found"}
              className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)] transition-colors hover:bg-[var(--ds-color-surface-muted)] disabled:opacity-60"
            >
              Solicitar orientação de bootstrap
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          Verificando status de operator_profiles…
        </p>
      )}
    </WidgetFrame>
  );
}
