import type { MissionExecutionPersistenceMode } from "../MissionExecutionPersistenceMode";
import { isSupabaseMissionPersistenceRequired } from "../MissionExecutionPersistenceMode";

export type MissionPersistenceFallbackSeverity = "ok" | "warning" | "blocker";

export interface MissionPersistenceFallbackEvaluation {
  severity: MissionPersistenceFallbackSeverity;
  fallbackActive: boolean;
  pendingSyncCount: number;
  remotePersistConfirmed: boolean;
  messages: string[];
  stagingBlocker: boolean;
}

/** Avalia fallback sessionStorage — staging exige supabase_required sem fallback silencioso. */
export function evaluateMissionPersistenceFallback(input: {
  environment: string;
  configuredMode: MissionExecutionPersistenceMode;
  effectiveMode: MissionExecutionPersistenceMode;
  fallbackActive: boolean;
  pendingSyncCount: number;
  remotePersistConfirmed?: boolean;
}): MissionPersistenceFallbackEvaluation {
  const isStaging = input.environment === "staging";
  const isProduction = input.environment === "production";
  const strictRemote = isStaging || isProduction;
  const required = isSupabaseMissionPersistenceRequired(input.configuredMode);
  const messages: string[] = [];
  let severity: MissionPersistenceFallbackSeverity = "ok";

  if (input.fallbackActive) {
    messages.push("Fallback sessionStorage ativo.");
    severity = strictRemote ? "blocker" : "warning";
  }

  if (input.pendingSyncCount > 0) {
    messages.push(`${input.pendingSyncCount} item(ns) na pending queue.`);
    severity = strictRemote ? "blocker" : severity === "ok" ? "warning" : severity;
  }

  if (strictRemote && required && input.effectiveMode !== "supabase_required") {
    messages.push("Modo efetivo diverge de supabase_required em staging/production.");
    severity = "blocker";
  }

  if (
    input.remotePersistConfirmed === false
    && strictRemote
    && !input.fallbackActive
    && input.pendingSyncCount === 0
  ) {
    messages.push("Persistência remota ainda não confirmada.");
  }

  if (input.environment === "development" && input.fallbackActive) {
    messages.push("Development: fallback sessionStorage permitido (supabase_preferred).");
    if (severity === "blocker") {
      severity = "warning";
    }
  }

  return {
    severity,
    fallbackActive: input.fallbackActive,
    pendingSyncCount: input.pendingSyncCount,
    remotePersistConfirmed: input.remotePersistConfirmed ?? false,
    messages,
    stagingBlocker: isStaging && severity === "blocker",
  };
}
