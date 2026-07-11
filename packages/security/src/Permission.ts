import type { OperatorRole, Permission } from "./SecurityTypes";
import rbacCatalog from "../rbac-catalog.json" with { type: "json" };

/** Permissões reservadas exclusivamente ao owner — fonte: packages/security/rbac-catalog.json */
export const OWNER_EXCLUSIVE_PERMISSIONS: Permission[] = [
  ...rbacCatalog.ownerExclusive,
] as Permission[];

export const ROLE_PERMISSIONS: Record<OperatorRole, Permission[]> = {
  viewer: [...rbacCatalog.rolePermissions.viewer] as Permission[],
  operator: [...rbacCatalog.rolePermissions.operator] as Permission[],
  admin: [...rbacCatalog.rolePermissions.admin] as Permission[],
  owner: [...rbacCatalog.rolePermissions.owner] as Permission[],
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
