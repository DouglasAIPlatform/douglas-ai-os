"use client";

import { useAuthSession } from "@douglas/supabase";
import { Button } from "@douglas/ui";
import { FormEvent, useState } from "react";

export interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { signIn, isSigningIn, status } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (status === "not_configured") {
    return (
      <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
        <p className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)]">
          Supabase não configurado
        </p>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
          Copie <span className="font-[var(--ds-font-weight-medium)]">.env.example</span> para{" "}
          <span className="font-[var(--ds-font-weight-medium)]">.env.local</span> e adicione URL +
          anon key. A plataforma continua em modo mock sem essas variáveis.
        </p>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <p className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
        Você já está autenticado.
      </p>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Informe email e senha.");
      return;
    }

    const result = await signIn({ email: trimmedEmail, password });
    if (!result.success) {
      setError(result.error ?? "Falha ao entrar");
      return;
    }

    setPassword("");
    onSuccess?.();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-[var(--ds-space-4)]">
      <div className="space-y-[var(--ds-space-2)]">
        <label
          htmlFor="login-email"
          className="block text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-muted)]"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSigningIn}
          className="w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)] outline-none focus-visible:shadow-[var(--ds-shadow-focus)]"
          placeholder="operador@empresa.com"
        />
      </div>

      <div className="space-y-[var(--ds-space-2)]">
        <label
          htmlFor="login-password"
          className="block text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-muted)]"
        >
          Senha
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSigningIn}
          className="w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)] outline-none focus-visible:shadow-[var(--ds-shadow-focus)]"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSigningIn} className="w-full">
        {isSigningIn ? "Entrando…" : "Entrar"}
      </Button>

      <p className="text-[length:var(--ds-font-size-xs)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
        RBAC efetivo permanece no OperatorProvider mock nesta fase — login prepara auth real
        sem substituir permissões ainda.
      </p>
    </form>
  );
}
