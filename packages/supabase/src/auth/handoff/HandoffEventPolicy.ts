import type { HandoffEventTopic } from "./HandoffEventKey";
import type { HandoffStateSnapshot } from "./HandoffStateSnapshot";
import { handoffSnapshotsEqual } from "./HandoffStateSnapshot";
import { normalizeHandoffState } from "../OperatorFallbackPolicy";

export type HandoffTransitionReason =
  | "handoff_state_changed"
  | "user_id_changed"
  | "profile_role_changed";

export const HANDOFF_TRANSITION_REASON_LABELS: Record<HandoffTransitionReason, string> = {
  handoff_state_changed: "Estado de handoff alterado",
  user_id_changed: "Usuário autenticado alterado",
  profile_role_changed: "Role do profile alterada",
};

export interface HandoffTransition {
  previous: HandoffStateSnapshot;
  current: HandoffStateSnapshot;
  reasons: HandoffTransitionReason[];
  primaryReason: HandoffTransitionReason;
}

export interface HandoffRelevantTransition extends HandoffTransition {
  emittedTopics: HandoffEventTopic[];
  timestamp: string;
  message?: string;
}

function isProfileRoleChange(
  previous: HandoffStateSnapshot,
  current: HandoffStateSnapshot,
): boolean {
  return (
    normalizeHandoffState(current.handoffState) === "authenticated_with_active_profile" &&
    previous.authProfileRole !== current.authProfileRole &&
    current.authProfileRole !== null
  );
}

function isUserIdChange(
  previous: HandoffStateSnapshot,
  current: HandoffStateSnapshot,
): boolean {
  return previous.userId !== current.userId && (previous.userId !== null || current.userId !== null);
}

/** Classifica se houve mudança relevante entre dois snapshots estáveis. */
export function classifyHandoffTransition(
  previous: HandoffStateSnapshot,
  current: HandoffStateSnapshot,
): HandoffTransition | null {
  if (handoffSnapshotsEqual(previous, current)) {
    return null;
  }

  const reasons: HandoffTransitionReason[] = [];

  if (previous.handoffState !== current.handoffState) {
    reasons.push("handoff_state_changed");
  }

  if (isUserIdChange(previous, current)) {
    reasons.push("user_id_changed");
  }

  if (isProfileRoleChange(previous, current)) {
    reasons.push("profile_role_changed");
  }

  if (reasons.length === 0) {
    return null;
  }

  return {
    previous,
    current,
    reasons,
    primaryReason: reasons[0],
  };
}

function buildTransitionMessage(transition: HandoffTransition): string | undefined {
  const { previous, current, reasons } = transition;
  const currentState = normalizeHandoffState(current.handoffState);
  const previousState = normalizeHandoffState(previous.handoffState);

  if (reasons.includes("profile_role_changed")) {
    return `Role do profile alterada (${previous.authProfileRole ?? "—"} → ${current.authProfileRole ?? "—"})`;
  }

  if (reasons.includes("user_id_changed")) {
    return "Usuário autenticado alterado — handoff reavaliado";
  }

  if (previousState === "mock_operator" && currentState === "authenticated_with_active_profile") {
    return "Operador efetivo derivado do operator profile ativo";
  }

  if (previousState === "profile_missing" && currentState === "authenticated_with_active_profile") {
    return "Profile ativo encontrado — RBAC migrado para auth profile";
  }

  if (
    previousState === "authenticated_with_active_profile" &&
    current.handoffState === "profile_error"
  ) {
    return "Erro de auth/profile — fallback mock ativo";
  }

  if (currentState === "profile_missing") {
    return "Sessão autenticada sem operator_profiles — fallback mock ativo";
  }

  if (currentState === "authenticated_with_inactive_profile") {
    return "Profile inativo — fallback mock em development (RBAC do profile bloqueado)";
  }

  if (currentState === "blocked_by_profile_status") {
    return "Profile inativo — operador bloqueado (staging/production)";
  }

  if (current.handoffState === "profile_error") {
    return "Erro de auth/profile — fallback mock ativo";
  }

  return undefined;
}

/** Resolve tópicos a publicar para uma transição relevante. */
export function resolveHandoffEventTopics(
  transition: HandoffTransition,
): HandoffEventTopic[] {
  const topics: HandoffEventTopic[] = ["auth:operator:handoff_started"];
  const state = normalizeHandoffState(transition.current.handoffState);

  switch (state) {
    case "authenticated_with_active_profile":
      topics.push("auth:operator:handoff_completed");
      break;
    case "profile_missing":
    case "authenticated_with_inactive_profile":
      topics.push("auth:operator:handoff_fallback");
      break;
    case "blocked_by_profile_status":
      topics.push("auth:operator:handoff_failed");
      break;
    case "profile_error":
      topics.push("auth:operator:handoff_failed");
      topics.push("auth:operator:handoff_fallback");
      break;
    default:
      break;
  }

  return topics;
}

export function describeHandoffTransition(
  transition: HandoffTransition,
  emittedTopics: HandoffEventTopic[],
  timestamp: string,
): HandoffRelevantTransition {
  return {
    ...transition,
    emittedTopics,
    timestamp,
    message: buildTransitionMessage(transition),
  };
}
