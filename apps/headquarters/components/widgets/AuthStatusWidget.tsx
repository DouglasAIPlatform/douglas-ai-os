"use client";

import {
  AUTH_OPERATOR_HANDOFF_STATE_LABELS,
  AUTH_MODE_LABELS,
  AUTH_PROVIDER_LABELS,
  AUTH_STATUS_LABELS,
  HANDOFF_TRANSITION_REASON_LABELS,
  OPERATOR_ROLE_SOURCE_LABELS,
} from "@douglas/supabase";
import { OPERATOR_ROLE_LABELS } from "@douglas/security";
import { StatusBadge, type StatusBadgeVariant } from "@douglas/ui";
import Link from "next/link";
import {
  AuthModeBadge,
  LogoutButton,
  useAuthOperatorBridge,
  useHandoffEventBridge,
} from "@/features/platform-auth";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type AuthStatusWidgetProps = WidgetStateProps;

function statusVariant(
  status: ReturnType<typeof useAuthOperatorBridge>["authSession"]["status"],
): StatusBadgeVariant {
  switch (status) {
    case "authenticated":
      return "available";
    case "unauthenticated":
      return "development";
    case "error":
      return "development";
    default:
      return "neutral";
  }
}

function handoffVariant(
  handoffState: ReturnType<typeof useAuthOperatorBridge>["bridge"]["handoffState"],
): StatusBadgeVariant {
  switch (handoffState) {
    case "authenticated_with_profile":
      return "available";
    case "authenticated_without_profile":
    case "profile_error":
      return "development";
    default:
      return "neutral";
  }
}

export function AuthStatusWidget({
  isLoading: externalLoading,
  error: externalError,
}: AuthStatusWidgetProps) {
  const { authSession, bridge, operator, operatorSource } = useAuthOperatorBridge();
  const { lastRelevantTransition } = useHandoffEventBridge();

  const isLoading = externalLoading ?? authSession.isLoading;
  const error = externalError ?? authSession.error;

  return (
    <WidgetFrame
      title="Auth → Operator Handoff"
      description="Sessão Supabase + operador efetivo derivado de operator_profiles quando disponível"
      isLoading={isLoading}
      error={error}
      footer={
        bridge.isUsingMockOperator
          ? `RBAC efetivo: ${OPERATOR_ROLE_SOURCE_LABELS[operatorSource]} · auth: ${AUTH_STATUS_LABELS[authSession.status]}`
          : `RBAC efetivo: ${OPERATOR_ROLE_SOURCE_LABELS[operatorSource]} · profile ativo`
      }
    >
      <div className="space-y-[var(--ds-space-4)]">
        <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
          <AuthModeBadge />
          <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Provider: {AUTH_PROVIDER_LABELS[authSession.provider]}
          </span>
        </div>

        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
          <dl className="grid gap-[var(--ds-space-3)] sm:grid-cols-2">
            <div>
              <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Status auth
              </dt>
              <dd>
                <StatusBadge
                  label={AUTH_STATUS_LABELS[authSession.status]}
                  variant={statusVariant(authSession.status)}
                />
              </dd>
            </div>
            <div>
              <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Handoff state
              </dt>
              <dd>
                <StatusBadge
                  label={AUTH_OPERATOR_HANDOFF_STATE_LABELS[bridge.handoffState]}
                  variant={handoffVariant(bridge.handoffState)}
                />
              </dd>
            </div>
            <div>
              <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Modo auth
              </dt>
              <dd className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)]">
                {AUTH_MODE_LABELS[authSession.mode]}
              </dd>
            </div>
            <div>
              <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Profile status
              </dt>
              <dd className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)]">
                {authSession.profile
                  ? `${authSession.profile.displayName} · ${authSession.profile.status}`
                  : authSession.status === "authenticated"
                    ? "Sem operator_profiles"
                    : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Operador efetivo
              </dt>
              <dd className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                {operator.name} ({operator.id})
              </dd>
            </div>
            <div>
              <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Role efetiva (RBAC)
              </dt>
              <dd className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                {OPERATOR_ROLE_LABELS[bridge.effectiveRole]}
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
            <div className="sm:col-span-2">
              <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Usuário autenticado
              </dt>
              <dd className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)]">
                {authSession.user?.email ?? "—"}
              </dd>
            </div>
            {bridge.authProfileRole ? (
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Role do profile
                </dt>
                <dd className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)]">
                  {OPERATOR_ROLE_LABELS[bridge.authProfileRole]}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        {lastRelevantTransition ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)]">
            <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              Último handoff relevante
            </p>
            <dl className="mt-[var(--ds-space-2)] grid gap-[var(--ds-space-2)] sm:grid-cols-2">
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Estado anterior
                </dt>
                <dd className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                  {AUTH_OPERATOR_HANDOFF_STATE_LABELS[lastRelevantTransition.previous.handoffState]}
                </dd>
              </div>
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Estado atual
                </dt>
                <dd className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                  {AUTH_OPERATOR_HANDOFF_STATE_LABELS[lastRelevantTransition.current.handoffState]}
                </dd>
              </div>
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Timestamp
                </dt>
                <dd className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                  {new Date(lastRelevantTransition.timestamp).toLocaleString("pt-BR")}
                </dd>
              </div>
              <div>
                <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  Motivo
                </dt>
                <dd className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                  {lastRelevantTransition.reasons
                    .map((reason) => HANDOFF_TRANSITION_REASON_LABELS[reason])
                    .join(" · ")}
                </dd>
              </div>
            </dl>
            {lastRelevantTransition.message ? (
              <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                {lastRelevantTransition.message}
              </p>
            ) : null}
          </div>
        ) : null}

        {bridge.showAuthMockWarning ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)]">
            <p className="text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
              <span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                Aviso handoff:
              </span>{" "}
              sessão autenticada, mas RBAC ainda usa operador mock ({operator.id}). Crie um
              registro em{" "}
              <code className="text-[length:var(--ds-font-size-xs)]">operator_profiles</code>{" "}
              para ativar permissões reais.
            </p>
          </div>
        ) : null}

        {authSession.status === "unauthenticated" ? (
          <p className="text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
            Supabase configurado sem sessão —{" "}
            <Link href="/login" className="font-[var(--ds-font-weight-medium)] underline">
              fazer login
            </Link>
            . Modo dev/mock continua disponível.
          </p>
        ) : null}

        {authSession.status === "not_configured" ? (
          <p className="text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
            Sem variáveis Supabase — auth em modo{" "}
            <span className="font-[var(--ds-font-weight-medium)]">mock</span>.{" "}
            <Link href="/login" className="underline">
              /login
            </Link>{" "}
            exibe aviso de configuração.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-[var(--ds-space-2)]">
          {authSession.status === "authenticated" ? <LogoutButton /> : null}
          {authSession.provider === "supabase" ? (
            <button
              type="button"
              onClick={() => void authSession.refreshSession()}
              disabled={authSession.isLoading}
              className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)] transition-colors hover:bg-[var(--ds-color-surface-muted)] disabled:opacity-60"
            >
              {authSession.isLoading ? "Atualizando…" : "Atualizar sessão"}
            </button>
          ) : null}
        </div>
      </div>
    </WidgetFrame>
  );
}
