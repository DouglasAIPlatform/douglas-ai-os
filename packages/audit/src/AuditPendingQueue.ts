import type { AuditPendingEntry } from "./AuditPendingEntry";

/** Contrato da fila de entradas de audit pendentes de sync remoto. */
export interface AuditPendingQueue {
  hydrate(): AuditPendingEntry[];
  list(): AuditPendingEntry[];
  count(): number;
  enqueue(entry: AuditPendingEntry): void;
  remove(id: string): void;
  update(entry: AuditPendingEntry): void;
  clear(): void;
  getLastQueueError(): string | null;
}
