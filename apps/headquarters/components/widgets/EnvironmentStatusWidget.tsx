"use client";

import { PLATFORM_ENVIRONMENT_LABELS } from "@douglas/environment";
import { StatusBadge, type StatusBadgeVariant } from "@douglas/ui";
import { useEnvironmentStatus } from "@/features/platform-environment";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type EnvironmentStatusWidgetProps = WidgetStateProps;

function boolVariant(value: boolean, inverted = false): StatusBadgeVariant {
  const ok = inverted ? !value : value;
  return ok ? "available" : "development";
}

export function EnvironmentStatusWidget({
  isLoading: externalLoading,
  error: externalError,
}: EnvironmentStatusWidgetProps) {
  const { snapshot, environmentLabel } = useEnvironmentStatus();

  const isLoading = externalLoading ?? false;
  const error = externalError;

  return (
    <WidgetFrame
      title="Environment Status"
      description="Ambiente DOS — informações seguras, sem URLs ou secrets"
      isLoading={isLoading}
      error={error}
      footer={snapshot.readinessHint}
    >
      <div className="grid gap-[var(--ds-space-3)] sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Ambiente atual</span>
          <StatusBadge
            variant="neutral"
            label={`${PLATFORM_ENVIRONMENT_LABELS[snapshot.environment]} (${environmentLabel})`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Release channel</span>
          <StatusBadge variant="neutral" label={snapshot.releaseChannel} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Declarado explicitamente</span>
          <StatusBadge
            variant={boolVariant(snapshot.declaredExplicitly)}
            label={snapshot.declaredExplicitly ? "Sim" : "Default development"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Supabase configurado</span>
          <StatusBadge
            variant={boolVariant(snapshot.supabaseConfigured)}
            label={snapshot.supabaseConfigured ? "Sim" : "Não"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Mocks permitidos</span>
          <StatusBadge
            variant={boolVariant(snapshot.mocksAllowed)}
            label={snapshot.mocksAllowed ? "Sim" : "Bloqueados"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Mock role permitida</span>
          <StatusBadge
            variant={boolVariant(snapshot.mockRoleChangeAllowed)}
            label={snapshot.mockRoleChangeAllowed ? "Sim" : "Bloqueada"}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Validação de ambiente</span>
          <StatusBadge
            variant={boolVariant(snapshot.validationValid)}
            label={snapshot.validationValid ? "Compatível" : "Incompatível"}
          />
        </div>
      </div>

      {snapshot.alerts.length > 0 ? (
        <ul className="mt-[var(--ds-space-3)] space-y-1 text-sm text-[var(--ds-color-text-muted)]">
          {snapshot.alerts.map((alert) => (
            <li key={alert}>• {alert}</li>
          ))}
        </ul>
      ) : null}
    </WidgetFrame>
  );
}
