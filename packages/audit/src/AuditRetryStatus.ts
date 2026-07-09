/** Estado de sincronização da fila de pendências de audit. */
export type AuditRetryStatus =
  | "idle"
  | "pending"
  | "retrying"
  | "synced"
  | "failed";

export const AUDIT_RETRY_STATUS_LABELS: Record<AuditRetryStatus, string> = {
  idle: "Ocioso",
  pending: "Pendências aguardando retry",
  retrying: "Retry em andamento",
  synced: "Sincronizado",
  failed: "Último retry falhou",
};
