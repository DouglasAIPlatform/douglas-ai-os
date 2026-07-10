/** Roles reconhecidas em operator_profiles (alinhado com PlatformSchemaTypes). */
export type PlatformOperatorRole = "owner" | "admin" | "operator" | "viewer";

export type PlatformOperatorStatus = "active" | "invited" | "suspended";

/** Operador autorizado após auth + lookup em operator_profiles. */
export interface AuthorizedOperator {
  profileId: string;
  userId: string;
  displayName: string;
  role: PlatformOperatorRole;
  status: PlatformOperatorStatus;
}

const PLATFORM_ROLES = new Set<PlatformOperatorRole>([
  "owner",
  "admin",
  "operator",
  "viewer",
]);

const PLATFORM_STATUSES = new Set<PlatformOperatorStatus>([
  "active",
  "invited",
  "suspended",
]);

export function parseOperatorProfileRow(row: Record<string, unknown>): AuthorizedOperator | null {
  const id = typeof row.id === "string" ? row.id : null;
  const userId = typeof row.user_id === "string" ? row.user_id : null;
  const displayName = typeof row.display_name === "string" ? row.display_name : null;
  const role = typeof row.role === "string" ? row.role : null;
  const status = typeof row.status === "string" ? row.status : null;

  if (!id || !userId || !displayName || !role || !status) {
    return null;
  }

  if (!PLATFORM_ROLES.has(role as PlatformOperatorRole)) {
    return null;
  }

  if (!PLATFORM_STATUSES.has(status as PlatformOperatorStatus)) {
    return null;
  }

  return {
    profileId: id,
    userId,
    displayName,
    role: role as PlatformOperatorRole,
    status: status as PlatformOperatorStatus,
  };
}
