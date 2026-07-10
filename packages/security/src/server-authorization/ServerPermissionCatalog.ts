import { ROLE_PERMISSIONS } from "../Permission";
import type { OperatorRole } from "../SecurityTypes";
import { OWNER_EXCLUSIVE_PERMISSIONS } from "../Permission";
import { SERVER_PERMISSIONS, type ServerPermission } from "./ServerPermission";

/** Catálogo server-side — espelho de ROLE_PERMISSIONS (@douglas/security). */
export const SERVER_ROLE_PERMISSIONS: Record<OperatorRole, ServerPermission[]> = {
  viewer: [...ROLE_PERMISSIONS.viewer],
  operator: [...ROLE_PERMISSIONS.operator],
  admin: [...ROLE_PERMISSIONS.admin],
  owner: [...ROLE_PERMISSIONS.owner],
};

export function serverRoleHasPermission(
  role: OperatorRole,
  permission: ServerPermission,
): boolean {
  return SERVER_ROLE_PERMISSIONS[role].includes(permission);
}

export function getServerRolePermissions(role: OperatorRole): ServerPermission[] {
  return [...SERVER_ROLE_PERMISSIONS[role]];
}

/** Ingest remoto exige permissão operacional — viewer só possui platform:view. */
export function canIngestAuditRemotely(role: OperatorRole): boolean {
  return serverRoleHasPermission(role, "runtime:refresh");
}

export function roleHasOwnerExclusiveServerPermission(role: OperatorRole): boolean {
  return OWNER_EXCLUSIVE_PERMISSIONS.some((permission) =>
    serverRoleHasPermission(role, permission),
  );
}

export { OWNER_EXCLUSIVE_PERMISSIONS as SERVER_OWNER_EXCLUSIVE_PERMISSIONS };

export function assertServerCatalogAlignedWithClient(): boolean {
  for (const permission of SERVER_PERMISSIONS) {
    for (const role of Object.keys(SERVER_ROLE_PERMISSIONS) as OperatorRole[]) {
      const clientHas = ROLE_PERMISSIONS[role].includes(permission);
      const serverHas = SERVER_ROLE_PERMISSIONS[role].includes(permission);
      if (clientHas !== serverHas) {
        return false;
      }
    }
  }
  return true;
}

/** SQL operator_role_permissions seed — ordem estável para verificação estática. */
export const EXPECTED_SQL_PERMISSION_SEED: ReadonlyArray<{
  role: OperatorRole;
  permission: ServerPermission;
}> = [
  ...(["owner", "admin", "operator", "viewer"] as OperatorRole[]).flatMap((role) =>
    SERVER_ROLE_PERMISSIONS[role].map((permission) => ({ role, permission })),
  ),
];
