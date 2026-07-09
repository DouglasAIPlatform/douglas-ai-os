export type SupabaseValidationCheckOutcome = "pass" | "warn" | "fail" | "skip";

export type SupabaseValidationCheckId =
  | "basic_connection"
  | "auth_available"
  | "operator_profiles_table"
  | "operational_audit_entries_table"
  | "connection_widget_status"
  | "auth_session_status"
  | "audit_persistence_status"
  | "edge_function_prepared";

export interface SupabaseValidationCheck {
  id: SupabaseValidationCheckId;
  label: string;
  outcome: SupabaseValidationCheckOutcome;
  message: string;
  /** Internal doc path for operators (no secrets). */
  docPath?: string;
}

export const SUPABASE_VALIDATION_CHECK_LABELS: Record<SupabaseValidationCheckId, string> = {
  basic_connection: "Conexão básica Supabase",
  auth_available: "Auth API disponível",
  operator_profiles_table: "Tabela operator_profiles",
  operational_audit_entries_table: "Tabela operational_audit_entries",
  connection_widget_status: "SupabaseConnectionWidget",
  auth_session_status: "AuthSessionProvider",
  audit_persistence_status: "AuditPersistenceAdapter",
  edge_function_prepared: "Edge Function audit-ingest (preparada)",
};
