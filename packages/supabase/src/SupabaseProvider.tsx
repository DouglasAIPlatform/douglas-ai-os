"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseConfig } from "./SupabaseConfig";
import { DEFAULT_SUPABASE_CONFIG, resolveSupabaseConfig } from "./SupabaseConfig";
import { createSupabaseBrowserClient } from "./SupabaseClientFactory";
import { SupabaseContext } from "./SupabaseContext";
import type { SupabaseConnectionState } from "./SupabaseConnectionStatus";
import { DEFAULT_SUPABASE_CONNECTION_STATE } from "./SupabaseConnectionStatus";
import { runSupabaseHealthCheck, type SupabaseHealthCheckOptions } from "./SupabaseHealthCheck";

export interface SupabaseProviderProps {
  children: ReactNode;
  config?: SupabaseConfig;
  healthCheckOptions?: SupabaseHealthCheckOptions;
}

export function SupabaseProvider({
  children,
  config = DEFAULT_SUPABASE_CONFIG,
  healthCheckOptions,
}: SupabaseProviderProps) {
  const resolvedConfig = useMemo(
    () => (config === DEFAULT_SUPABASE_CONFIG ? resolveSupabaseConfig() : config),
    [config],
  );

  const client = useMemo(
    () => createSupabaseBrowserClient(resolvedConfig),
    [resolvedConfig],
  );

  const [connection, setConnection] = useState<SupabaseConnectionState>(
    DEFAULT_SUPABASE_CONNECTION_STATE,
  );
  const [isChecking, setIsChecking] = useState(false);

  const refreshHealthCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const next = await runSupabaseHealthCheck(client, resolvedConfig, healthCheckOptions);
      setConnection(next);
    } finally {
      setIsChecking(false);
    }
  }, [client, healthCheckOptions, resolvedConfig]);

  useEffect(() => {
    void refreshHealthCheck();
  }, [refreshHealthCheck]);

  const value = useMemo(
    () => ({
      config: resolvedConfig,
      client,
      connection,
      isChecking,
      refreshHealthCheck,
    }),
    [client, connection, isChecking, refreshHealthCheck, resolvedConfig],
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}
