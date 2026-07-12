import type { OperationalAuditEntryRow } from "./PlatformSchemaTypes";

export type {
  OperationalAuditSeverity,
  OperatorProfileRow,
  OperatorRolePermissionRow,
  OperatorSessionRow,
  OperationalAuditEntryRow,
  MissionExecutionRow,
  MissionExecutionEventRow,
  MissionExecutionRowStatus,
  PlatformOperatorRole,
  PlatformOperatorStatus,
  PlatformSessionStatus,
  SupabaseTableName,
} from "./PlatformSchemaTypes";

export { SUPABASE_TABLES } from "./PlatformSchemaTypes";

/** Input parcial para insert de audit — sem id/created_at gerados pelo banco. */
export type OperationalAuditEntryInsert = Omit<
  OperationalAuditEntryRow,
  "id" | "created_at"
>;

export function isOperationalAuditEntryRow(
  value: unknown,
): value is OperationalAuditEntryRow {
  if (!value || typeof value !== "object") return false;
  const row = value as OperationalAuditEntryRow;
  return (
    typeof row.id === "string" &&
    typeof row.timestamp === "string" &&
    typeof row.actor_name === "string" &&
    typeof row.action === "string"
  );
}
