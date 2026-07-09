import type { OperationalAuditEntryRow } from "@douglas/supabase";
import type { AuditEntry } from "./AuditTypes";

function readCorrelationId(metadata: Record<string, unknown>): string | null {
  const value = metadata.correlationId ?? metadata.correlation_id;
  return typeof value === "string" ? value : null;
}

function readRequestId(metadata: Record<string, unknown>): string | null {
  const value = metadata.requestId ?? metadata.request_id;
  return typeof value === "string" ? value : null;
}

function readAuditId(metadata: Record<string, unknown>, fallbackId: string): string {
  const value = metadata.auditId ?? metadata.audit_id;
  return typeof value === "string" ? value : fallbackId;
}

/** Mapeia AuditEntry (contrato app) → row Supabase. */
export function auditEntryToOperationalAuditRow(
  entry: AuditEntry,
): Omit<OperationalAuditEntryRow, "id" | "created_at"> {
  return {
    timestamp: entry.timestamp,
    actor_id:
      (typeof entry.metadata.operatorId === "string"
        ? entry.metadata.operatorId
        : null) ?? entry.actor,
    actor_name: entry.actor,
    actor_role: entry.role,
    source: entry.source,
    action: entry.action,
    target: entry.target,
    severity: entry.severity,
    message: entry.message,
    correlation_id: readCorrelationId(entry.metadata),
    request_id: readRequestId(entry.metadata),
    audit_id: readAuditId(entry.metadata, entry.id),
    metadata: entry.metadata,
  };
}

function isOperationalAuditSeverity(
  value: string,
): value is OperationalAuditEntryRow["severity"] {
  return value === "info" || value === "warning" || value === "error" || value === "critical";
}

/** Mapeia row Supabase → AuditEntry (contrato app). */
export function operationalAuditRowToAuditEntry(
  row: OperationalAuditEntryRow,
): AuditEntry {
  return {
    id: row.audit_id ?? row.id,
    timestamp: row.timestamp,
    actor: row.actor_name,
    role: row.actor_role,
    source: row.source as AuditEntry["source"],
    action: row.action as AuditEntry["action"],
    target: row.target,
    severity: isOperationalAuditSeverity(row.severity) ? row.severity : "info",
    message: row.message,
    metadata: {
      ...row.metadata,
      auditId: row.audit_id ?? undefined,
      correlationId: row.correlation_id ?? undefined,
      requestId: row.request_id ?? undefined,
      operatorId: row.actor_id ?? undefined,
      persistedInSupabase: true,
      supabaseRowId: row.id,
    },
  };
}
