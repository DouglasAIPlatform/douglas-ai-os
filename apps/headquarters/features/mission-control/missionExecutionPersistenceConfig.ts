import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CompositeMissionExecutionPersistenceConfig,
  MissionExecutionPersistenceMode,
} from "@douglas/missions";

/** Configuração de persistência de execução de missões (Headquarters). */
export const missionExecutionPersistenceMode: MissionExecutionPersistenceMode =
  "supabase_preferred";

export const missionExecutionSessionStorageKey = "douglas:mission-execution";
export const missionExecutionPendingQueueKey = "douglas:mission-execution-pending";

export function buildMissionExecutionPersistenceConfig(input: {
  supabaseClient: SupabaseClient | null;
  isSupabaseConfigured: boolean;
  createdByUserId?: string;
  operatorProfileId?: string;
  mode?: MissionExecutionPersistenceMode;
}): CompositeMissionExecutionPersistenceConfig {
  return {
    mode: input.mode ?? missionExecutionPersistenceMode,
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
