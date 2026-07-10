/** Topics de telemetria de ingest — não devem gerar novos audit entries. */
export const AUDIT_INGEST_TELEMETRY_TOPICS = [
  "audit:ingest:accepted",
  "audit:ingest:rejected",
  "audit:ingest:fallback",
  "audit:ingest:failed",
] as const;

export type AuditIngestTelemetryTopic = (typeof AUDIT_INGEST_TELEMETRY_TOPICS)[number];

export function isAuditIngestTelemetryTopic(topic: string): topic is AuditIngestTelemetryTopic {
  return (AUDIT_INGEST_TELEMETRY_TOPICS as readonly string[]).includes(topic);
}

/** Impede loop: eventos de telemetria não são mapeados para audit log. */
export function shouldExcludeTopicFromAuditMapping(topic: string): boolean {
  return isAuditIngestTelemetryTopic(topic);
}

/** Payload seguro publicado no Event Bus (sem PII). */
export interface AuditIngestTelemetryEventPayload {
  outcome: "accepted" | "rejected" | "fallback" | "failed";
  auditId?: string;
  requestId?: string;
  correlationId?: string;
  errorCode?: string;
  latencyMs?: number;
  remoteStatus?: "accepted" | "rejected" | "error";
}

export function outcomeToTelemetryTopic(
  outcome: AuditIngestTelemetryEventPayload["outcome"],
): AuditIngestTelemetryTopic {
  switch (outcome) {
    case "accepted":
      return "audit:ingest:accepted";
    case "rejected":
      return "audit:ingest:rejected";
    case "fallback":
      return "audit:ingest:fallback";
    default:
      return "audit:ingest:failed";
  }
}
