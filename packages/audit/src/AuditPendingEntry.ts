import type { AuditEntry } from "./AuditTypes";

/** Entrada na fila de pendências aguardando persistência remota. */
export interface AuditPendingEntry {
  id: string;
  entry: AuditEntry;
  enqueuedAt: string;
  lastAttemptAt: string | null;
  attemptCount: number;
  lastError: string | null;
  errorCode?: string | null;
  correlationId?: string;
  requestId?: string;
  auditId: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function readCorrelationId(metadata: Record<string, unknown>): string | undefined {
  const value = metadata.correlationId ?? metadata.correlation_id;
  return isNonEmptyString(value) ? value : undefined;
}

function readRequestId(metadata: Record<string, unknown>): string | undefined {
  const value = metadata.requestId ?? metadata.request_id;
  return isNonEmptyString(value) ? value : undefined;
}

function readAuditId(metadata: Record<string, unknown>, fallbackId: string): string {
  const value = metadata.auditId ?? metadata.audit_id;
  return isNonEmptyString(value) ? value : fallbackId;
}

export interface ResolvePendingEntryIdsInput {
  auditId?: string;
  requestId?: string;
  correlationId?: string;
}

export function resolvePendingEntryIds(
  entry: AuditEntry,
  overrides: ResolvePendingEntryIdsInput = {},
): Pick<AuditPendingEntry, "auditId" | "requestId" | "correlationId"> {
  const metadata = entry.metadata;
  return {
    auditId: overrides.auditId ?? readAuditId(metadata, entry.id),
    requestId: overrides.requestId ?? readRequestId(metadata),
    correlationId: overrides.correlationId ?? readCorrelationId(metadata),
  };
}

export function createAuditPendingEntry(
  entry: AuditEntry,
  options: {
    lastError?: string | null;
    errorCode?: string | null;
    ids?: ResolvePendingEntryIdsInput;
  } = {},
): AuditPendingEntry {
  const now = new Date().toISOString();
  return {
    id: entry.id,
    entry,
    enqueuedAt: now,
    lastAttemptAt: null,
    attemptCount: 0,
    lastError: options.lastError ?? null,
    errorCode: options.errorCode ?? null,
    ...resolvePendingEntryIds(entry, options.ids),
  };
}

function isAuditEntry(value: unknown): value is AuditEntry {
  if (!value || typeof value !== "object") return false;
  const candidate = value as AuditEntry;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.actor === "string" &&
    typeof candidate.action === "string"
  );
}

export function isAuditPendingEntry(value: unknown): value is AuditPendingEntry {
  if (!value || typeof value !== "object") return false;
  const candidate = value as AuditPendingEntry;
  return (
    typeof candidate.id === "string" &&
    isAuditEntry(candidate.entry) &&
    typeof candidate.enqueuedAt === "string" &&
    typeof candidate.auditId === "string"
  );
}
