export type {
  MissionExecutionPersistenceMode,
} from "./MissionExecutionPersistenceMode";
export {
  resolveEffectiveMissionPersistenceMode,
  shouldAttemptSupabaseMissionPersistence,
  shouldUseSessionMissionPersistence,
  isSupabaseMissionPersistenceRequired,
} from "./MissionExecutionPersistenceMode";

export type {
  MissionExecutionPersistenceErrorCode,
  MissionExecutionPersistenceResult,
} from "./MissionExecutionPersistenceResult";
export {
  missionPersistenceOk,
  missionPersistenceFail,
} from "./MissionExecutionPersistenceResult";

export type {
  MissionExecutionPersistenceActiveAdapter,
  MissionExecutionPersistenceHealth,
} from "./MissionExecutionPersistenceHealth";
export { DEFAULT_MISSION_EXECUTION_PERSISTENCE_HEALTH } from "./MissionExecutionPersistenceHealth";

export type { MissionExecutionEventRecord } from "./MissionExecutionEventRecord";
export { buildMissionExecutionEventRecord } from "./MissionExecutionEventRecord";

export {
  sanitizeMissionPersistenceText,
  assertMissionPersistenceSafe,
} from "./MissionExecutionSanitizer";

export type { MissionExecutionRowStatus } from "./MissionExecutionRowTypes";
export {
  MISSION_EXECUTION_TABLES,
  type MissionExecutionRow,
  type MissionExecutionEventRow,
} from "./MissionExecutionRowTypes";
export type { MissionExecutionPersistenceWriteMeta } from "./SupabaseMissionExecutionMapper";
export {
  missionExecutionContextToRow,
  missionExecutionRowToContext,
  missionExecutionResultFromRow,
  missionExecutionEventToRow,
  missionExecutionEventRowToRecord,
  contextToTimelineEvent,
} from "./SupabaseMissionExecutionMapper";

export type { SupabaseMissionExecutionPersistenceConfig } from "./SupabaseMissionExecutionPersistence";
export {
  SupabaseMissionExecutionPersistence,
  createSupabaseMissionExecutionPersistence,
  DEFAULT_SUPABASE_MISSION_EXECUTION_CONFIG,
} from "./SupabaseMissionExecutionPersistence";

export type {
  MissionExecutionRecoveryAction,
  MissionExecutionRecoveryDecision,
  MissionExecutionRecoveryPolicyOptions,
} from "./MissionExecutionRecoveryPolicy";
export { evaluateMissionExecutionRecovery } from "./MissionExecutionRecoveryPolicy";

export type {
  MissionExecutionRehydrationResult,
  MissionExecutionRehydrationInput,
} from "./MissionExecutionRehydration";
export {
  rehydrateMissionExecutions,
  buildRehydrationHealthPatch,
} from "./MissionExecutionRehydration";

export {
  MissionExecutionPendingQueue,
  MISSION_PERSISTENCE_PENDING_QUEUE_LIMIT,
} from "./MissionExecutionPendingQueue";

export type {
  CompositeMissionExecutionPersistenceConfig,
  MissionExecutionPersistenceAdapterWithStatus,
} from "./CompositeMissionExecutionPersistence";
export {
  CompositeMissionExecutionPersistence,
  createCompositeMissionExecutionPersistence,
  isMissionExecutionPersistenceWithStatus,
  readMissionExecutionPersistenceStatus,
} from "./CompositeMissionExecutionPersistence";

export * from "./remote";
export * from "./acceptance";
