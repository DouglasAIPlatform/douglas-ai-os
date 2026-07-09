"use client";

import { useAuthSession } from "@douglas/supabase";
import { OPERATOR_ROLE_LABELS } from "@douglas/security";
import { useAuthOperatorBridge } from "@/features/platform-auth/useAuthOperatorBridge";
import { AuthModeBadge } from "./AuthModeBadge";
import { LoginForm } from "./LoginForm";
import { LogoutButton } from "./LogoutButton";

export function AuthPanel() {
  const authSession = useAuthSession();
  const { bridge, operator } = useAuthOperatorBridge();

  return (
    <div className="space-y-[var(--ds-space-4)]">
      <AuthModeBadge />

      <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
        <dl className="grid gap-[var(--ds-space-3)]">
          <div>
            <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Email
            </dt>
            <dd className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)]">
              {authSession.user?.email ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Role efetiva (mock RBAC)
            </dt>
            <dd className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              {OPERATOR_ROLE_LABELS[bridge.effectiveRole]} · {operator.name}
            </dd>
          </div>
        </dl>
      </div>

      {authSession.status === "authenticated" ? (
        <div className="space-y-[var(--ds-space-3)]">
          <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Sessão Supabase ativa. OperatorProvider mock ainda governa permissões.
          </p>
          <LogoutButton />
        </div>
      ) : (
        <LoginForm />
      )}
    </div>
  );
}
