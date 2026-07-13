"use client";

import { StatusBadge, type StatusBadgeVariant } from "@douglas/ui";
import { useStagingReadiness } from "@/features/platform-environment/useStagingReadiness";
import type { StagingReadinessStatus, StagingTriState } from "@douglas/environment";
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

function triStateVariant(value: StagingTriState): StatusBadgeVariant {
  if (value === "unknown") {
    return "neutral";
  }
  return value ? "available" : "development";
}

export function StagingReadinessWidget({
  isLoading: externalLoading,
  error: externalError,
}: StagingReadinessWidgetProps) {
  const {
    report,
    configuration,
    dimensions,
    finalStatusLabel,
    isDevelopment,
    isStagingNotConfigured,
    bootstrapLabel,
    status,
    passedCount,
    pendingRuntimeCount,
    blockingCount,
    triStateLabel,
    safetyChecks,
  } = useStagingReadiness();

  if (isDevelopment && isStagingNotConfigured) {
    return (
      <WidgetFrame
        title="Staging Readiness"
        description="Bootstrap operacional para ambiente staging separado"
        isLoading={externalLoading}
        error={externalError}
        footer="Development local — staging remoto pendente (esperado)."
      >
        <p className="text-sm text-[var(--ds-color-text-muted)]">
          Staging remoto ainda não configurado. Development local continua funcional.
        </p>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          Codebase preparada: {dimensions.codebasePrepared ? "sim" : "não"}. Execute{" "}
          <code className="text-[length:var(--ds-font-size-xs)]">pnpm staging:bootstrap-plan</code>{" "}
          para o roteiro manual e{" "}
          <code className="text-[length:var(--ds-font-size-xs)]">pnpm staging:check</code>.
        </p>
      </WidgetFrame>
    );
  }

  return (
    <WidgetFrame
      title="Staging Readiness"
      description="Bootstrap staging — sem URLs, keys, refs ou tokens"
      isLoading={externalLoading}
      error={externalError}
      footer={`${passedCount} aprovados · ${pendingRuntimeCount} runtime pendente · ${blockingCount} bloqueantes · ${finalStatusLabel}`}
    >
      <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Status bootstrap</span>
          <StatusBadge variant={statusVariant(status)} label={finalStatusLabel} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Ambiente efetivo</span>
          <StatusBadge variant="neutral" label={configuration.effectiveEnvironment} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Codebase preparada</span>
          <StatusBadge
            variant={boolVariant(dimensions.codebasePrepared)}
            label={dimensions.codebasePrepared ? "Sim" : "Não"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Projeto remoto</span>
          <StatusBadge
            variant={triStateVariant(dimensions.remoteProjectConfigured)}
            label={triStateLabel(dimensions.remoteProjectConfigured)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Migrations</span>
          <StatusBadge
            variant={triStateVariant(dimensions.migrationsApplied)}
            label={
              dimensions.migrationsApplied === true
                ? "Aplicadas"
                : dimensions.migrationsApplied === false
                  ? "Pendentes"
                  : "Desconhecido"
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Edge Function</span>
          <StatusBadge
            variant={triStateVariant(dimensions.edgeFunctionAvailable)}
            label={triStateLabel(dimensions.edgeFunctionAvailable)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Persistência remota</span>
          <StatusBadge
            variant={triStateVariant(dimensions.remoteMissionPersistence)}
            label={triStateLabel(dimensions.remoteMissionPersistence)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Auth real</span>
          <StatusBadge
            variant={triStateVariant(dimensions.realAuthActive)}
            label={triStateLabel(dimensions.realAuthActive)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Profile ativo</span>
          <StatusBadge
            variant={triStateVariant(dimensions.activeProfilePresent)}
            label={triStateLabel(dimensions.activeProfilePresent)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Fallback persistência</span>
          <StatusBadge
            variant={triStateVariant(dimensions.persistenceFallbackActive)}
            label={
              dimensions.persistenceFallbackActive === "unknown"
                ? "Desconhecido"
                : dimensions.persistenceFallbackActive
                  ? "Ativo"
                  : "Inativo"
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Bootstrap legacy</span>
          <StatusBadge variant="neutral" label={bootstrapLabel} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Runtime validado</span>
          <StatusBadge
            variant={boolVariant(dimensions.runtimeValidated)}
            label={dimensions.runtimeValidated ? "Sim" : "Não"}
          />
        </div>
      </div>

      {safetyChecks.length > 0 ? (
        <section className="mt-[var(--ds-space-3)]">
          <h3 className="text-xs font-medium text-[var(--ds-color-text-primary)]">Safety gate</h3>
          <ul className="mt-[var(--ds-space-2)] space-y-1 text-sm text-[var(--ds-color-text-muted)]">
            {safetyChecks.slice(0, 6).map((item) => (
              <li key={item.id}>
                • {item.label}: {item.outcome === "pass" ? "OK" : item.outcome === "pending" ? "pendente" : "falhou"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
            {report.nextSteps.slice(0, 5).map((step) => (
              <li key={step}>• {step}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </WidgetFrame>
  );
}
