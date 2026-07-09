import type { AuthOperatorBridgeResult, AuthRole, AuthSessionState } from "./AuthTypes";
import { mapAuthProfileToOperator, type MappedOperator } from "./OperatorProfileMapper";
import {
  resolveHandoffState,
  resolveOperatorRoleSource,
  shouldShowAuthMockWarning,
  shouldUseMockOperator,
} from "./OperatorFallbackPolicy";

export interface EffectiveOperatorResolution extends AuthOperatorBridgeResult {
  operatorOverride: MappedOperator | null;
}

/**
 * Resolves the effective operator handoff from auth session + mock fallback role.
 * When a profile exists, auth profile becomes authoritative for RBAC.
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
  const isUsingMockOperator = shouldUseMockOperator(handoffState);
  const showAuthMockWarning = shouldShowAuthMockWarning(handoffState);

  let operatorOverride: MappedOperator | null = null;
  let effectiveRole = mockRole;

  if (handoffState === "authenticated_with_profile" && session.profile && session.user) {
    operatorOverride = mapAuthProfileToOperator(session.profile, session.user);
    effectiveRole = operatorOverride.role;
  }

  return {
    handoffState,
    effectiveRole,
    isUsingMockOperator,
    operatorSource,
    authProfileRole,
    showAuthMockWarning,
    operatorOverride,
  };
}
