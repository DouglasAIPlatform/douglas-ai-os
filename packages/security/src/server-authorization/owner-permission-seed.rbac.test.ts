import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { OWNER_EXCLUSIVE_PERMISSIONS } from "../Permission";
import {
  OWNER_PERMISSION_SEED_MIGRATION_FILE,
  REQUIRED_OWNER_SEED_PERMISSIONS,
  verifyOwnerPermissionSeedMigrationSql,
} from "./OwnerPermissionSeedVerification";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..", "..", "..", "..");

describe("Owner permission seed migration (Sprint 5.44)", () => {
  it("migration file exists and passes static verification", () => {
    const report = verifyOwnerPermissionSeedMigrationSql(repoRoot);
    expect(report.valid).toBe(true);
    expect(report.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("registers all four owner-exclusive permissions aligned with Permission.ts catalog", () => {
    expect(REQUIRED_OWNER_SEED_PERMISSIONS).toEqual(OWNER_EXCLUSIVE_PERMISSIONS);
    expect(REQUIRED_OWNER_SEED_PERMISSIONS).toHaveLength(4);

    const path = join(repoRoot, "supabase", "migrations", OWNER_PERMISSION_SEED_MIGRATION_FILE);
    const content = readFileSync(path, "utf8");

    for (const permission of REQUIRED_OWNER_SEED_PERMISSIONS) {
      expect(content).toContain(permission);
    }
  });

  it("associates owner-exclusive permissions only with owner role in INSERT", () => {
    const path = join(repoRoot, "supabase", "migrations", OWNER_PERMISSION_SEED_MIGRATION_FILE);
    const content = readFileSync(path, "utf8");

    for (const permission of REQUIRED_OWNER_SEED_PERMISSIONS) {
      expect(content).toMatch(new RegExp(`\\('owner',\\s*'${permission}'`, "i"));
      expect(content).not.toMatch(new RegExp(`\\('admin',\\s*'${permission}'`, "i"));
      expect(content).not.toMatch(new RegExp(`\\('operator',\\s*'${permission}'`, "i"));
      expect(content).not.toMatch(new RegExp(`\\('viewer',\\s*'${permission}'`, "i"));
    }
  });

  it("admin does not receive security:manage_owners or release:approve_production", () => {
    const path = join(repoRoot, "supabase", "migrations", OWNER_PERMISSION_SEED_MIGRATION_FILE);
    const content = readFileSync(path, "utf8");

    expect(content).not.toMatch(/'admin',\s*'security:manage_owners'/);
    expect(content).not.toMatch(/'admin',\s*'release:approve_production'/);
  });

  it("uses idempotent ON CONFLICT on primary key", () => {
    const path = join(repoRoot, "supabase", "migrations", OWNER_PERMISSION_SEED_MIGRATION_FILE);
    const content = readFileSync(path, "utf8").toLowerCase();

    expect(content).toContain("on conflict (role, permission)");
    expect(content).toContain("do update");
  });

  it("does not grant permissions to anon", () => {
    const path = join(repoRoot, "supabase", "migrations", OWNER_PERMISSION_SEED_MIGRATION_FILE);
    const content = readFileSync(path, "utf8").toLowerCase();

    expect(content).not.toMatch(/to\s+anon[\s\S]*?using\s*\(\s*true\s*\)/);
    expect(content).not.toMatch(/^\s*grant\s+/m);
  });

  it("removes mistaken non-owner grants defensively", () => {
    const path = join(repoRoot, "supabase", "migrations", OWNER_PERMISSION_SEED_MIGRATION_FILE);
    const content = readFileSync(path, "utf8");

    expect(content).toContain("DELETE FROM public.operator_role_permissions");
    expect(content).toContain("role <> 'owner'");
  });
});
