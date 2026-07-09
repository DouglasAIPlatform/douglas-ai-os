import type { AuthProfile, AuthRole, AuthUser } from "./AuthTypes";

/** Minimal operator shape aligned with @douglas/security Operator. */
export interface MappedOperator {
  id: string;
  name: string;
  role: AuthRole;
}

/**
 * Maps an authenticated user + operator_profiles row to the effective operator
 * consumed by OperatorProvider.operatorOverride.
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
  };
}
