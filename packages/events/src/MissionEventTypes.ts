/** Payload mínimo e sanitizado para eventos mission:* — Sprint 5.48 */
export interface MissionLifecycleEventPayload {
  missionId: string;
  executionId: string;
  correlationId: string;
  status: string;
  currentStep?: string;
  progress?: number;
  assignedAgentId?: string;
  summary?: string;
  errorCode?: string;
  /** Quando true, audit já foi registrado pelo coordinator — evita loop. */
  audited?: boolean;
}

export const MISSION_LIFECYCLE_EVENT_TOPICS = [
  "mission:created",
  "mission:validated",
  "mission:planned",
  "mission:assigned",
  "mission:started",
  "mission:progress",
  "mission:completed",
  "mission:failed",
  "mission:cancelled",
  "mission:duplicate_rejected",
] as const;

export type MissionLifecycleEventTopic = (typeof MISSION_LIFECYCLE_EVENT_TOPICS)[number];

export function buildMissionLifecyclePayload(input: {
  missionId: string;
  executionId: string;
  correlationId: string;
  status: string;
  currentStep?: string;
  progress?: number;
  assignedAgentId?: string;
  summary?: string;
  errorCode?: string;
  audited?: boolean;
}): MissionLifecycleEventPayload {
  return {
    missionId: input.missionId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    status: input.status,
    ...(input.currentStep ? { currentStep: input.currentStep } : {}),
    ...(typeof input.progress === "number" ? { progress: input.progress } : {}),
    ...(input.assignedAgentId ? { assignedAgentId: input.assignedAgentId } : {}),
    ...(input.summary ? { summary: input.summary.slice(0, 240) } : {}),
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
    ...(input.audited ? { audited: true } : {}),
  };
}
