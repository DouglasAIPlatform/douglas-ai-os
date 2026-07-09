/** Como o client Supabase persiste audit no Postgres. */
export type SupabaseAuditWriteMode = "direct_client" | "edge_function";

export const SUPABASE_AUDIT_WRITE_MODE_LABELS: Record<SupabaseAuditWriteMode, string> = {
  direct_client: "Client direto (limitado por RLS)",
  edge_function: "Edge Function audit-ingest (recomendado)",
};

export const DEFAULT_AUDIT_EDGE_FUNCTION_NAME = "audit-ingest";

/** direct_client permanece padrão até deploy + validação da Edge Function. */
export const DEFAULT_SUPABASE_AUDIT_WRITE_MODE: SupabaseAuditWriteMode = "direct_client";

export function isSupabaseAuditWriteMode(value: string): value is SupabaseAuditWriteMode {
  return value === "direct_client" || value === "edge_function";
}
