export type RBACCatalogMismatchKind =
  | "role_missing"
  | "role_extra"
  | "permission_missing"
  | "permission_extra"
  | "owner_exclusive_missing"
  | "owner_exclusive_extra"
  | "role_permission_missing"
  | "role_permission_extra"
  | "owner_exclusive_on_non_owner"
  | "unknown_role"
  | "sql_seed_incomplete"
  | "sql_seed_extra";

export type RBACCatalogMismatchSeverity = "error" | "warning";

export interface RBACCatalogMismatch {
  kind: RBACCatalogMismatchKind;
  severity: RBACCatalogMismatchSeverity;
  sourceId: string;
  role?: string;
  permission?: string;
  message: string;
}

export function createRBACCatalogMismatch(
  kind: RBACCatalogMismatchKind,
  severity: RBACCatalogMismatchSeverity,
  sourceId: string,
  message: string,
  details: { role?: string; permission?: string } = {},
): RBACCatalogMismatch {
  return {
    kind,
    severity,
    sourceId,
    message,
    ...details,
  };
}
