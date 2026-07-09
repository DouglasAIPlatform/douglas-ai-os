"use client";

import { createContext } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "./SupabaseConfig";
import type { SupabaseConnectionState } from "./SupabaseConnectionStatus";

export interface SupabaseContextValue {
  config: SupabaseConfig;
  client: SupabaseClient | null;
  connection: SupabaseConnectionState;
  isChecking: boolean;
  refreshHealthCheck: () => Promise<void>;
}

export const SupabaseContext = createContext<SupabaseContextValue | null>(null);
