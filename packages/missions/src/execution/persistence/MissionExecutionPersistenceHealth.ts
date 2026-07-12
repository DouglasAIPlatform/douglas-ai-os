import type { MissionExecutionPersistenceMode } from "./MissionExecutionPersistenceMode";

export type MissionExecutionPersistenceActiveAdapter =
  | "none"
  | "session"
  | "supabase"
  | "composite";

export interface MissionExecutionPersistenceHealth {
  enabled: boolean;
  mode: MissionExecutionPersistenceMode;
  activeAdapter: MissionExecutionPersistenceActiveAdapter;
  supabaseConfigured: boolean;
  supabaseTableReady: boolean | null;
  fallbackActive: boolean;
  pendingSyncCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
  lastPersistedAt: string | null;
  lastHydratedAt: string | null;
}

export const DEFAULT_MISSION_EXECUTION_PERSISTENCE_HEALTH: MissionExecutionPersistenceHealth =
  {
    enabled: false,
    mode: "session_only",
    activeAdapter: "none",
    supabaseConfigured: false,
    supabaseTableReady: null,
    fallbackActive: false,
    pendingSyncCount: 0,
    lastSyncAt: null,
    lastError: null,
    lastPersistedAt: null,
    lastHydratedAt: null,
  };
