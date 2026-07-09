import type { PlatformOperatorRole, PlatformOperatorStatus } from "../schema";

/** Lifecycle status of the auth session layer. */
export type AuthStatus =
  | "not_configured"
  | "loading"
  | "unauthenticated"
  | "authenticated"
  | "error";

/** How Headquarters resolves operator context today. */
export type AuthMode = "mock" | "supabase_ready" | "authenticated";

/** Active auth backend (none until Supabase is configured). */
export type AuthProviderKind = "none" | "supabase";

/** Platform operator role — aligned with RLS and @douglas/security. */
export type AuthRole = PlatformOperatorRole;

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthProfile {
  id: string;
  userId: string;
  displayName: string;
  role: AuthRole;
  status: PlatformOperatorStatus;
}

export interface AuthSessionState {
  status: AuthStatus;
  mode: AuthMode;
  provider: AuthProviderKind;
  user: AuthUser | null;
  profile: AuthProfile | null;
  /** Role that would apply after full migration (profile or app metadata). */
  authRole: AuthRole | null;
  error: string | null;
}

/** Lifecycle of the auth → operator handoff bridge. */
export type AuthOperatorHandoffState =
  | "mock_operator"
  | "authenticated_without_profile"
  | "authenticated_with_profile"
  | "profile_error"
  | "not_configured";

/** Source of the effective operator role enforced by PermissionGuard. */
export type OperatorRoleSource = "mock" | "auth_profile" | "fallback";

export interface AuthOperatorBridgeResult {
  /** Resolved handoff lifecycle state. */
  handoffState: AuthOperatorHandoffState;
  /** Role currently enforced by OperatorProvider / PermissionGuard. */
  effectiveRole: AuthRole;
  /** True while mock operator remains the source of truth. */
  isUsingMockOperator: boolean;
  operatorSource: OperatorRoleSource;
  /** Role from auth profile when available (informational when fallback). */
  authProfileRole: AuthRole | null;
  /** True when authenticated but still falling back to mock operator. */
  showAuthMockWarning: boolean;
}
