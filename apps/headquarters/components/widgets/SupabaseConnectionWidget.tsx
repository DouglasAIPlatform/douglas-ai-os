"use client";

import {
  SUPABASE_CONNECTION_STATUS_LABELS,
  SUPABASE_ENVIRONMENT_LABELS,
  useSupabase,
} from "@douglas/supabase";
import { StatusBadge, type StatusBadgeVariant } from "@douglas/ui";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type SupabaseConnectionWidgetProps = WidgetStateProps;

function statusVariant(
  status: ReturnType<typeof useSupabase>["connection"]["status"],
): StatusBadgeVariant {
  switch (status) {
    case "connected":
      return "available";
    case "configured":
      return "development";
    default:
      return "neutral";
  }
}

export function SupabaseConnectionWidget({
  isLoading: externalLoading,
  error: externalError,
}: SupabaseConnectionWidgetProps) {
  const { config, connection, isChecking, refreshHealthCheck } = useSupabase();

  const isLoading = externalLoading ?? isChecking;
  const error = externalError ?? connection.error;

  return (
    <WidgetFrame
      title="Supabase Foundation"
      description="Status técnico da fundação Supabase (sem autenticação real nesta fase)"
      isLoading={isLoading}
      error={error}
      footer={
        config.isConfigured
          ? `Ambiente: ${SUPABASE_ENVIRONMENT_LABELS[config.environment]} · Auth real: desligado`
          : "Foundation preparada — configure variáveis para testar conexão"
      }
    >
      <div className="space-y-[var(--ds-space-4)]">
        <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
          <StatusBadge
            label={SUPABASE_CONNECTION_STATUS_LABELS[connection.status]}
            variant={statusVariant(connection.status)}
          />
          <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            {SUPABASE_ENVIRONMENT_LABELS[config.environment]}
          </span>
        </div>

        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
          <p className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)]">
            {connection.message}
          </p>
          {connection.lastCheckedAt ? (
            <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Última verificação:{" "}
              {new Date(connection.lastCheckedAt).toLocaleString("pt-BR")}
            </p>
          ) : null}
        </div>

        {connection.status === "not_configured" ? (
          <p className="text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
            Copie <span className="font-[var(--ds-font-weight-medium)]">.env.example</span>{" "}
            para <span className="font-[var(--ds-font-weight-medium)]">.env.local</span>{" "}
            e adicione URL + anon key do projeto Supabase. A plataforma funciona normalmente
            sem essas variáveis.
          </p>
        ) : null}

        {config.isConfigured ? (
          <button
            type="button"
            onClick={() => void refreshHealthCheck()}
            disabled={isChecking}
            className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)] transition-colors hover:bg-[var(--ds-color-surface-muted)] disabled:opacity-60"
          >
            {isChecking ? "Verificando…" : "Reverificar conexão"}
          </button>
        ) : null}
      </div>
    </WidgetFrame>
  );
}
