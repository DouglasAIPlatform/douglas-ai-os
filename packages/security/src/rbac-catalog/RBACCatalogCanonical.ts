import catalogDocument from "../../rbac-catalog.json" with { type: "json" };

export const RBAC_CATALOG_SCHEMA_VERSION = 1;

export type CanonicalOperatorRole = "viewer" | "operator" | "admin" | "owner";

export interface RBACCatalogDocument {
  schemaVersion: number;
  roles: CanonicalOperatorRole[];
  permissions: string[];
  ownerExclusive: string[];
  rolePermissions: Record<CanonicalOperatorRole, string[]>;
}

function assertCatalogDocument(value: unknown): RBACCatalogDocument {
  if (!value || typeof value !== "object") {
    throw new Error("rbac-catalog.json inválido — documento ausente.");
  }

  const doc = value as RBACCatalogDocument;

  if (doc.schemaVersion !== RBAC_CATALOG_SCHEMA_VERSION) {
    throw new Error(
      `rbac-catalog.json schemaVersion ${doc.schemaVersion} incompatível — esperado ${RBAC_CATALOG_SCHEMA_VERSION}.`,
    );
  }

  if (!Array.isArray(doc.roles) || doc.roles.length === 0) {
    throw new Error("rbac-catalog.json inválido — roles ausentes.");
  }

  if (!Array.isArray(doc.permissions) || doc.permissions.length === 0) {
    throw new Error("rbac-catalog.json inválido — permissions ausentes.");
  }

  if (!Array.isArray(doc.ownerExclusive)) {
    throw new Error("rbac-catalog.json inválido — ownerExclusive ausente.");
  }

  if (!doc.rolePermissions || typeof doc.rolePermissions !== "object") {
    throw new Error("rbac-catalog.json inválido — rolePermissions ausente.");
  }

  return doc;
}

/** Fonte canônica RBAC — JSON neutro importável por client, Node e verificadores estáticos. */
export const RBAC_CATALOG_DOCUMENT = assertCatalogDocument(catalogDocument);

export const CANONICAL_OPERATOR_ROLES = [...RBAC_CATALOG_DOCUMENT.roles] as CanonicalOperatorRole[];

export const CANONICAL_PERMISSIONS = [...RBAC_CATALOG_DOCUMENT.permissions];

export const CANONICAL_OWNER_EXCLUSIVE_PERMISSIONS = [
  ...RBAC_CATALOG_DOCUMENT.ownerExclusive,
];

export const CANONICAL_ROLE_PERMISSIONS: Record<CanonicalOperatorRole, readonly string[]> = {
  viewer: [...RBAC_CATALOG_DOCUMENT.rolePermissions.viewer],
  operator: [...RBAC_CATALOG_DOCUMENT.rolePermissions.operator],
  admin: [...RBAC_CATALOG_DOCUMENT.rolePermissions.admin],
  owner: [...RBAC_CATALOG_DOCUMENT.rolePermissions.owner],
};
