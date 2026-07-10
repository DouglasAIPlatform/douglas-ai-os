"use client";

import {
  RELEASE_CHANNEL_LABELS,
  RELEASE_STATUS_LABELS,
  resolveEmbeddedReleaseManifest,
  buildReleaseStatusSnapshot,
} from "@douglas/release";
import {
  PLATFORM_ENVIRONMENT_LABELS,
  validateEnvironmentConfig,
  resolveEnvironmentConfig,
} from "@douglas/environment";
import { useMemo } from "react";
import { useSupabase } from "@douglas/supabase";
import { platformVersion } from "@/lib/mock-data";
import { useProductionSafetyGate } from "@/features/platform-supabase/production-safety";
import { useAuthOperatorBridge } from "@/features/platform-auth/useAuthOperatorBridge";
import { auditSupabaseConfig } from "@/features/platform-audit/config";

export function useReleaseStatus() {
  const { config: supabaseConfig } = useSupabase();
  const { authSession, bridge, mockRoleChangeAllowed } = useAuthOperatorBridge();
  const { report: runtimeReadiness, isEvaluating } = useProductionSafetyGate();

  return useMemo(() => {
    const manifest = resolveEmbeddedReleaseManifest();
    const envConfig = resolveEnvironmentConfig();
    const envValidation = validateEnvironmentConfig(envConfig, {
      supabaseConfigured: supabaseConfig.isConfigured,
      isUsingMockOperator: bridge.isUsingMockOperator,
      mockRoleChangeAllowed,
      hasAuthProfile: authSession.profile !== null,
      userAuthenticated: authSession.status === "authenticated",
      auditWriteMode: auditSupabaseConfig.writeMode ?? null,
    });

    const snapshot = buildReleaseStatusSnapshot({
      manifest,
      runtimePlatformVersion: platformVersion,
      environment: envConfig.name,
      environmentLabel: PLATFORM_ENVIRONMENT_LABELS[envConfig.name],
      environmentValid: envValidation.valid,
    });

    return {
      snapshot,
      manifest,
      channelLabel: RELEASE_CHANNEL_LABELS[snapshot.channel],
      releaseStatusLabel: RELEASE_STATUS_LABELS[snapshot.releaseStatus],
      runtimeReadiness,
      isEvaluatingRuntimeReadiness: isEvaluating,
    };
  }, [
    authSession.profile,
    authSession.status,
    bridge.isUsingMockOperator,
    mockRoleChangeAllowed,
    supabaseConfig.isConfigured,
    runtimeReadiness,
    isEvaluating,
  ]);
}
