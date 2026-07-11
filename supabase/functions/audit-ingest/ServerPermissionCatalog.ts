/**
 * Catálogo server-side — espelho de @douglas/security.
 * Edge Functions não importam o monorepo; manter alinhado com packages/security/rbac-catalog.json.
 * Verificação: pnpm rbac:drift-check
 */

export type PlatformOperatorRole = "owner" | "admin" | "operator" | "viewer";

export type ServerPermission =
  | "platform:view"
  | "runtime:refresh"
  | "runtime:health_check"
  | "runtime:pause"
  | "runtime:resume"
  | "runtime:restart"
  | "security:manage_roles"
  | "security:manage_owners"
  | "release:approve_production"
  | "platform:critical_configuration";

export const OWNER_EXCLUSIVE_PERMISSIONS: ServerPermission[] = [
  "security:manage_roles",
  "security:manage_owners",
  "release:approve_production",
  "platform:critical_configuration",
];

export const SERVER_ROLE_PERMISSIONS: Record<PlatformOperatorRole, ServerPermission[]> = {
  viewer: ["platform:view"],
  operator: ["platform:view", "runtime:refresh", "runtime:health_check"],
  admin: [
    "platform:view",
    "runtime:refresh",
    "runtime:health_check",
    "runtime:pause",
    "runtime:resume",
    "runtime:restart",
  ],
  owner: [
    "platform:view",
    "runtime:refresh",
    "runtime:health_check",
    "runtime:pause",
    "runtime:resume",
    "runtime:restart",
    ...OWNER_EXCLUSIVE_PERMISSIONS,
  ],
};

export function serverRoleHasPermission(
  role: PlatformOperatorRole,
  permission: ServerPermission,
): boolean {
  return SERVER_ROLE_PERMISSIONS[role].includes(permission);
}

export function roleHasOwnerExclusivePermission(role: PlatformOperatorRole): boolean {
  return OWNER_EXCLUSIVE_PERMISSIONS.some((permission) =>
    serverRoleHasPermission(role, permission),
  );
}

export function canIngestAuditRemotely(role: PlatformOperatorRole): boolean {
  return SERVER_ROLE_PERMISSIONS[role].includes("runtime:refresh");
}
