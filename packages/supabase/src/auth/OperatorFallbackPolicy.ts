import type { AuthOperatorHandoffState, AuthSessionState, OperatorRoleSource } from "./AuthTypes";

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

  if (session.profile) {
    return "authenticated_with_profile";
  }

  return "authenticated_without_profile";
}

/**
 * Determines whether OperatorProvider should keep using the mock operator.
 */
export function shouldUseMockOperator(handoffState: AuthOperatorHandoffState): boolean {
  return handoffState !== "authenticated_with_profile";
}

/**
 * Maps handoff state to the effective operator role source label.
 */
export function resolveOperatorRoleSource(
  handoffState: AuthOperatorHandoffState,
): OperatorRoleSource {
  switch (handoffState) {
    case "authenticated_with_profile":
      return "auth_profile";
    case "authenticated_without_profile":
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
  return (
    handoffState === "authenticated_without_profile" ||
    handoffState === "profile_error"
  );
}
