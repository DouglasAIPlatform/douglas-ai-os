import type { Permission } from "../SecurityTypes";

/** Permissão server-side — mesmo catálogo de @douglas/security Permission. */
export type ServerPermission = Permission;

export const SERVER_PERMISSIONS = [
  "platform:view",
  "runtime:refresh",
  "runtime:health_check",
  "runtime:pause",
  "runtime:resume",
  "runtime:restart",
  "security:manage_roles",
  "security:manage_owners",
  "release:approve_production",
  "platform:critical_configuration",
] as const satisfies readonly ServerPermission[];

export function isServerPermission(value: string): value is ServerPermission {
  return (SERVER_PERMISSIONS as readonly string[]).includes(value);
}
