import type { SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseTableProbeResult {
  /** Table appears to exist (including RLS permission responses). */
  detected: boolean;
  /** True when error indicates missing relation / schema cache. */
  missing: boolean;
  /** Sanitized error message — never includes keys or row data. */
  error: string | null;
}

function isMissingTableError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find the table") ||
    normalized.includes("schema cache") ||
    normalized.includes("42p01") ||
    normalized.includes("pgrst205")
  );
}

/**
 * Read-only probe — SELECT id LIMIT 1. Never inserts, updates or deletes.
 */
export async function probeSupabaseTableReadOnly(
  client: SupabaseClient,
  tableName: string,
): Promise<SupabaseTableProbeResult> {
  try {
    const { error } = await client.from(tableName).select("id").limit(1);

    if (!error) {
      return { detected: true, missing: false, error: null };
    }

    if (isMissingTableError(error.message)) {
      return { detected: false, missing: true, error: error.message };
    }

    // Permission denied / RLS still implies the relation exists.
    return { detected: true, missing: false, error: error.message };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Falha ao verificar tabela (read-only)";
    return {
      detected: false,
      missing: isMissingTableError(message),
      error: message,
    };
  }
}
