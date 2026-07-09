import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "./SupabaseConfig";

export type DouglasSupabaseClient = SupabaseClient;

function resolveBrowserAuthStorage():
  | Pick<Storage, "getItem" | "setItem" | "removeItem">
  | undefined {
  if (typeof globalThis === "undefined") {
    return undefined;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Browser Supabase client with session persistence (localStorage via supabase-js).
 * Returns null when env vars are missing — app continues in mock/not_configured mode.
 */
export function createSupabaseBrowserClient(
  config: SupabaseConfig,
): DouglasSupabaseClient | null {
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: resolveBrowserAuthStorage(),
    },
  });
}
