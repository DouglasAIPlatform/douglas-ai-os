import type { CanonicalOperatorRole } from "./RBACCatalogCanonical.ts";
import {
  CANONICAL_OPERATOR_ROLES,
  CANONICAL_OWNER_EXCLUSIVE_PERMISSIONS,
  CANONICAL_PERMISSIONS,
  CANONICAL_ROLE_PERMISSIONS,
  RBAC_CATALOG_DOCUMENT,
} from "./RBACCatalogCanonical.ts";

/** Identificadores estáveis para cada catálogo derivado comparado ao canônico. */
export type RBACCatalogSourceId =
  | "canonical"
  | "client"
  | "server"
  | "edge"
  | "sql_seed";

export interface RBACCatalogSnapshot {
  sourceId: RBACCatalogSourceId;
  roles: string[];
  permissions: string[];
  ownerExclusive: string[];
  rolePermissions: Record<string, string[]>;
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function normalizeRolePermissions(
  rolePermissions: Record<string, readonly string[]>,
): Record<string, string[]> {
  const normalized: Record<string, string[]> = {};

  for (const [role, permissions] of Object.entries(rolePermissions)) {
    normalized[role] = sortedUnique(permissions);
  }

  return normalized;
}

export function buildRBACCatalogSnapshot(
  sourceId: RBACCatalogSourceId,
  rolePermissions: Record<string, readonly string[]>,
  ownerExclusive: readonly string[],
): RBACCatalogSnapshot {
  const normalizedRolePermissions = normalizeRolePermissions(rolePermissions);
  const roles = sortedUnique(Object.keys(normalizedRolePermissions));
  const permissions = sortedUnique(
    roles.flatMap((role) => normalizedRolePermissions[role] ?? []),
  );

  return {
    sourceId,
    roles,
    permissions,
    ownerExclusive: sortedUnique(ownerExclusive),
    rolePermissions: normalizedRolePermissions,
  };
}

export function buildCanonicalRBACCatalogSnapshot(): RBACCatalogSnapshot {
  return buildRBACCatalogSnapshot(
    "canonical",
    CANONICAL_ROLE_PERMISSIONS,
    CANONICAL_OWNER_EXCLUSIVE_PERMISSIONS,
  );
}

export function buildClientRBACCatalogSnapshot(
  rolePermissions: Record<CanonicalOperatorRole, readonly string[]>,
  ownerExclusive: readonly string[],
): RBACCatalogSnapshot {
  return buildRBACCatalogSnapshot("client", rolePermissions, ownerExclusive);
}

export function buildServerRBACCatalogSnapshot(
  rolePermissions: Record<CanonicalOperatorRole, readonly string[]>,
  ownerExclusive: readonly string[],
): RBACCatalogSnapshot {
  return buildRBACCatalogSnapshot("server", rolePermissions, ownerExclusive);
}

export function isKnownOperatorRole(role: string): role is CanonicalOperatorRole {
  return (CANONICAL_OPERATOR_ROLES as readonly string[]).includes(role);
}

export function allCanonicalPermissions(): string[] {
  return sortedUnique(CANONICAL_PERMISSIONS);
}

export function catalogDocumentPathHint(): string {
  return "packages/security/rbac-catalog.json";
}

export function expectedSqlSeedMigrationFiles(): readonly string[] {
  return [
    "20250707130000_platform_helpers.sql",
    "20250710190000_owner_permission_seed.sql",
  ] as const;
}

export { RBAC_CATALOG_DOCUMENT };
