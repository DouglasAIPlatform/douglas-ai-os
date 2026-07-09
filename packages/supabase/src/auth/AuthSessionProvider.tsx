"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabase } from "../useSupabase";
import type { AuthAdapter } from "./AuthAdapter";
import type { AuthSignInCredentials } from "./AuthAdapter";
import {
  AuthSessionContext,
  DEFAULT_AUTH_SESSION_STATE,
  noopAuthSignOut,
  type AuthSessionContextValue,
} from "./AuthSessionContext";
import type { AuthSessionState } from "./AuthTypes";
import { resolveAuthMode } from "./resolveAuthMode";
import { createSupabaseAuthAdapter } from "./SupabaseAuthAdapter";

export interface AuthSessionProviderProps {
  children: ReactNode;
  /** Optional adapter override for tests or future providers. */
  adapter?: AuthAdapter | null;
}

function buildNotConfiguredState(): AuthSessionState {
  return {
    ...DEFAULT_AUTH_SESSION_STATE,
    status: "not_configured",
    mode: "mock",
    provider: "none",
  };
}

function buildLoadingState(
  config: ReturnType<typeof useSupabase>["config"],
): AuthSessionState {
  return {
    ...DEFAULT_AUTH_SESSION_STATE,
    status: "loading",
    mode: resolveAuthMode(config, "loading"),
    provider: "supabase",
  };
}

export function AuthSessionProvider({
  children,
  adapter: adapterOverride,
}: AuthSessionProviderProps) {
  const { config, client } = useSupabase();

  const adapter = useMemo(() => {
    if (adapterOverride !== undefined) {
      return adapterOverride;
    }
    return client ? createSupabaseAuthAdapter(client) : null;
  }, [adapterOverride, client]);

  const [session, setSession] = useState<AuthSessionState>(() =>
    config.isConfigured ? buildLoadingState(config) : buildNotConfiguredState(),
  );
  const [isLoading, setIsLoading] = useState(config.isConfigured);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const applySessionResult = useCallback(
    async (
      result: Awaited<ReturnType<AuthAdapter["getInitialSession"]>>,
      activeAdapter: AuthAdapter | null,
    ) => {
      if (!config.isConfigured || !activeAdapter) {
        setSession(buildNotConfiguredState());
        return;
      }

      if (result.error) {
        setSession({
          status: "error",
          mode: resolveAuthMode(config, "error"),
          provider: "supabase",
          user: null,
          profile: null,
          authRole: null,
          error: result.error,
        });
        return;
      }

      if (!result.user) {
        setSession({
          status: "unauthenticated",
          mode: resolveAuthMode(config, "unauthenticated"),
          provider: "supabase",
          user: null,
          profile: null,
          authRole: null,
          error: null,
        });
        return;
      }

      const profile = await activeAdapter.loadProfile(result.user.id);
      const authRole = profile?.role ?? result.authRole;

      setSession({
        status: "authenticated",
        mode: resolveAuthMode(config, "authenticated"),
        provider: "supabase",
        user: result.user,
        profile,
        authRole,
        error: null,
      });
    },
    [config],
  );

  const refreshSession = useCallback(async () => {
    if (!config.isConfigured || !adapter) {
      setSession(buildNotConfiguredState());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setSession((current) =>
      current.status === "not_configured" ? buildLoadingState(config) : current,
    );

    try {
      const result = await adapter.getInitialSession();
      await applySessionResult(result, adapter);
    } finally {
      setIsLoading(false);
    }
  }, [adapter, applySessionResult, config]);

  const signIn = useCallback(
    async (credentials: AuthSignInCredentials) => {
      if (!config.isConfigured || !adapter) {
        return { success: false, error: "Supabase auth não configurado" };
      }

      setIsSigningIn(true);
      try {
        const result = await adapter.signInWithPassword(credentials);
        if (!result.success) {
          return result;
        }

        const sessionResult = await adapter.getInitialSession();
        await applySessionResult(sessionResult, adapter);
        return result;
      } finally {
        setIsSigningIn(false);
      }
    },
    [adapter, applySessionResult, config.isConfigured],
  );

  const signOut = useCallback(async () => {
    if (!config.isConfigured || !adapter) {
      return noopAuthSignOut();
    }

    setIsSigningOut(true);
    try {
      const result = await adapter.signOut();
      if (!result.success) {
        return result;
      }

      await applySessionResult({ user: null, authRole: null }, adapter);
      return result;
    } finally {
      setIsSigningOut(false);
    }
  }, [adapter, applySessionResult, config.isConfigured]);

  useEffect(() => {
    if (!config.isConfigured || !adapter) {
      setSession(buildNotConfiguredState());
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      const result = await adapter.getInitialSession();
      if (cancelled) return;
      await applySessionResult(result, adapter);
      if (!cancelled) {
        setIsLoading(false);
      }
    })();

    const unsubscribe = adapter.subscribe((result) => {
      void applySessionResult(result, adapter);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [adapter, applySessionResult, config.isConfigured]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      ...session,
      isLoading,
      isSigningIn,
      isSigningOut,
      refreshSession,
      signIn,
      signOut,
    }),
    [isLoading, isSigningIn, isSigningOut, refreshSession, session, signIn, signOut],
  );

  return (
    <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
  );
}
