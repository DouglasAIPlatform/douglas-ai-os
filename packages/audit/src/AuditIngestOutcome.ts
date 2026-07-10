/** Resultado operacional de uma tentativa de ingest remoto (sessão local). */
export type AuditIngestOutcome = "accepted" | "rejected" | "fallback" | "failed";

export const AUDIT_INGEST_OUTCOME_LABELS: Record<AuditIngestOutcome, string> = {
  accepted: "Aceito",
  rejected: "Rejeitado",
  fallback: "Fallback local",
  failed: "Falha remota",
};
