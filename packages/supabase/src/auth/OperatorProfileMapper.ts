import type { AuthProfile, AuthRole, AuthUser } from "./AuthTypes";
import { isActiveOperatorProfile } from "./OperatorFallbackPolicy";

/** Minimal operator shape aligned with @douglas/security Operator. */
export interface MappedOperator {
  id: string;
  name: string;
  role: AuthRole;
  status: AuthProfile["status"];
  isActive: boolean;
}

/**
 * Maps an authenticated user + operator_profiles row to the effective operator
 * consumed by OperatorProvider.operatorOverride.
 * Only active profiles should produce authorized overrides.
 */
export function mapAuthProfileToOperator(
  profile: AuthProfile,
  user: AuthUser,
): MappedOperator {
  const name =
    profile.displayName.trim() ||
    user.email?.trim() ||
    profile.userId;

  return {
    id: profile.id,
    name,
    role: profile.role,
    status: profile.status,
    isActive: isActiveOperatorProfile(profile),
  };
}
