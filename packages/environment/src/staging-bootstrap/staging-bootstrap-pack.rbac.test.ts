import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import {
  STAGING_TARGET_MANIFEST,
  assertStagingTargetManifestSafe,
  evaluateStagingSafetyGate,
  evaluateStagingReadiness,
  resolveStagingReadinessDimensions,
  resolvePlatformEnvironment,
  buildStagingBootstrapPlan,
} from "../index";
import { runStagingBootstrapPlan } from "./StagingBootstrapPlanRunner";
import { runStagingReadinessCheck } from "./StagingReadinessRunner";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..", "..", "..", "..");

describe("Staging bootstrap pack (Sprint 5.53)", () => {
  it("manifest não contém secrets", () => {
    expect(assertStagingTargetManifestSafe(STAGING_TARGET_MANIFEST)).toBe(true);
    expect(STAGING_TARGET_MANIFEST.requireSeparateSupabaseProject).toBe(true);
    expect(STAGING_TARGET_MANIFEST.requireRemoteMissionPersistence).toBe(true);

    const json = JSON.stringify(STAGING_TARGET_MANIFEST);
    expect(json).not.toMatch(/supabase\.co/i);
    expect(json).not.toContain("eyJ");
  });

  it("staging exige projeto separado", () => {
    const checks = evaluateStagingSafetyGate({
      effectiveEnvironment: "staging",
      supabaseConfigured: false,
      dosEnvironmentExplicit: true,
      mocksAllowed: false,
      mockRoleAllowed: false,
    });

    const separate = checks.find((item) => item.id === "separate_supabase_project");
    expect(separate?.outcome).not.toBe("pass");
  });

  it("status não avança para ready sem runtime", () => {
    const report = evaluateStagingReadiness({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "staging" },
      supabaseUrlConfigured: true,
      anonKeyConfigured: true,
    });

    expect(report.finalStatus).not.toBe("ready");
    expect(report.dimensions.runtimeValidated).toBe(false);
  });

  it("development continua funcional", () => {
    const report = evaluateStagingReadiness({ env: {} });
    expect(report.snapshot.effectiveEnvironment).toBe("development");
    expect(report.status).not.toBe("failed");
    expect(resolvePlatformEnvironment({ env: {} })).toBe("development");
  });

  it("production nunca é usado como fallback", () => {
    expect(
      resolvePlatformEnvironment({ env: { VERCEL_ENV: "production" } }),
    ).not.toBe("production");
  });

  it("bootstrap plan é read-only", () => {
    const envExample = join(repoRoot, ".env.example");
    const before = readFileSync(envExample, "utf8");
    const report = runStagingBootstrapPlan(repoRoot);
    const after = readFileSync(envExample, "utf8");

    expect(after).toBe(before);
    expect(report.plan.readOnly).toBe(true);
    expect(report.plan.steps.length).toBeGreaterThanOrEqual(12);
  });

  it("env templates usam placeholders", () => {
    const stagingExample = join(repoRoot, "apps/headquarters/.env.staging.example");
    expect(existsSync(stagingExample)).toBe(true);

    const content = readFileSync(stagingExample, "utf8");
    expect(content).toContain("NEXT_PUBLIC_DOS_ENVIRONMENT=staging");
    expect(content).toContain("NEXT_PUBLIC_SUPABASE_URL=");
    expect(content).not.toMatch(/https:\/\/[a-z0-9]+\.supabase\.co/i);
  });

  it(".env.staging.local não pode ser versionado", () => {
    const gitignore = readFileSync(join(repoRoot, ".gitignore"), "utf8");
    expect(gitignore).toContain(".env.*.local");
  });

  it("checks desconhecidos não são considerados aprovados", () => {
    const checks = evaluateStagingSafetyGate({
      effectiveEnvironment: "staging",
      supabaseConfigured: true,
      dosEnvironmentExplicit: true,
      mocksAllowed: false,
      mockRoleAllowed: false,
    });

    const pending = checks.filter((item) => item.outcome === "pending");
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((item) => item.outcome !== "pass")).toBe(true);
  });

  it("dimensions diferenciam codebase de runtime", () => {
    const dimensions = resolveStagingReadinessDimensions({
      snapshot: {
        effectiveEnvironment: "development",
        stagingDeclared: false,
        supabaseUrlConfigured: false,
        anonKeyConfigured: false,
        supabaseConfigured: false,
        mocksBlocked: true,
        mockRoleBlocked: true,
        realAuthRequired: true,
        activeProfileRequired: true,
        auditWriteModeEdgeFunction: true,
        serverRbacExpected: true,
        migrationsSyncKnown: false,
        declaredExplicitly: false,
        hasCriticalMismatch: false,
        bootstrapStatus: "not_configured",
      },
      checks: [],
      codebasePrepared: true,
      envTemplatesPresent: true,
    });

    expect(dimensions.codebasePrepared).toBe(true);
    expect(dimensions.remoteProjectConfigured).toBe("unknown");
    expect(dimensions.finalStatus).toBe("configuration_prepared");
  });

  it("buildStagingBootstrapPlan marca etapas runtime", () => {
    const plan = buildStagingBootstrapPlan({ codebasePrepared: true, envTemplatesPresent: true });
    const runtimeSteps = plan.steps.filter((step) => step.status === "runtime_only");
    expect(runtimeSteps.length).toBeGreaterThan(0);
  });

  it("staging:check report inclui dimensions", () => {
    const report = runStagingReadinessCheck(repoRoot, { env: {} });
    expect(report.dimensions).toBeDefined();
    expect(report.finalStatus).toBeDefined();
    expect(report.finalStatus).not.toBe("ready");
  });
});
