/**
 * Whether OperatorProvider allows free mock role switching (development only).
 * In production, mock role changes are blocked — RBAC must come from auth profile + RLS.
 */
export function isMockRoleChangeAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}
