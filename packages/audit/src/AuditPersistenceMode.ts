export type AuditPersistenceMode = "localStorage" | "supabase" | "dual" | "auto";

export const AUDIT_PERSISTENCE_MODE_LABELS: Record<AuditPersistenceMode, string> = {
  localStorage: "localStorage",
  supabase: "Supabase",
  dual: "Dual-write",
  auto: "Automático",
};

/**
 * Resolves the effective mode at runtime.
 * Without Supabase env vars, only localStorage is used regardless of requested mode.
 */
export function resolveEffectiveAuditPersistenceMode(
  requestedMode: AuditPersistenceMode,
  isSupabaseConfigured: boolean,
): AuditPersistenceMode {
  if (!isSupabaseConfigured) {
    return "localStorage";
  }

  if (requestedMode === "localStorage") {
    return "localStorage";
  }

  return requestedMode;
}

export function shouldAttemptSupabaseWrite(
  mode: AuditPersistenceMode,
  supabaseAvailable: boolean,
): boolean {
  if (!supabaseAvailable) {
    return false;
  }

  return mode === "supabase" || mode === "dual" || mode === "auto";
}

/** localStorage is always the official fallback — never disabled in composite flows. */
export function shouldWriteToLocalStorage(_mode: AuditPersistenceMode): boolean {
  return true;
}
