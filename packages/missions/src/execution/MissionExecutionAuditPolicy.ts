import type { EventTopic } from "@douglas/events";
import type { MissionExecutionAuditEntry } from "./MissionExecutionCoordinator";

/** Eventos de lifecycle auditados explicitamente pelo coordinator (exactly-once). */
export const MISSION_LIFECYCLE_AUDIT_TOPICS = new Set<EventTopic>([
  "mission:created",
  "mission:validated",
  "mission:planned",
  "mission:assigned",
  "mission:started",
  "mission:completed",
  "mission:failed",
  "mission:cancelled",
  "mission:duplicate_rejected",
]);

/** Progresso publica evento para monitoramento, mas não gera audit (volume). */
export function shouldAuditMissionTopic(topic: EventTopic): boolean {
  return MISSION_LIFECYCLE_AUDIT_TOPICS.has(topic);
}

export function buildMissionAuditEntry(
  topic: EventTopic,
  input: {
    missionId: string;
    executionId: string;
    correlationId: string;
    status: string;
    progress?: number;
    summary?: string;
    errorCode?: string;
  },
): MissionExecutionAuditEntry {
  return {
    action: topic.replace("mission:", "mission_"),
    message: input.summary ?? `Missão ${input.status}`,
    metadata: {
      missionId: input.missionId,
      executionId: input.executionId,
      correlationId: input.correlationId,
      status: input.status,
      progress: input.progress,
      ...(input.errorCode ? { errorCode: input.errorCode } : {}),
      origin: "mission_execution_coordinator",
      auditPath: "explicit_append",
    },
  };
}
