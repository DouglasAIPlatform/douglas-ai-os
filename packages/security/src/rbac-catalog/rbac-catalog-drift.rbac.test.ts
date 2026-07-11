import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import {
  parseEdgePermissionCatalog,
  parseSqlPermissionSeed,
  runRBACCatalogDriftCheck,
  EDGE_PERMISSION_CATALOG_FILE,
} from "./RBACCatalogDriftRunner";
import { ROLE_PERMISSIONS, OWNER_EXCLUSIVE_PERMISSIONS } from "../Permission";
import { SERVER_ROLE_PERMISSIONS } from "../server-authorization/ServerPermissionCatalog";
import { compareRBACCatalogSnapshots } from "./RBACCatalogComparison";
import {
  buildCanonicalRBACCatalogSnapshot,
  buildClientRBACCatalogSnapshot,
  buildRBACCatalogSnapshot,
} from "./RBACCatalogSnapshot";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..", "..", "..", "..");

describe("RBAC catalog drift guard (Sprint 5.46)", () => {
  it("canonical, client and server catalogs are aligned", () => {
    const canonical = buildCanonicalRBACCatalogSnapshot();
    const client = buildClientRBACCatalogSnapshot(
      ROLE_PERMISSIONS,
      OWNER_EXCLUSIVE_PERMISSIONS,
    );
    const server = buildRBACCatalogSnapshot(
      "server",
      SERVER_ROLE_PERMISSIONS,
      OWNER_EXCLUSIVE_PERMISSIONS,
    );

    expect(compareRBACCatalogSnapshots(canonical, client).aligned).toBe(true);
    expect(compareRBACCatalogSnapshots(canonical, server).aligned).toBe(true);
  });

  it("full drift check passes for the repository", () => {
    const report = runRBACCatalogDriftCheck(repoRoot);
    expect(report.status).toBe("passed");
    expect(report.errorCount).toBe(0);
    expect(report.comparisons.every((item) => item.aligned)).toBe(true);
  });

  it("detects missing permission in derived catalog", () => {
    const canonical = buildCanonicalRBACCatalogSnapshot();
    const drifted = buildRBACCatalogSnapshot(
      "client",
      {
        viewer: ["platform:view"],
        operator: ["platform:view"],
        admin: [...ROLE_PERMISSIONS.admin],
        owner: [...ROLE_PERMISSIONS.owner],
      },
      OWNER_EXCLUSIVE_PERMISSIONS,
    );

    const result = compareRBACCatalogSnapshots(canonical, drifted);
    expect(result.aligned).toBe(false);
    expect(result.mismatches.some((m) => m.kind === "role_permission_missing")).toBe(true);
  });

  it("detects extra permission in derived catalog", () => {
    const canonical = buildCanonicalRBACCatalogSnapshot();
    const drifted = buildClientRBACCatalogSnapshot(
      ROLE_PERMISSIONS,
      OWNER_EXCLUSIVE_PERMISSIONS,
    );

    drifted.rolePermissions.viewer = [
      ...drifted.rolePermissions.viewer,
      "runtime:refresh",
    ];

    const result = compareRBACCatalogSnapshots(canonical, drifted);
    expect(result.aligned).toBe(false);
    expect(result.mismatches.some((m) => m.kind === "role_permission_extra")).toBe(true);
  });

  it("detects owner-exclusive assigned to admin", () => {
    const canonical = buildCanonicalRBACCatalogSnapshot();
    const drifted = buildRBACCatalogSnapshot(
      "client",
      {
        ...ROLE_PERMISSIONS,
        admin: [...ROLE_PERMISSIONS.admin, "security:manage_owners"],
      },
      OWNER_EXCLUSIVE_PERMISSIONS,
    );

    const result = compareRBACCatalogSnapshots(canonical, drifted);
    expect(result.aligned).toBe(false);
    expect(
      result.mismatches.some((m) => m.kind === "owner_exclusive_on_non_owner"),
    ).toBe(true);
  });

  it("detects unknown role", () => {
    const canonical = buildCanonicalRBACCatalogSnapshot();
    const drifted = buildRBACCatalogSnapshot(
      "edge",
      {
        ...ROLE_PERMISSIONS,
        superuser: ["platform:view"],
      },
      OWNER_EXCLUSIVE_PERMISSIONS,
    );

    const result = compareRBACCatalogSnapshots(canonical, drifted);
    expect(result.aligned).toBe(false);
    expect(result.mismatches.some((m) => m.kind === "unknown_role")).toBe(true);
  });

  it("detects incomplete SQL seed", () => {
    const canonical = buildCanonicalRBACCatalogSnapshot();
    const incompleteSql = `
      INSERT INTO public.operator_role_permissions (role, permission, description) VALUES
        ('owner', 'platform:view', 'Visualizar plataforma')
      ON CONFLICT (role, permission) DO NOTHING;
    `;

    const snapshot = parseSqlPermissionSeed(incompleteSql);
    const result = compareRBACCatalogSnapshots(canonical, snapshot);

    expect(result.aligned).toBe(false);
    expect(result.mismatches.some((m) => m.kind === "role_permission_missing")).toBe(true);
  });

  it("Edge catalog matches canonical when parsed from repository file", () => {
    const canonical = buildCanonicalRBACCatalogSnapshot();
    const edgePath = join(repoRoot, EDGE_PERMISSION_CATALOG_FILE);
    const content = readFileSync(edgePath, "utf8");
    const edge = parseEdgePermissionCatalog(content);

    expect(compareRBACCatalogSnapshots(canonical, edge).aligned).toBe(true);
  });
});
