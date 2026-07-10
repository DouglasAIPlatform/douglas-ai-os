"use client";

import { StatusBadge, type StatusBadgeVariant } from "@douglas/ui";
import { useReleaseStatus } from "@/features/platform-release";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type ReleaseStatusWidgetProps = WidgetStateProps;

function boolVariant(value: boolean): StatusBadgeVariant {
  return value ? "available" : "development";
}

function runtimeReadinessLabel(
  status: string | undefined,
): { label: string; variant: StatusBadgeVariant } {
  switch (status) {
    case "ready_for_production_review":
      return { label: "Pronto para revisão", variant: "available" };
    case "ready_for_staging":
      return { label: "Staging OK", variant: "development" };
    case "blocked":
      return { label: "Bloqueado", variant: "development" };
    default:
      return { label: "Aguardando", variant: "neutral" };
  }
}

export function ReleaseStatusWidget({
  isLoading: externalLoading,
  error: externalError,
}: ReleaseStatusWidgetProps) {
  const {
    snapshot,
    channelLabel,
    releaseStatusLabel,
    runtimeReadiness,
    isEvaluatingRuntimeReadiness,
  } = useReleaseStatus();

  const isLoading = externalLoading ?? isEvaluatingRuntimeReadiness;
  const error = externalError;
  const runtimeBadge = runtimeReadinessLabel(runtimeReadiness?.status);

  return (
    <WidgetFrame
      title="Release Status"
      description="Versionamento SemVer — informações seguras, sem secrets"
      isLoading={isLoading}
      error={error}
      footer={snapshot.manualReleaseNotice}
    >
      <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)]">
        <p className="text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
          <span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
            Aviso:
          </span>{" "}
          release, tag Git, GitHub Release e deploy continuam manuais. Use{" "}
          <code className="text-[length:var(--ds-font-size-xs)]">pnpm release:prepare</code> na CLI.
        </p>
      </div>

      <div className="mt-[var(--ds-space-3)] grid gap-[var(--ds-space-3)] sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Versão atual</span>
          <StatusBadge variant="neutral" label={`v${snapshot.version}`} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Ambiente atual</span>
          <StatusBadge variant="neutral" label={snapshot.environmentLabel} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Release channel</span>
          <StatusBadge variant="neutral" label={channelLabel} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Status da release</span>
          <StatusBadge variant="neutral" label={releaseStatusLabel} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Consistência de versão</span>
          <StatusBadge
            variant={boolVariant(snapshot.versionConsistent)}
            label={snapshot.versionConsistent ? "Alinhada" : "Divergente"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Working copy</span>
          <StatusBadge variant="neutral" label="CLI only" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Readiness estático</span>
          <StatusBadge
            variant={boolVariant(snapshot.staticReadinessValid)}
            label={snapshot.staticReadinessValid ? "Compatível" : "Incompatível"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--ds-color-text-muted)]">Readiness runtime</span>
          <StatusBadge variant={runtimeBadge.variant} label={runtimeBadge.label} />
        </div>
      </div>

      <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
        {snapshot.workingCopyHint}
      </p>

      {snapshot.metadataSummary ? (
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          {snapshot.metadataSummary}
        </p>
      ) : null}

      {snapshot.alerts.length > 0 ? (
        <ul className="mt-[var(--ds-space-3)] space-y-1 text-sm text-[var(--ds-color-text-muted)]">
          {snapshot.alerts.map((alert) => (
            <li key={alert}>• {alert}</li>
          ))}
        </ul>
      ) : null}

      <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
        {snapshot.runtimeReadinessHint}
      </p>
    </WidgetFrame>
  );
}
