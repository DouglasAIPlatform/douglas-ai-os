import type { AuthOperatorBridgeResult, AuthRole, AuthSessionState } from "./AuthTypes";
import { mapAuthProfileToOperator, type MappedOperator } from "./OperatorProfileMapper";
import {
  isBlockedByProfileStatus,
  resolveHandoffState,
  resolveOperatorRoleSource,
  shouldShowAuthMockWarning,
  shouldShowProfileInactiveWarning,
  shouldUseMockOperator,
} from "./OperatorFallbackPolicy";

export interface EffectiveOperatorResolution extends AuthOperatorBridgeResult {
  operatorOverride: MappedOperator | null;
}

/**
 * Resolves the effective operator handoff from auth session + mock fallback role.
 * Only active operator_profiles produce authorized operatorOverride.
 */
export function resolveEffectiveOperator(
  session: Pick<
    AuthSessionState,
    "status" | "provider" | "user" | "profile" | "authRole" | "mode" | "error"
  >,
  mockRole: AuthRole,
): EffectiveOperatorResolution {
  const handoffState = resolveHandoffState(session);
  const operatorSource = resolveOperatorRoleSource(handoffState);
  const authProfileRole = session.profile?.role ?? session.authRole ?? null;
  const profileStatus = session.profile?.status ?? null;
  const isUsingMockOperator = shouldUseMockOperator(handoffState);
  const showAuthMockWarning = shouldShowAuthMockWarning(handoffState);
  const showProfileInactiveWarning = shouldShowProfileInactiveWarning(handoffState);
  const blockedByProfileStatus = isBlockedByProfileStatus(handoffState);

  let operatorOverride: MappedOperator | null = null;
  let effectiveRole: AuthRole = mockRole;

  if (
    handoffState === "authenticated_with_active_profile" &&
    session.profile &&
    session.user
  ) {
    operatorOverride = mapAuthProfileToOperator(session.profile, session.user);
    effectiveRole = operatorOverride.role;
  } else if (handoffState === "authenticated_with_inactive_profile") {
    operatorOverride = null;
    effectiveRole = mockRole;
  } else if (blockedByProfileStatus && session.profile && session.user) {
    operatorOverride = {
      ...mapAuthProfileToOperator(session.profile, session.user),
      role: "viewer",
      isActive: false,
    };
    effectiveRole = "viewer";
  } else if (blockedByProfileStatus) {
    operatorOverride = {
      id: "blocked-profile",
      name: "Operador bloqueado",
      role: "viewer",
      status: profileStatus ?? "suspended",
      isActive: false,
    };
    effectiveRole = "viewer";
  }

  return {
    handoffState,
    effectiveRole,
    isUsingMockOperator,
    operatorSource,
    authProfileRole,
    showAuthMockWarning,
    showProfileInactiveWarning,
    isBlockedByProfileStatus: blockedByProfileStatus,
    profileStatus,
    operatorOverride,
  };
}
