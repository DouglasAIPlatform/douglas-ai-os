import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";
import {
  STAGING_ENVIRONMENT_PROFILE,
  evaluateStagingReadiness,
  assertStagingSnapshotSafe,
  buildStagingConfigurationSnapshot,
  isMockRoleChangeAllowedByEnvironment,
  isMocksAllowed,
  resolvePlatformEnvironment,
} from "../index";
import { runStagingReadinessCheck } from "./StagingReadinessRunner";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..", "..", "..", "..");

describe("Staging bootstrap (Sprint 5.47)", () => {
  it("staging blocks mocks and mock role change", () => {
    expect(STAGING_ENVIRONMENT_PROFILE.allowMocks).toBe(false);
    expect(STAGING_ENVIRONMENT_PROFILE.allowMockRoleChange).toBe(false);
    expect(
      isMocksAllowed({ env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "staging" } }),
    ).toBe(false);
    expect(
      isMockRoleChangeAllowedByEnvironment({
        env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "staging" },
      }),
    ).toBe(false);
  });

  it("staging requires real auth and active profile policy", () => {
    expect(STAGING_ENVIRONMENT_PROFILE.requireRealAuth).toBe(true);
    expect(STAGING_ENVIRONMENT_PROFILE.requireAuthProfile).toBe(true);
    expect(STAGING_ENVIRONMENT_PROFILE.requireEdgeFunctionAudit).toBe(true);
  });

  it("staging requires edge_function audit mode", () => {
    const report = evaluateStagingReadiness({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "staging" },
      supabaseUrlConfigured: true,
      anonKeyConfigured: true,
      runtime: { auditWriteMode: "edge_function" },
    });

    const auditCheck = report.checks.find((item) => item.id === "audit_edge_function");
    expect(auditCheck?.outcome).toBe("pass");
  });

  it("development remains functional with mocks allowed", () => {
    expect(
      isMocksAllowed({ env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "development" } }),
    ).toBe(true);
    expect(resolvePlatformEnvironment({ env: {} })).toBe("development");

    const report = evaluateStagingReadiness({ env: {} });
    expect(report.snapshot.effectiveEnvironment).toBe("development");
    expect(report.status).not.toBe("failed");
  });

  it("production is not inferred automatically", () => {
    expect(
      resolvePlatformEnvironment({
        env: { VERCEL_ENV: "production" },
      }),
    ).not.toBe("production");
  });

  it("snapshot never contains sensitive field names", () => {
    const snapshot = buildStagingConfigurationSnapshot({
      effectiveEnvironment: "staging",
      stagingDeclared: true,
      supabaseUrlConfigured: true,
      anonKeyConfigured: true,
      mocksBlocked: true,
      mockRoleBlocked: true,
      realAuthRequired: true,
      activeProfileRequired: true,
      auditWriteModeEdgeFunction: true,
      serverRbacExpected: true,
      migrationsSyncKnown: false,
      declaredExplicitly: true,
      hasCriticalMismatch: false,
    });

    expect(assertStagingSnapshotSafe(snapshot)).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain("eyJ");
  });

  it("staging:check does not modify repository files", () => {
    const envExamplePath = join(repoRoot, ".env.example");
    const before = readFileSync(envExamplePath, "utf8");
    runStagingReadinessCheck(repoRoot, { env: {} });
    const after = readFileSync(envExamplePath, "utf8");
    expect(after).toBe(before);
  });

  it("repo staging:check passes or has runtime checks pending", () => {
    const report = runStagingReadinessCheck(repoRoot, { env: {} });
    expect(["passed", "passed_with_runtime_checks_pending"]).toContain(report.status);
    expect(existsSync(join(repoRoot, "docs/operations/staging-bootstrap.md"))).toBe(true);
  });
});
