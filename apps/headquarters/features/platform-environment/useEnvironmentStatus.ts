"use client";

import {
  buildEnvironmentStatusSnapshot,
  PLATFORM_ENVIRONMENT_LABELS,
  resolveEnvironmentConfig,
  validateEnvironmentConfig,
} from "@douglas/environment";
import { useMemo } from "react";
import { useSupabase } from "@douglas/supabase";
import { useAuthOperatorBridge } from "@/features/platform-auth/useAuthOperatorBridge";
import { auditSupabaseConfig } from "@/features/platform-audit/config";

export function useEnvironmentStatus() {
  const { config: supabaseConfig } = useSupabase();
  const { authSession, bridge, mockRoleChangeAllowed } = useAuthOperatorBridge();

  return useMemo(() => {
    const envConfig = resolveEnvironmentConfig();
    const validation = validateEnvironmentConfig(envConfig, {
      supabaseConfigured: supabaseConfig.isConfigured,
      isUsingMockOperator: bridge.isUsingMockOperator,
      mockRoleChangeAllowed,
      hasAuthProfile: authSession.profile !== null,
      userAuthenticated: authSession.status === "authenticated",
      auditWriteMode: auditSupabaseConfig.writeMode ?? null,
    });

    const snapshot = buildEnvironmentStatusSnapshot({
      config: envConfig,
      validation,
      supabaseConfigured: supabaseConfig.isConfigured,
    });

    return {
      snapshot,
      validation,
      config: envConfig,
      environmentLabel: PLATFORM_ENVIRONMENT_LABELS[snapshot.environment],
    };
  }, [
    authSession.profile,
    authSession.status,
    bridge.isUsingMockOperator,
    mockRoleChangeAllowed,
    supabaseConfig.isConfigured,
  ]);
}
