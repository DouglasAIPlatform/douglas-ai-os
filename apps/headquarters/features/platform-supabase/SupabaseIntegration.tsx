"use client";

import { AuthSessionProvider, SupabaseProvider } from "@douglas/supabase";
import type { ReactNode } from "react";
import {
  supabaseConfig,
  supabaseHealthCheckOptions,
} from "@/features/platform-supabase/config";

interface SupabaseIntegrationProps {
  children: ReactNode;
}

export function SupabaseIntegration({ children }: SupabaseIntegrationProps) {
  return (
    <SupabaseProvider
      config={supabaseConfig}
      healthCheckOptions={supabaseHealthCheckOptions}
    >
      <AuthSessionProvider>{children}</AuthSessionProvider>
    </SupabaseProvider>
  );
}
