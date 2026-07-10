/** Contagens da fila local de pendências para UI operacional. */
export interface AuditPendingQueueStats {
  total: number;
  unattempted: number;
  failed: number;
  resolvedLegacy: number;
  staleFailed: number;
}

export const EMPTY_AUDIT_PENDING_QUEUE_STATS: AuditPendingQueueStats = {
  total: 0,
  unattempted: 0,
  failed: 0,
  resolvedLegacy: 0,
  staleFailed: 0,
};
