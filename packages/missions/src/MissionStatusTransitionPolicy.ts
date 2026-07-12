import type { MissionStatus } from "./MissionTypes";

export type MissionStatusTransitionDecision = "apply" | "noop" | "reject";

/** Transições válidas do Mission Board — Sprint 5.49.1 */
export const VALID_MISSION_BOARD_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  draft: ["planned", "archived"],
  planned: ["active", "blocked", "archived"],
  active: ["blocked", "completed", "archived"],
  blocked: ["active", "completed", "archived"],
  completed: ["archived"],
  failed: ["blocked", "archived"],
  archived: [],
};

export interface MissionStatusTransitionResult {
  decision: MissionStatusTransitionDecision;
  from: MissionStatus;
  to: MissionStatus;
  reason?: string;
}

export function evaluateMissionStatusTransition(
  from: MissionStatus,
  to: MissionStatus,
): MissionStatusTransitionResult {
  if (from === to) {
    return {
      decision: "noop",
      from,
      to,
      reason: "Estado inalterado — transição ignorada",
    };
  }

  const allowed = VALID_MISSION_BOARD_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    return {
      decision: "reject",
      from,
      to,
      reason: `Transição inválida: ${from} → ${to}`,
    };
  }

  return { decision: "apply", from, to };
}
