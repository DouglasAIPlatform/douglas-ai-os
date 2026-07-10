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
    const profileActive = authSession.profile?.status === "active";
    const validation = validateEnvironmentConfig(envConfig, {
      supabaseConfigured: supabaseConfig.isConfigured,
      isUsingMockOperator: bridge.isUsingMockOperator,
      mockRoleChangeAllowed,
      hasAuthProfile: authSession.profile !== null,
      profileActive,
      isBlockedByProfileStatus: bridge.isBlockedByProfileStatus,
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
      authHandoff: {
        handoffState: bridge.handoffState,
        effectiveRole: bridge.effectiveRole,
        profileStatus: bridge.profileStatus,
        isBlockedByProfileStatus: bridge.isBlockedByProfileStatus,
        operatorSource: bridge.operatorSource,
      },
    };
  }, [
    authSession.profile,
    authSession.status,
    bridge.effectiveRole,
    bridge.handoffState,
    bridge.isBlockedByProfileStatus,
    bridge.isUsingMockOperator,
    bridge.operatorSource,
    bridge.profileStatus,
    mockRoleChangeAllowed,
    supabaseConfig.isConfigured,
  ]);
}
