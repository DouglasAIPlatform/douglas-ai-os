"use client";

import {
  mapOperatorProfileRow,
  requestOperatorProfileBootstrap,
  resolveOperatorProfileBootstrap,
  SUPABASE_TABLES,
  useSupabase,
  type OperatorProfileBootstrapReport,
  type OperatorProfileBootstrapRequestResult,
  type OperatorProfileRow,
} from "@douglas/supabase";
import { useCallback, useEffect, useState } from "react";
import { useAuthOperatorBridge } from "@/features/platform-auth/useAuthOperatorBridge";

export function useOperatorProfileBootstrap() {
  const { config, client } = useSupabase();
  const { authSession, bridge, operator, operatorSource } = useAuthOperatorBridge();
  const [report, setReport] = useState<OperatorProfileBootstrapReport | null>(null);
  const [requestResult, setRequestResult] =
    useState<OperatorProfileBootstrapRequestResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const refreshBootstrap = useCallback(async () => {
    setIsChecking(true);
    try {
      const nextReport = await resolveOperatorProfileBootstrap({
        config,
        client,
        session: authSession,
        usingMockFallback: bridge.isUsingMockOperator,
      });
      setReport(nextReport);
    } finally {
      setIsChecking(false);
    }
  }, [
    authSession,
    bridge.isUsingMockOperator,
    client,
    config,
  ]);

  const requestBootstrap = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await requestOperatorProfileBootstrap({
        config,
        client,
        session: authSession,
        usingMockFallback: bridge.isUsingMockOperator,
        reloadProfile: async () => {
          if (!client || !authSession.user?.id) {
            return null;
          }

          const { data, error } = await client
            .from(SUPABASE_TABLES.operatorProfiles)
            .select("*")
            .eq("user_id", authSession.user.id)
            .maybeSingle();

          if (error || !data) {
            return null;
          }

          return mapOperatorProfileRow(data as OperatorProfileRow);
        },
      });

      setRequestResult(result);
      setReport(result);
      await authSession.refreshSession();
    } finally {
      setIsChecking(false);
    }
  }, [authSession, bridge.isUsingMockOperator, client, config]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshBootstrap();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshBootstrap]);

  return {
    report,
    requestResult,
    isChecking,
    authSession,
    bridge,
    operator,
    operatorSource,
    refreshBootstrap,
    requestBootstrap,
  };
}
