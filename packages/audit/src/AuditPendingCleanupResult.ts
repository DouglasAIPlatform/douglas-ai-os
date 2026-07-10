import type { AuditPendingCleanupOperation } from "./AuditPendingCleanupPolicy";

/** Resultado de uma operação de limpeza da pending queue local. */
export interface AuditPendingCleanupResult {
  operation: AuditPendingCleanupOperation;
  removed: number;
  remaining: number;
  removedIds: string[];
  completedAt: string;
  skipped?: boolean;
  skipReason?: string;
  message?: string;
}

export const EMPTY_AUDIT_PENDING_CLEANUP_RESULT: AuditPendingCleanupResult = {
  operation: "clear_resolved",
  removed: 0,
  remaining: 0,
  removedIds: [],
  completedAt: new Date(0).toISOString(),
};
