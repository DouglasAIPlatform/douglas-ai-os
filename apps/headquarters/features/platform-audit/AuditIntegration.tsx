"use client";

import { AuditProvider } from "@douglas/audit";
import { useSupabase } from "@douglas/supabase";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { buildAuditPersistenceIntegration } from "@/features/platform-audit/config";

interface AuditIntegrationProps {
  children: ReactNode;
}

export function AuditIntegration({ children }: AuditIntegrationProps) {
  const { client, config } = useSupabase();

  const persistenceIntegration = useMemo(
    () =>
      buildAuditPersistenceIntegration({
        supabaseClient: client,
        isSupabaseConfigured: config.isConfigured,
      }),
    [client, config.isConfigured],
  );

  return (
    <AuditProvider displayLimit={100} persistenceIntegration={persistenceIntegration}>
      {children}
    </AuditProvider>
  );
}
