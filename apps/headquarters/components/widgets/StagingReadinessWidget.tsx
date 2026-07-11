"use client";

import { StatusBadge, type StatusBadgeVariant } from "@douglas/ui";
import { useStagingReadiness } from "@/features/platform-environment/useStagingReadiness";
import type { StagingReadinessStatus } from "@douglas/environment";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type StagingReadinessWidgetProps = WidgetStateProps;

function statusVariant(status: StagingReadinessStatus): StatusBadgeVariant {
  switch (status) {
    case "passed":
      return "available";
    case "passed_with_runtime_checks_pending":
      return "development";
    default:
      return "development";
  }
}

function boolVariant(value: boolean, inverted = false): StatusBadgeVariant {
  const ok = inverted ? !value : value;
  return ok ? "available" : "development";
}

export function StagingReadinessWidget({
  isLoading: externalLoading,
  error: externalError,
}: StagingReadinessWidgetProps) {
  const {
    report,
    configuration,
    isDevelopment,
    isStagingNotConfigured,
    bootstrapLabel,
    status,
    passedCount,
    pendingRuntimeCount,
    blockingCount,
  } = useStagingReadiness();

  if (isDevelopment && isStagingNotConfigured) {
    return (
      <WidgetFrame
        title="Staging Readiness"
        description="Bootstrap operacional para ambiente staging separado"
        isLoading={externalLoading}
        error={externalError}
        footer="Development local — staging ainda não configurado (esperado)."
      >
        <p className="text-sm text-[var(--ds-color-text-muted)]">
          Staging ainda não configurado. Isso é normal em development local.
        </p>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          Para preparar staging: defina{" "}
          <code className="text-[length:var(--ds-font-size-xs)]">NEXT_PUBLIC_DOS_ENVIRONMENT=staging</code>{" "}
          e use um projeto Supabase dedicado. Execute{" "}
          <code className="text-[length:var(--ds-font-size-xs)]">pnpm staging:check</code>.
        </p>
      </WidgetFrame>
    );
  }

  return (
    <WidgetFrame
      title="Staging Readiness"
      description="Bootstrap staging — dados seguros, sem URLs, keys ou tokens"
      isLoading={externalLoading}
      error={externalError}
      footer={`${passedCount} aprovados · ${pendingRuntimeCount} runtime pendente · ${blockingCount} bloqueantes`}
    >
      <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Ambiente efetivo</span>
          <StatusBadge variant="neutral" label={configuration.effectiveEnvironment} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Bootstrap status</span>
          <StatusBadge variant="neutral" label={bootstrapLabel} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Readiness</span>
          <StatusBadge variant={statusVariant(status)} label={status.replaceAll("_", " ")} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Supabase configurado</span>
          <StatusBadge
            variant={boolVariant(configuration.supabaseConfigured)}
            label={configuration.supabaseConfigured ? "Sim" : "Não"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Mocks bloqueados</span>
          <StatusBadge
            variant={boolVariant(configuration.mocksBlocked)}
            label={configuration.mocksBlocked ? "Sim" : "Não"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Auth real exigido</span>
          <StatusBadge
            variant={boolVariant(configuration.realAuthRequired)}
            label={configuration.realAuthRequired ? "Sim" : "Não"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Audit Edge Function</span>
          <StatusBadge
            variant={boolVariant(configuration.auditWriteModeEdgeFunction)}
            label={configuration.auditWriteModeEdgeFunction ? "Sim" : "Não"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">RBAC server-side</span>
          <StatusBadge
            variant={boolVariant(configuration.serverRbacExpected)}
            label={configuration.serverRbacExpected ? "Esperado" : "Não"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Migrations sync</span>
          <StatusBadge
            variant="neutral"
            label={configuration.migrationsSyncKnown ? "Sincronizadas" : "Desconhecido"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Checks aprovados</span>
          <StatusBadge variant="neutral" label={String(passedCount)} />
        </div>
      </div>

      {report.alerts.length > 0 ? (
        <section className="mt-[var(--ds-space-3)]">
          <h3 className="text-xs font-medium text-[var(--ds-color-text-primary)]">Alertas</h3>
          <ul className="mt-[var(--ds-space-2)] space-y-1 text-sm text-[var(--ds-color-text-muted)]">
            {report.alerts.map((alert) => (
              <li key={alert}>• {alert}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.blockers.length > 0 ? (
        <section className="mt-[var(--ds-space-3)]">
          <h3 className="text-xs font-medium text-[var(--ds-color-text-primary)]">Bloqueios</h3>
          <ul className="mt-[var(--ds-space-2)] space-y-1 text-sm text-[var(--ds-color-text-muted)]">
            {report.blockers.slice(0, 5).map((blocker) => (
              <li key={blocker}>• {blocker}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.nextSteps.length > 0 ? (
        <section className="mt-[var(--ds-space-3)]">
          <h3 className="text-xs font-medium text-[var(--ds-color-text-primary)]">Próximos passos</h3>
          <ul className="mt-[var(--ds-space-2)] space-y-1 text-sm text-[var(--ds-color-text-muted)]">
            {report.nextSteps.slice(0, 4).map((step) => (
              <li key={step}>• {step}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </WidgetFrame>
  );
}
