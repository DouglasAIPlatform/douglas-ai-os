import type { AuditRetryStatus } from "./AuditRetryStatus";

/** Resultado de uma operação de retry/sync manual da fila de pendências. */
export interface AuditSyncResult {
  status: AuditRetryStatus;
  attempted: number;
  succeeded: number;
  failed: number;
  remaining: number;
  lastError: string | null;
  completedAt: string;
  skipped?: boolean;
  skipReason?: string;
}

export const EMPTY_AUDIT_SYNC_RESULT: AuditSyncResult = {
  status: "idle",
  attempted: 0,
  succeeded: 0,
  failed: 0,
  remaining: 0,
  lastError: null,
  completedAt: new Date(0).toISOString(),
};
