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
  | "not_configured"
  | "profile_error"
  | "profile_missing"
  | "authenticated_with_active_profile"
  | "authenticated_with_inactive_profile"
  | "blocked_by_profile_status"
  /** @deprecated Use authenticated_with_active_profile — mantido para compatibilidade de eventos legados. */
  | "authenticated_with_profile"
  /** @deprecated Use profile_missing — mantido para compatibilidade de eventos legados. */
  | "authenticated_without_profile";

/** Source of the effective operator role enforced by PermissionGuard. */
export type OperatorRoleSource = "mock" | "auth_profile" | "fallback" | "blocked";

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
  /** True when profile exists but status !== active (development fallback). */
  showProfileInactiveWarning: boolean;
  /** True when inactive profile blocks authorization in staging/production. */
  isBlockedByProfileStatus: boolean;
  /** Status from operator_profiles when present. */
  profileStatus: PlatformOperatorStatus | null;
}
