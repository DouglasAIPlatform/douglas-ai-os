export type MissionExecutionPersistenceMode =
  | "session_only"
  | "supabase_preferred"
  | "supabase_required";

export function resolveEffectiveMissionPersistenceMode(
  mode: MissionExecutionPersistenceMode,
  isSupabaseConfigured: boolean,
): MissionExecutionPersistenceMode {
  if (!isSupabaseConfigured) {
    return "session_only";
  }
  return mode;
}

export function shouldAttemptSupabaseMissionPersistence(
  mode: MissionExecutionPersistenceMode,
  isSupabaseConfigured: boolean,
): boolean {
  const effective = resolveEffectiveMissionPersistenceMode(mode, isSupabaseConfigured);
  return effective === "supabase_preferred" || effective === "supabase_required";
}

export function shouldUseSessionMissionPersistence(
  mode: MissionExecutionPersistenceMode,
): boolean {
  return mode === "session_only" || mode === "supabase_preferred";
}

export function isSupabaseMissionPersistenceRequired(
  mode: MissionExecutionPersistenceMode,
): boolean {
  return mode === "supabase_required";
}
