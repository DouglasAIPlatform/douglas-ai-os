/** Eventos de persistência de execução — Sprint 5.50 */
export interface MissionPersistenceEventPayload {
  executionId: string;
  missionId?: string;
  mode?: string;
  adapter?: string;
  summary?: string;
  errorCode?: string;
  pendingCount?: number;
  rehydratedCount?: number;
  /** Evita loop de audit quando true. */
  audited?: boolean;
}

export const MISSION_PERSISTENCE_EVENT_TOPICS = [
  "mission:persistence_saved",
  "mission:persistence_failed",
  "mission:persistence_fallback",
  "mission:persistence_rehydrated",
  "mission:recovery_required",
  "mission:persistence_validation_started",
  "mission:persistence_validation_passed",
  "mission:persistence_validation_failed",
  "mission:persistence_remote_confirmed",
  "mission:persistence_acceptance_started",
  "mission:persistence_acceptance_passed",
  "mission:persistence_acceptance_failed",
] as const;

export type MissionPersistenceEventTopic =
  (typeof MISSION_PERSISTENCE_EVENT_TOPICS)[number];

export function buildMissionPersistencePayload(input: {
  executionId: string;
  missionId?: string;
  mode?: string;
  adapter?: string;
  summary?: string;
  errorCode?: string;
  pendingCount?: number;
  rehydratedCount?: number;
  audited?: boolean;
}): MissionPersistenceEventPayload {
  return {
    executionId: input.executionId,
    ...(input.missionId ? { missionId: input.missionId } : {}),
    ...(input.mode ? { mode: input.mode } : {}),
    ...(input.adapter ? { adapter: input.adapter } : {}),
    ...(input.summary ? { summary: input.summary.slice(0, 240) } : {}),
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
    ...(typeof input.pendingCount === "number" ? { pendingCount: input.pendingCount } : {}),
    ...(typeof input.rehydratedCount === "number"
      ? { rehydratedCount: input.rehydratedCount }
      : {}),
    ...(input.audited ? { audited: true } : {}),
  };
}
