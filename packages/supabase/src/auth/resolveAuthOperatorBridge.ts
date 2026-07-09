import type { AuthOperatorBridgeResult, AuthRole, AuthSessionState } from "./AuthTypes";
import { resolveEffectiveOperator } from "./EffectiveOperatorResolver";

/**
 * Resolves how auth session relates to OperatorProvider during gradual migration.
 * When an operator profile exists, auth profile becomes the effective RBAC source.
 */
export function resolveAuthOperatorBridge(
  session: Pick<
    AuthSessionState,
    "status" | "provider" | "user" | "profile" | "authRole" | "mode" | "error"
  >,
  mockRole: AuthRole,
): AuthOperatorBridgeResult {
  const resolution = resolveEffectiveOperator(session, mockRole);

  return {
    handoffState: resolution.handoffState,
    effectiveRole: resolution.effectiveRole,
    isUsingMockOperator: resolution.isUsingMockOperator,
    operatorSource: resolution.operatorSource,
    authProfileRole: resolution.authProfileRole,
    showAuthMockWarning: resolution.showAuthMockWarning,
  };
}
