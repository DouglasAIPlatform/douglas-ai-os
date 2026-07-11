import {
  createRBACCatalogMismatch,
  type RBACCatalogMismatch,
} from "./RBACCatalogMismatch.ts";
import { isKnownOperatorRole, type RBACCatalogSnapshot } from "./RBACCatalogSnapshot.ts";

export interface RBACCatalogComparisonResult {
  sourceId: string;
  aligned: boolean;
  mismatches: RBACCatalogMismatch[];
}

function diffSortedLists(
  expected: string[],
  actual: string[],
): { missing: string[]; extra: string[] } {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);

  return {
    missing: expected.filter((item) => !actualSet.has(item)),
    extra: actual.filter((item) => !expectedSet.has(item)),
  };
}

function compareRolePermissions(
  sourceId: string,
  canonical: RBACCatalogSnapshot,
  target: RBACCatalogSnapshot,
): RBACCatalogMismatch[] {
  const mismatches: RBACCatalogMismatch[] = [];
  const roles = new Set([...canonical.roles, ...target.roles]);

  for (const role of roles) {
    if (!isKnownOperatorRole(role)) {
      mismatches.push(
        createRBACCatalogMismatch(
          "unknown_role",
          "error",
          sourceId,
          `Role desconhecida "${role}" em ${sourceId}.`,
          { role },
        ),
      );
      continue;
    }

    const expected = canonical.rolePermissions[role] ?? [];
    const actual = target.rolePermissions[role] ?? [];
    const { missing, extra } = diffSortedLists(expected, actual);

    for (const permission of missing) {
      mismatches.push(
        createRBACCatalogMismatch(
          "role_permission_missing",
          "error",
          sourceId,
          `${sourceId}: role ${role} não possui permissão ${permission}.`,
          { role, permission },
        ),
      );
    }

    for (const permission of extra) {
      mismatches.push(
        createRBACCatalogMismatch(
          "role_permission_extra",
          "error",
          sourceId,
          `${sourceId}: role ${role} possui permissão extra ${permission}.`,
          { role, permission },
        ),
      );
    }
  }

  return mismatches;
}

function compareOwnerExclusiveList(
  sourceId: string,
  canonical: RBACCatalogSnapshot,
  target: RBACCatalogSnapshot,
): RBACCatalogMismatch[] {
  const mismatches: RBACCatalogMismatch[] = [];
  const { missing, extra } = diffSortedLists(canonical.ownerExclusive, target.ownerExclusive);

  for (const permission of missing) {
    mismatches.push(
      createRBACCatalogMismatch(
        "owner_exclusive_missing",
        "error",
        sourceId,
        `${sourceId}: owner-exclusive ausente ${permission}.`,
        { permission },
      ),
    );
  }

  for (const permission of extra) {
    mismatches.push(
      createRBACCatalogMismatch(
        "owner_exclusive_extra",
        "error",
        sourceId,
        `${sourceId}: owner-exclusive extra ${permission}.`,
        { permission },
      ),
    );
  }

  return mismatches;
}

function detectOwnerExclusiveOnNonOwner(
  sourceId: string,
  target: RBACCatalogSnapshot,
): RBACCatalogMismatch[] {
  const mismatches: RBACCatalogMismatch[] = [];
  const ownerExclusiveSet = new Set(target.ownerExclusive);

  for (const [role, permissions] of Object.entries(target.rolePermissions)) {
    if (role === "owner") {
      continue;
    }

    for (const permission of permissions) {
      if (ownerExclusiveSet.has(permission)) {
        mismatches.push(
          createRBACCatalogMismatch(
            "owner_exclusive_on_non_owner",
            "error",
            sourceId,
            `${sourceId}: admin/role ${role} recebe permissão owner-exclusive ${permission}.`,
            { role, permission },
          ),
        );
      }
    }
  }

  return mismatches;
}

function compareRoles(
  sourceId: string,
  canonical: RBACCatalogSnapshot,
  target: RBACCatalogSnapshot,
): RBACCatalogMismatch[] {
  const mismatches: RBACCatalogMismatch[] = [];
  const { missing, extra } = diffSortedLists(canonical.roles, target.roles);

  for (const role of missing) {
    mismatches.push(
      createRBACCatalogMismatch(
        "role_missing",
        "error",
        sourceId,
        `${sourceId}: role ausente ${role}.`,
        { role },
      ),
    );
  }

  for (const role of extra) {
    mismatches.push(
      createRBACCatalogMismatch(
        "role_extra",
        "error",
        sourceId,
        `${sourceId}: role extra ${role}.`,
        { role },
      ),
    );
  }

  return mismatches;
}

function comparePermissions(
  sourceId: string,
  canonical: RBACCatalogSnapshot,
  target: RBACCatalogSnapshot,
): RBACCatalogMismatch[] {
  const mismatches: RBACCatalogMismatch[] = [];
  const { missing, extra } = diffSortedLists(canonical.permissions, target.permissions);

  for (const permission of missing) {
    mismatches.push(
      createRBACCatalogMismatch(
        "permission_missing",
        "error",
        sourceId,
        `${sourceId}: permissão ausente ${permission}.`,
        { permission },
      ),
    );
  }

  for (const permission of extra) {
    mismatches.push(
      createRBACCatalogMismatch(
        "permission_extra",
        "error",
        sourceId,
        `${sourceId}: permissão extra ${permission}.`,
        { permission },
      ),
    );
  }

  return mismatches;
}

/** Compara um catálogo derivado contra o snapshot canônico. */
export function compareRBACCatalogSnapshots(
  canonical: RBACCatalogSnapshot,
  target: RBACCatalogSnapshot,
): RBACCatalogComparisonResult {
  if (target.sourceId === "canonical") {
    return { sourceId: target.sourceId, aligned: true, mismatches: [] };
  }

  const sourceId = target.sourceId;
  const mismatches: RBACCatalogMismatch[] = [
    ...compareRoles(sourceId, canonical, target),
    ...comparePermissions(sourceId, canonical, target),
    ...compareOwnerExclusiveList(sourceId, canonical, target),
    ...compareRolePermissions(sourceId, canonical, target),
    ...detectOwnerExclusiveOnNonOwner(sourceId, target),
  ];

  const errors = mismatches.filter((item) => item.severity === "error");

  return {
    sourceId,
    aligned: errors.length === 0,
    mismatches,
  };
}
