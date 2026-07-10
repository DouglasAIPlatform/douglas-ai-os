"use client";

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
  const { snapshot, authHandoff } = useEnvironmentStatus();

  const isLoading = externalLoading ?? false;
  const error = externalError;

  return (
    <WidgetFrame
      title="Environment Status"
      description="Ambiente canônico DOS — fontes detectadas, sem URLs ou secrets"
      isLoading={isLoading}
      error={error}
      footer={snapshot.readinessHint}
    >
      <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)]">
        <p className="text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
          Fonte canônica:{" "}
          <code className="text-[length:var(--ds-font-size-xs)]">@douglas/environment</code>.
          VERCEL_ENV e SupabaseEnvironment são hints — não substituem{" "}
          <code className="text-[length:var(--ds-font-size-xs)]">NEXT_PUBLIC_DOS_ENVIRONMENT</code>.
        </p>
      </div>

      <div className="mt-[var(--ds-space-3)] grid gap-[var(--ds-space-3)] sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Ambiente canônico</span>
          <StatusBadge variant="neutral" label={snapshot.environmentLabel} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Ambiente efetivo</span>
          <StatusBadge variant="neutral" label={snapshot.effectiveEnvironment} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Release channel</span>
          <StatusBadge variant="neutral" label={snapshot.releaseChannel} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Divergência entre fontes</span>
          <StatusBadge
            variant={boolVariant(!snapshot.hasDivergence, true)}
            label={snapshot.hasDivergence ? "Sim" : "Não"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Declarado explicitamente</span>
          <StatusBadge
            variant={boolVariant(snapshot.declaredExplicitly)}
            label={snapshot.declaredExplicitly ? "Sim" : "Default development"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Production explícito</span>
          <StatusBadge
            variant={boolVariant(snapshot.productionExplicitlyDeclared)}
            label={snapshot.productionExplicitlyDeclared ? "Sim" : "Não"}
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
          <span className="text-xs text-[var(--ds-color-text-muted)]">Política aplicada</span>
          <StatusBadge
            variant={boolVariant(snapshot.validationValid)}
            label={
              snapshot.mocksAllowed
                ? "Development (mocks OK)"
                : `${snapshot.effectiveEnvironment} (sem mocks)`
            }
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Validação de ambiente</span>
          <StatusBadge
            variant={boolVariant(snapshot.validationValid)}
            label={snapshot.validationValid ? "Compatível" : "Incompatível"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Profile operacional</span>
          <StatusBadge
            variant={boolVariant(authHandoff.profileStatus === "active")}
            label={authHandoff.profileStatus ?? "Ausente"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Handoff RBAC</span>
          <StatusBadge variant="neutral" label={authHandoff.handoffState.replaceAll("_", " ")} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Bloqueio profile</span>
          <StatusBadge
            variant={boolVariant(!authHandoff.isBlockedByProfileStatus, true)}
            label={authHandoff.isBlockedByProfileStatus ? "Sim" : "Não"}
          />
        </div>
      </div>

      {snapshot.detectedSources.length > 0 ? (
        <section className="mt-[var(--ds-space-3)]">
          <h3 className="text-xs font-medium text-[var(--ds-color-text-primary)]">
            Fontes detectadas
          </h3>
          <ul className="mt-[var(--ds-space-2)] space-y-1 text-sm text-[var(--ds-color-text-muted)]">
            {snapshot.detectedSources.map((source) => (
              <li key={`${source.source}-${source.label}`}>
                • {source.label}: {source.rawValue ?? "—"}
                {source.mappedHint ? ` → hint ${source.mappedHint}` : ""}
                {source.role !== "canonical" ? ` (${source.role})` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {snapshot.hasCriticalMismatch ? (
        <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          Divergência crítica: alinhe Vercel/Supabase/DOS antes de promover ambiente.
        </p>
      ) : null}

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
