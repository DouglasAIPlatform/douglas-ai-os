import type { SupabaseConfig } from "../SupabaseConfig";
import type { AuthMode, AuthStatus } from "./AuthTypes";

export function resolveAuthMode(
  config: Pick<SupabaseConfig, "isConfigured">,
  status: AuthStatus,
): AuthMode {
  if (!config.isConfigured || status === "not_configured") {
    return "mock";
  }

  if (status === "authenticated") {
    return "authenticated";
  }

  if (
    status === "unauthenticated" ||
    status === "loading" ||
    status === "error"
  ) {
    return "supabase_ready";
  }

  return "mock";
}
