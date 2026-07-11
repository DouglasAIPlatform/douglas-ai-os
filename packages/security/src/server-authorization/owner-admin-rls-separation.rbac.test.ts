import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import {
  OWNER_ADMIN_RLS_MIGRATION_FILE,
  REQUIRED_OWNER_ADMIN_RLS_HELPERS,
  verifyAuditInsertStillDenied,
  verifyOwnerAdminRlsMigrationSql,
} from "./OwnerAdminRlsVerification";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..", "..", "..", "..");

describe("Owner/Admin RLS separation (Sprint 5.45)", () => {
  it("migration passes static verification", () => {
    const report = verifyOwnerAdminRlsMigrationSql(repoRoot);
    expect(report.valid).toBe(true);
    expect(report.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("does not group owner and admin in has_platform_role for profile mutations", () => {
    const path = join(repoRoot, "supabase", "migrations", OWNER_ADMIN_RLS_MIGRATION_FILE);
    const content = readFileSync(path, "utf8");

    expect(content).not.toMatch(
      /has_platform_role\s*\(\s*ARRAY\s*\[\s*'owner'\s*,\s*'admin'\s*\]\s*\)/i,
    );
  });

  it("admin insert/update restricts roles to operator and viewer", () => {
    const report = verifyOwnerAdminRlsMigrationSql(repoRoot);
    expect(report.issues.some((i) => i.code === "admin_can_promote_owner")).toBe(false);
    expect(report.issues.some((i) => i.code === "admin_owner_role_grant")).toBe(false);
  });

  it("owner promotion requires can_promote_to_owner", () => {
    const path = join(repoRoot, "supabase", "migrations", OWNER_ADMIN_RLS_MIGRATION_FILE);
    const content = readFileSync(path, "utf8");

    expect(content).toContain("can_promote_to_owner()");
    expect(content).toContain("security:manage_owners");
  });

  it("administrative policies require active profile helpers", () => {
    const path = join(repoRoot, "supabase", "migrations", OWNER_ADMIN_RLS_MIGRATION_FILE);
    const content = readFileSync(path, "utf8");

    for (const helper of REQUIRED_OWNER_ADMIN_RLS_HELPERS) {
      expect(content).toContain(helper);
    }
  });

  it("audit INSERT remains denied for authenticated in base migration", () => {
    expect(verifyAuditInsertStillDenied(repoRoot)).toBe(true);
  });

  it("no permissive USING(true) or anon grants in RLS migration", () => {
    const path = join(repoRoot, "supabase", "migrations", OWNER_ADMIN_RLS_MIGRATION_FILE);
    const content = readFileSync(path, "utf8").toLowerCase();

    expect(content).not.toMatch(/using\s*\(\s*true\s*\)/);
    expect(content).not.toMatch(/with check\s*\(\s*true\s*\)/);
    expect(content).not.toMatch(/grant\s+[\s\S]*?\s+to\s+anon\b/);
  });
});
