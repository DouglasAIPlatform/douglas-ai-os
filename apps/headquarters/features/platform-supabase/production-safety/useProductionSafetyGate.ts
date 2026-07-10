"use client";

import {
  DEFAULT_AUDIT_EDGE_FUNCTION_NAME,
  DEFAULT_SUPABASE_AUDIT_WRITE_MODE,
  useAudit,
} from "@douglas/audit";
import {
  DEFAULT_SUPABASE_CONNECTION_STATE,
  resolveSupabaseEnvironment,
  runProductionSafetyGate,
  useSupabase,
  type ProductionSafetyReport,
} from "@douglas/supabase";
import { useCallback, useEffect, useState } from "react";
import { useAuthOperatorBridge } from "@/features/platform-auth/useAuthOperatorBridge";
import { auditSupabaseConfig } from "@/features/platform-audit/config";
import { supabaseHealthCheckOptions } from "@/features/platform-supabase/config";

export function useProductionSafetyGate() {
  const { config, client, refreshHealthCheck } = useSupabase();
  const { authSession, bridge, operatorSource, mockRoleChangeAllowed } =
    useAuthOperatorBridge();
  const { persistenceStatus, ingestObservability } = useAudit();
  const [report, setReport] = useState<ProductionSafetyReport | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const refreshGate = useCallback(async () => {
    setIsEvaluating(true);
    setEvaluationError(null);
    try {
      const nextReport = await runProductionSafetyGate({
        config,
        client,
        connection: DEFAULT_SUPABASE_CONNECTION_STATE,
        healthCheckOptions: supabaseHealthCheckOptions,
        environment: resolveSupabaseEnvironment(),
        auth: {
          status: authSession.status,
          mode: authSession.mode,
          hasProfile: authSession.profile !== null,
          isLoading: authSession.isLoading,
          isUsingMockOperator: bridge.isUsingMockOperator,
          effectiveRole: bridge.effectiveRole,
          operatorSource,
          mockRoleChangeAllowed,
          profileRole: authSession.profile?.role ?? null,
          profileStatus: authSession.profile?.status ?? null,
        },
        audit: {
          supabaseConfigured: persistenceStatus.supabaseConfigured,
          supabaseTableReady: persistenceStatus.supabaseTableReady,
          supabaseWriteMode: persistenceStatus.supabaseWriteMode,
          fallbackUsed: persistenceStatus.fallbackUsed,
          edgeFunctionNotDeployed: persistenceStatus.edgeFunctionNotDeployed,
          lastError: persistenceStatus.lastError,
          lastRemoteStatus: persistenceStatus.lastRemoteStatus,
          lastRemoteErrorCode: persistenceStatus.lastRemoteErrorCode,
          pendingQueueTotal: persistenceStatus.pendingQueueStats?.total,
          pendingQueueFailed: persistenceStatus.pendingQueueStats?.failed,
          pendingQueueError: persistenceStatus.pendingQueueError,
          ingestTotalAttempts: ingestObservability.totalAttempts,
          ingestAccepted: ingestObservability.accepted,
          ingestRejected: ingestObservability.rejected,
          ingestFailed: ingestObservability.failed,
          ingestLastErrorCode: ingestObservability.lastErrorCode,
          ingestLastOutcome: ingestObservability.lastOutcome,
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
      setEvaluationError(
        cause instanceof Error ? cause.message : "Falha ao executar Production Safety Gate",
      );
    } finally {
      setIsEvaluating(false);
    }
  }, [
    authSession.isLoading,
    authSession.mode,
    authSession.profile,
    authSession.status,
    bridge.effectiveRole,
    bridge.isUsingMockOperator,
    client,
    config,
    mockRoleChangeAllowed,
    operatorSource,
    persistenceStatus,
    ingestObservability,
    refreshHealthCheck,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshGate();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshGate]);

  return {
    report,
    isEvaluating,
    evaluationError,
    refreshGate,
  };
}
