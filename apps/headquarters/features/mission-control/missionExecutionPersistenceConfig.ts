import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CompositeMissionExecutionPersistenceConfig,
  MissionExecutionPersistenceMode,
} from "@douglas/missions";

/** Default development — fallback session permitido. */
export const missionExecutionPersistenceMode: MissionExecutionPersistenceMode =
  "supabase_preferred";

export const missionExecutionSessionStorageKey = "douglas:mission-execution";
export const missionExecutionPendingQueueKey = "douglas:mission-execution-pending";

/** Staging/production exigem Supabase — sem perda silenciosa. */
export function resolveMissionExecutionPersistenceMode(
  effectiveEnvironment: string | undefined,
): MissionExecutionPersistenceMode {
  if (effectiveEnvironment === "staging" || effectiveEnvironment === "production") {
    return "supabase_required";
  }
  return missionExecutionPersistenceMode;
}

export function buildMissionExecutionPersistenceConfig(input: {
  supabaseClient: SupabaseClient | null;
  isSupabaseConfigured: boolean;
  createdByUserId?: string;
  operatorProfileId?: string;
  mode?: MissionExecutionPersistenceMode;
  effectiveEnvironment?: string;
}): CompositeMissionExecutionPersistenceConfig {
  const resolvedMode =
    input.mode ??
    resolveMissionExecutionPersistenceMode(input.effectiveEnvironment);

  return {
    mode: resolvedMode,
    isSupabaseConfigured: input.isSupabaseConfigured,
    sessionStorageKey: missionExecutionSessionStorageKey,
    pendingQueueKey: missionExecutionPendingQueueKey,
    defaultWriteMeta: input.createdByUserId
      ? {
          createdByUserId: input.createdByUserId,
          operatorProfileId: input.operatorProfileId,
        }
      : undefined,
  };
}
