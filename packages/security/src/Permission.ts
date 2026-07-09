import type { OperatorRole, Permission } from "./SecurityTypes";

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
  ],
};

export function roleHasPermission(role: OperatorRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getRolePermissions(role: OperatorRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function canViewPlatform(role: OperatorRole): boolean {
  return roleHasPermission(role, "platform:view");
}

export function canExecuteRuntimeActions(role: OperatorRole): boolean {
  return role !== "viewer";
}
