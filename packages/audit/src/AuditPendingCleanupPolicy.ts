/** Política para limpeza segura da fila local de pendências. */
export interface AuditPendingCleanupPolicy {
  /** Idade mínima (ms) para considerar pendência antiga/falhada elegível à limpeza. */
  staleAfterMs: number;
  /** Padrões de erro legados (ex.: RLS / direct_client) — resolvíveis localmente. */
  legacyErrorPatterns: string[];
  /** Tentativas mínimas para classificar como falha persistente. */
  minAttemptsForFailed: number;
}

export const DEFAULT_AUDIT_PENDING_CLEANUP_POLICY: AuditPendingCleanupPolicy = {
  staleAfterMs: 7 * 24 * 60 * 60 * 1000,
  legacyErrorPatterns: [
    "row-level security",
    "rls",
    "permission denied",
    "42501",
    "direct_client",
    "policy violation",
    "new row violates",
  ],
  minAttemptsForFailed: 1,
};

export type AuditPendingCleanupOperation = "clear_resolved" | "clear_stale_failed";
