import { describe, expect, it } from "vitest";
import { ROLE_PERMISSIONS } from "./Permission";
import { createPermissionGuard } from "./PermissionGuard";
import { isMockRoleChangeAllowed } from "./isMockRoleChangeAllowed";
import { MOCK_OPERATORS } from "./SecurityTypes";
import {
  OWNER_EXCLUSIVE_PERMISSIONS,
  RBAC_PERMISSION_MATRIX,
  securedActionsFromMatrix,
} from "./rbac-verification/RBACPermissionMatrix";
import {
  buildRBACVerificationCases,
  formatRBACVerificationReport,
  runRBACVerification,
} from "./rbac-verification/RBACVerificationRunner";

describe("RBAC verification suite (@douglas/security)", () => {
  it("runs full verification report with zero failures", () => {
    const report = runRBACVerification();
    expect(report.status).toBe("passed");
    expect(report.failedCount).toBe(0);
    expect(report.totalCases).toBeGreaterThan(0);
  });

  it("matrix is derived from ROLE_PERMISSIONS catalog", () => {
    for (const entry of RBAC_PERMISSION_MATRIX) {
      for (const role of entry.rolesAllowed) {
        expect(ROLE_PERMISSIONS[role]).toContain(entry.permission);
      }
    }
  });

  describe("OWNER", () => {
    const guard = createPermissionGuard();
    const owner = MOCK_OPERATORS.owner;

    it("has all catalog permissions", () => {
      expect(ROLE_PERMISSIONS.owner).toHaveLength(6);
    });

    it("allows all secured runtime actions with confirmation on sensitive ones", () => {
      for (const action of securedActionsFromMatrix()) {
        const result = guard.evaluate(owner, action);
        expect(result.allowed).toBe(true);
        if (["pause_module", "resume_module", "restart_module"].includes(action)) {
          expect(result.requiresConfirmation).toBe(true);
        }
      }
    });
  });

  describe("ADMIN", () => {
    const guard = createPermissionGuard();
    const admin = MOCK_OPERATORS.admin;

    it("matches owner permission set (no owner-exclusive permissions)", () => {
      expect(ROLE_PERMISSIONS.admin).toEqual(ROLE_PERMISSIONS.owner);
      expect(OWNER_EXCLUSIVE_PERMISSIONS).toEqual([]);
    });

    it("allows administrative runtime actions", () => {
      for (const action of ["pause_module", "resume_module", "restart_module"] as const) {
        expect(guard.evaluate(admin, action).allowed).toBe(true);
      }
    });
  });

  describe("OPERATOR", () => {
    const guard = createPermissionGuard();
    const operator = MOCK_OPERATORS.operator;

    it("allows refresh and health check only", () => {
      expect(guard.evaluate(operator, "refresh_module").allowed).toBe(true);
      expect(guard.evaluate(operator, "run_health_check").allowed).toBe(true);
    });

    it("blocks administrative runtime actions", () => {
      for (const action of ["pause_module", "resume_module", "restart_module"] as const) {
        const result = guard.evaluate(operator, action);
        expect(result.allowed).toBe(false);
        expect(result.blockedByPermission).toBe(true);
      }
    });
  });

  describe("VIEWER", () => {
    const guard = createPermissionGuard();
    const viewer = MOCK_OPERATORS.viewer;

    it("can view platform only", () => {
      expect(guard.canView(viewer)).toBe(true);
      expect(ROLE_PERMISSIONS.viewer).toEqual(["platform:view"]);
    });

    it("blocks all runtime actions", () => {
      for (const action of securedActionsFromMatrix()) {
        expect(guard.evaluate(viewer, action).allowed).toBe(false);
      }
    });
  });

  describe("mock role policy", () => {
    it("allows mock role change outside production", () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      expect(isMockRoleChangeAllowed()).toBe(true);
      process.env.NODE_ENV = previous;
    });

    it("blocks mock role change in production", () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      expect(isMockRoleChangeAllowed()).toBe(false);
      process.env.NODE_ENV = previous;
    });
  });

  it("builds deterministic case catalog", () => {
    const cases = buildRBACVerificationCases();
    const ids = cases.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(cases.length).toBeGreaterThanOrEqual(60);
  });

  it("formats report without throwing", () => {
    const report = runRBACVerification();
    expect(formatRBACVerificationReport(report)).toContain("RBAC Verification Suite");
  });
});
