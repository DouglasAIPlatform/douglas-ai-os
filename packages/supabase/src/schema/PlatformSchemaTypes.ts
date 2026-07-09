/**
 * Tipos manuais alinhados às migrations em supabase/migrations/.
 * Não usa geração automática do Supabase CLI nesta fase.
 */

export type PlatformOperatorRole = "owner" | "admin" | "operator" | "viewer";

export type PlatformOperatorStatus = "active" | "invited" | "suspended";

export type PlatformSessionStatus = "active" | "revoked" | "expired";

export type OperationalAuditSeverity = "info" | "warning" | "error" | "critical";

/** Row shape — public.operator_profiles */
export interface OperatorProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  role: PlatformOperatorRole;
  status: PlatformOperatorStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Row shape — public.operational_audit_entries */
export interface OperationalAuditEntryRow {
  id: string;
  timestamp: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  source: string;
  action: string;
  target: string;
  severity: OperationalAuditSeverity;
  message: string;
  correlation_id: string | null;
  request_id: string | null;
  audit_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Row shape — public.operator_sessions */
export interface OperatorSessionRow {
  id: string;
  user_id: string;
  session_token_hash: string;
  status: PlatformSessionStatus;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  revoked_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Row shape — public.operator_role_permissions */
export interface OperatorRolePermissionRow {
  role: PlatformOperatorRole;
  permission: string;
  description: string | null;
  created_at: string;
}

export const SUPABASE_TABLES = {
  operatorProfiles: "operator_profiles",
  operationalAuditEntries: "operational_audit_entries",
  operatorSessions: "operator_sessions",
  operatorRolePermissions: "operator_role_permissions",
} as const;

export type SupabaseTableName =
  (typeof SUPABASE_TABLES)[keyof typeof SUPABASE_TABLES];
