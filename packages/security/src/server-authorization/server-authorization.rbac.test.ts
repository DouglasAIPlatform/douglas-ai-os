import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ROLE_PERMISSIONS } from "../Permission";
import {
  assertServerCatalogAlignedWithClient,
  canIngestAuditRemotely,
  getServerRolePermissions,
  roleHasOwnerExclusiveServerPermission,
  serverRoleHasPermission,
} from "./ServerPermissionCatalog";
import {
  buildOperatorAuthorizationSnapshot,
  evaluateAuditIngestServerAuthorization,
  evaluateServerPermission,
} from "./ServerAuthorizationEvaluator";
import {
  verifyAllRbacMigrations,
  verifyServerRbacMigrationSql,
} from "./ServerRbacSqlVerification";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..", "..", "..", "..");

describe("Server-side RBAC (@douglas/security)", () => {
  it("server catalog aligned with client ROLE_PERMISSIONS", () => {
    expect(assertServerCatalogAlignedWithClient()).toBe(true);
  });

  it("viewer has platform:view only", () => {
    expect(getServerRolePermissions("viewer")).toEqual(["platform:view"]);
    expect(serverRoleHasPermission("viewer", "runtime:refresh")).toBe(false);
  });

  it("operator aligned with client catalog", () => {
    expect(getServerRolePermissions("operator")).toEqual(ROLE_PERMISSIONS.operator);
    expect(serverRoleHasPermission("operator", "runtime:pause")).toBe(false);
    expect(serverRoleHasPermission("operator", "runtime:refresh")).toBe(true);
  });

  it("owner and admin differ — admin lacks owner-exclusive permissions", () => {
    expect(getServerRolePermissions("owner").length).toBeGreaterThan(
      getServerRolePermissions("admin").length,
    );
    expect(serverRoleHasPermission("admin", "security:manage_roles")).toBe(false);
    expect(serverRoleHasPermission("owner", "security:manage_roles")).toBe(true);
    expect(roleHasOwnerExclusiveServerPermission("admin")).toBe(false);
  });

  it("blocks inactive profile for server permission", () => {
    const decision = evaluateServerPermission({
      userId: "user-1",
      profileId: "prof-1",
      role: "operator",
      status: "suspended",
      resolvedFromProfile: true,
      permission: "runtime:refresh",
    });
    expect(decision.outcome).toBe("deny");
    expect(decision.reason).toBe("profile_inactive");
  });

  it("viewer denied audit ingest remotely", () => {
    expect(canIngestAuditRemotely("viewer")).toBe(false);
    const decision = evaluateAuditIngestServerAuthorization({
      userId: "user-1",
      profileId: "prof-1",
      role: "viewer",
      status: "active",
      resolvedFromProfile: true,
      payloadRole: "admin",
    });
    expect(decision.outcome).toBe("deny");
    expect(decision.reason).toBe("role_not_allowed");
  });

  it("operator allowed audit ingest via server profile", () => {
    const decision = evaluateAuditIngestServerAuthorization({
      userId: "user-1",
      profileId: "prof-1",
      role: "operator",
      status: "active",
      resolvedFromProfile: true,
    });
    expect(decision.outcome).toBe("allow");
  });

  it("never trusts payload role without profile", () => {
    const decision = evaluateAuditIngestServerAuthorization({
      userId: "user-1",
      profileId: null,
      role: null,
      status: null,
      resolvedFromProfile: false,
      payloadRole: "owner",
    });
    expect(decision.outcome).toBe("deny");
    expect(decision.reason).toBe("profile_not_found");
  });

  it("builds operator authorization snapshot", () => {
    const snapshot = buildOperatorAuthorizationSnapshot({
      userId: "u1",
      profileId: "p1",
      role: "admin",
      status: "active",
      resolvedFromProfile: true,
    });
    expect(snapshot.active).toBe(true);
    expect(snapshot.canIngestAuditRemotely).toBe(true);
    expect(snapshot.permissions).toContain("runtime:pause");
  });
});

describe("Server RBAC SQL verification (static)", () => {
  it("server rbac migration contains required helpers", () => {
    const report = verifyServerRbacMigrationSql(repoRoot);
    expect(report.valid).toBe(true);
    for (const helper of ["current_operator_profile", "operator_has_permission", "require_active_operator"]) {
      expect(report.issues.some((i) => i.code === "helper_missing" && i.message.includes(helper))).toBe(
        false,
      );
    }
  });

  it("migrations use auth.uid and deny anon insert on audit", () => {
    const reports = verifyAllRbacMigrations(repoRoot);
    expect(reports.every((r) => r.valid)).toBe(true);
  });
});
