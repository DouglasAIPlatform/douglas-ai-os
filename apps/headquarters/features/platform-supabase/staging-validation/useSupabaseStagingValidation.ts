"use client";

import {
  DEFAULT_AUDIT_EDGE_FUNCTION_NAME,
  DEFAULT_SUPABASE_AUDIT_WRITE_MODE,
  useAudit,
} from "@douglas/audit";
import {
  DEFAULT_SUPABASE_CONNECTION_STATE,
  runSupabaseStagingValidation,
  useAuthSession,
  useSupabase,
  type SupabaseValidationReport,
} from "@douglas/supabase";
import { useCallback, useEffect, useState } from "react";
import { auditSupabaseConfig } from "@/features/platform-audit/config";
import { supabaseHealthCheckOptions } from "@/features/platform-supabase/config";

export function useSupabaseStagingValidation() {
  const { config, client, refreshHealthCheck } = useSupabase();
  const authSession = useAuthSession();
  const { persistenceStatus } = useAudit();
  const [report, setReport] = useState<SupabaseValidationReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const refreshValidation = useCallback(async () => {
    setIsValidating(true);
    setValidationError(null);
    try {
      const nextReport = await runSupabaseStagingValidation({
        config,
        client,
        connection: DEFAULT_SUPABASE_CONNECTION_STATE,
        healthCheckOptions: supabaseHealthCheckOptions,
        auth: {
          status: authSession.status,
          mode: authSession.mode,
          provider: authSession.provider,
          hasProfile: authSession.profile !== null,
          isLoading: authSession.isLoading,
        },
        audit: {
          supabaseConfigured: persistenceStatus.supabaseConfigured,
          supabaseTableReady: persistenceStatus.supabaseTableReady,
          supabaseWriteMode: persistenceStatus.supabaseWriteMode,
          fallbackUsed: persistenceStatus.fallbackUsed,
          edgeFunctionNotDeployed: persistenceStatus.edgeFunctionNotDeployed,
          lastError: persistenceStatus.lastError,
        },
        edge: {
          edgeFunctionName:
            auditSupabaseConfig.edgeFunctionName ?? DEFAULT_AUDIT_EDGE_FUNCTION_NAME,
          writeMode: auditSupabaseConfig.writeMode ?? DEFAULT_SUPABASE_AUDIT_WRITE_MODE,
        },
      });
      setReport(nextReport);
      void refreshHealthCheck();
    } catch (cause) {
      setValidationError(
        cause instanceof Error ? cause.message : "Falha ao executar validação staging",
      );
    } finally {
      setIsValidating(false);
    }
  }, [
    authSession.isLoading,
    authSession.mode,
    authSession.profile,
    authSession.provider,
    authSession.status,
    client,
    config,
    persistenceStatus.edgeFunctionNotDeployed,
    persistenceStatus.fallbackUsed,
    persistenceStatus.lastError,
    persistenceStatus.supabaseConfigured,
    persistenceStatus.supabaseTableReady,
    persistenceStatus.supabaseWriteMode,
    refreshHealthCheck,
  ]);

  useEffect(() => {
    // Bootstrap read-only report on mount (same pattern as SupabaseProvider health check).
    const timer = window.setTimeout(() => {
      void refreshValidation();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshValidation]);

  return {
    report,
    isValidating,
    validationError,
    refreshValidation,
  };
}
