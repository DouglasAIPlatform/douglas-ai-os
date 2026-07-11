"use client";

import {
  evaluateStagingReadiness,
  STAGING_BOOTSTRAP_STATUS_LABELS,
  type StagingReadinessStatus,
} from "@douglas/environment";
import { useMemo } from "react";
import { useSupabase } from "@douglas/supabase";
import { useAuthOperatorBridge } from "@/features/platform-auth/useAuthOperatorBridge";
import { auditSupabaseConfig } from "@/features/platform-audit/config";
import { useEnvironmentStatus } from "./useEnvironmentStatus";

export function useStagingReadiness() {
  const { config: supabaseConfig } = useSupabase();
  const { authSession, bridge } = useAuthOperatorBridge();
  const { snapshot: envSnapshot } = useEnvironmentStatus();

  return useMemo(() => {
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
      },
    });

    const isDevelopment = report.snapshot.effectiveEnvironment === "development";

    const isStagingNotConfigured =
      isDevelopment && !report.snapshot.supabaseConfigured;

    return {
      report,
      configuration: report.snapshot,
      isDevelopment,
      isStagingNotConfigured,
      bootstrapLabel: STAGING_BOOTSTRAP_STATUS_LABELS[report.bootstrapStatus],
      status: report.status as StagingReadinessStatus,
      passedCount: report.passedChecks.length,
      pendingRuntimeCount: report.pendingRuntimeChecks.length,
      blockingCount: report.blockingChecks.length,
    };
  }, [
    authSession.status,
    bridge.isUsingMockOperator,
    bridge.profileStatus,
    envSnapshot.hasCriticalMismatch,
    supabaseConfig.isConfigured,
  ]);
}
