"use client";

import {
  evaluateStagingReadiness,
  STAGING_BOOTSTRAP_STATUS_LABELS,
  STAGING_TARGET_STATUS_LABELS,
  type StagingReadinessStatus,
  type StagingTriState,
} from "@douglas/environment";
import { useMemo } from "react";
import { useSupabase } from "@douglas/supabase";
import { useAuthOperatorBridge } from "@/features/platform-auth/useAuthOperatorBridge";
import { auditSupabaseConfig } from "@/features/platform-audit/config";
import { useEnvironmentStatus } from "./useEnvironmentStatus";
import { resolveMissionExecutionPersistenceMode as resolvePersistenceMode } from "@/features/mission-control/missionExecutionPersistenceConfig";
import { useMissionExecutionPersistenceAdapter } from "@/features/mission-control/MissionExecutionPersistenceContext";

function triStateLabel(value: StagingTriState): string {
  if (value === "unknown") {
    return "Desconhecido";
  }
  return value ? "Sim" : "Não";
}

export function useStagingReadiness() {
  const { config: supabaseConfig } = useSupabase();
  const { authSession, bridge } = useAuthOperatorBridge();
  const { snapshot: envSnapshot } = useEnvironmentStatus();
  const persistenceAdapter = useMissionExecutionPersistenceAdapter();

  return useMemo(() => {
    const persistenceHealth = persistenceAdapter?.getStatus?.();
    const missionPersistenceMode = resolvePersistenceMode(envSnapshot.effectiveEnvironment);

    const report = evaluateStagingReadiness({
      supabaseUrlConfigured: supabaseConfig.isConfigured,
      anonKeyConfigured: supabaseConfig.isConfigured,
      runtime: {
        auditWriteMode: auditSupabaseConfig.writeMode ?? null,
        userAuthenticated: authSession.status === "authenticated",
        hasActiveProfile: bridge.profileStatus === "active",
        isUsingMockOperator: bridge.isUsingMockOperator,
        hasCriticalMismatch: envSnapshot.hasCriticalMismatch,
        serverRbacExpected: true,
        migrationsSyncKnown: false,
        missionPersistenceMode,
        persistenceFallbackActive: persistenceHealth?.fallbackActive ?? undefined,
        remoteMissionPersistenceKnown: envSnapshot.effectiveEnvironment === "staging",
        remoteMissionPersistence:
          envSnapshot.effectiveEnvironment === "staging"
            ? persistenceHealth?.fallbackActive === false && supabaseConfig.isConfigured
            : undefined,
      },
    });

    const isDevelopment = report.snapshot.effectiveEnvironment === "development";

    const isStagingNotConfigured =
      isDevelopment && !report.snapshot.supabaseConfigured;

    return {
      report,
      configuration: report.snapshot,
      dimensions: report.dimensions,
      finalStatus: report.finalStatus,
      finalStatusLabel: report.finalStatusLabel,
      safetyChecks: report.safetyChecks ?? [],
      isDevelopment,
      isStagingNotConfigured,
      bootstrapLabel: STAGING_BOOTSTRAP_STATUS_LABELS[report.bootstrapStatus],
      targetStatusLabel: STAGING_TARGET_STATUS_LABELS[report.finalStatus],
      status: report.status as StagingReadinessStatus,
      passedCount: report.passedChecks.length,
      pendingRuntimeCount: report.pendingRuntimeChecks.length,
      blockingCount: report.blockingChecks.length,
      triStateLabel,
    };
  }, [
    authSession.status,
    bridge.isUsingMockOperator,
    bridge.profileStatus,
    envSnapshot.effectiveEnvironment,
    envSnapshot.hasCriticalMismatch,
    persistenceAdapter,
    supabaseConfig.isConfigured,
  ]);
}
