import type { OperatorRole, Permission } from "./SecurityTypes";

/** Permissões reservadas exclusivamente ao owner — policy, gates e testes futuros. */
export const OWNER_EXCLUSIVE_PERMISSIONS: Permission[] = [
  "security:manage_roles",
  "security:manage_owners",
  "release:approve_production",
  "platform:critical_configuration",
];

export const ROLE_PERMISSIONS: Record<OperatorRole, Permission[]> = {
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

export function roleHasPermission(role: OperatorRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getRolePermissions(role: OperatorRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function roleHasOwnerExclusivePermission(role: OperatorRole): boolean {
  return OWNER_EXCLUSIVE_PERMISSIONS.some((permission) => roleHasPermission(role, permission));
}

export function canViewPlatform(role: OperatorRole): boolean {
  return roleHasPermission(role, "platform:view");
}

export function canExecuteRuntimeActions(role: OperatorRole): boolean {
  return role !== "viewer";
}
