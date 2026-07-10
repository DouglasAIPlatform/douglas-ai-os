import type { AuditIngestErrorCode } from "./AuditIngestResponse";
import type { AuditIngestOutcome } from "./AuditIngestOutcome";

/** Registro seguro de uma tentativa de ingest (sem payload completo nem PII). */
export interface AuditIngestMetric {
  outcome: AuditIngestOutcome;
  recordedAt: string;
  /** Quando true, persistência local/fila foi usada após falha remota. */
  usedFallback?: boolean;
  auditId?: string;
  requestId?: string;
  correlationId?: string;
  remoteStatus?: "accepted" | "rejected" | "error";
  errorCode?: AuditIngestErrorCode | string;
  latencyMs?: number;
  /** Mensagem sanitizada para UI — nunca token/email. */
  errorMessage?: string | null;
}
