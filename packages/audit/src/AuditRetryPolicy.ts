/** Política de retry para entradas de audit pendentes. */
export interface AuditRetryPolicy {
  /** Máximo de entradas mantidas na fila local. */
  maxEntries: number;
  /** Retry apenas manual — sem background sync agressivo. */
  manualOnly: boolean;
  /** Tentativas máximas por entrada (reservado para sync futuro). */
  maxAttemptsPerEntry?: number;
}

export const DEFAULT_AUDIT_RETRY_POLICY: AuditRetryPolicy = {
  maxEntries: 50,
  manualOnly: true,
  maxAttemptsPerEntry: 10,
};
