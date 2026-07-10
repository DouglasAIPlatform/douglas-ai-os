import { isMockRoleChangeAllowedByEnvironment } from "@douglas/environment";
import type { AuthProfile, AuthOperatorHandoffState, AuthSessionState, OperatorRoleSource } from "./AuthTypes";

/** Profile operacional com status active — único elegível para RBAC autorizado. */
export function isActiveOperatorProfile(
  profile: Pick<AuthProfile, "status"> | null | undefined,
): profile is AuthProfile & { status: "active" } {
  return profile?.status === "active";
}

/**
 * Em development, fallback mock para profile inativo é permitido quando a política de ambiente autoriza mocks.
 * Em staging/production, profile inativo resulta em bloqueio (sem role poderosa do profile).
 */
export function allowsInactiveProfileMockFallback(): boolean {
  return isMockRoleChangeAllowedByEnvironment();
}

/**
 * Resolves the handoff lifecycle state from the current auth session.
 */
export function resolveHandoffState(
  session: Pick<AuthSessionState, "status" | "provider" | "user" | "profile">,
): AuthOperatorHandoffState {
  if (session.status === "not_configured" || session.provider === "none") {
    return "not_configured";
  }

  if (session.status === "error") {
    return "profile_error";
  }

  if (session.status !== "authenticated" || !session.user) {
    return "mock_operator";
  }

  if (!session.profile) {
    return "profile_missing";
  }

  if (isActiveOperatorProfile(session.profile)) {
    return "authenticated_with_active_profile";
  }

  if (allowsInactiveProfileMockFallback()) {
    return "authenticated_with_inactive_profile";
  }

  return "blocked_by_profile_status";
}

/**
 * Determines whether OperatorProvider should keep using the mock operator.
 */
export function shouldUseMockOperator(handoffState: AuthOperatorHandoffState): boolean {
  switch (handoffState) {
    case "authenticated_with_active_profile":
    case "blocked_by_profile_status":
      return false;
    default:
      return true;
  }
}

/**
 * Maps handoff state to the effective operator role source label.
 */
export function resolveOperatorRoleSource(
  handoffState: AuthOperatorHandoffState,
): OperatorRoleSource {
  switch (handoffState) {
    case "authenticated_with_active_profile":
      return "auth_profile";
    case "blocked_by_profile_status":
      return "blocked";
    case "authenticated_with_inactive_profile":
    case "profile_missing":
    case "profile_error":
      return "fallback";
    default:
      return "mock";
  }
}

/**
 * Whether Headquarters should warn that auth is active but RBAC still uses mock.
 */
export function shouldShowAuthMockWarning(handoffState: AuthOperatorHandoffState): boolean {
  return handoffState === "profile_missing" || handoffState === "profile_error";
}

export function shouldShowProfileInactiveWarning(
  handoffState: AuthOperatorHandoffState,
): boolean {
  return handoffState === "authenticated_with_inactive_profile";
}

export function isBlockedByProfileStatus(handoffState: AuthOperatorHandoffState): boolean {
  return handoffState === "blocked_by_profile_status";
}

/** Normaliza estados legados para comparação em eventos e widgets. */
export function normalizeHandoffState(state: AuthOperatorHandoffState): AuthOperatorHandoffState {
  if (state === "authenticated_with_profile") {
    return "authenticated_with_active_profile";
  }
  if (state === "authenticated_without_profile") {
    return "profile_missing";
  }
  return state;
}
