import { describe, expect, it } from "vitest";
import {
  buildEnvironmentCompatibilityReport,
  ENVIRONMENT_PROFILES,
  platformToLegacySupabaseEnvironment,
  resolveCanonicalEnvironment,
  resolveEnvironmentConfig,
  resolvePlatformEnvironment,
  validateEnvironmentConfig,
} from "./index";

describe("Canonical environment resolution (Sprint 5.41)", () => {
  it("defaults to development when DOS variable is absent", () => {
    const resolution = resolveCanonicalEnvironment({ env: {} });
    expect(resolution.canonical).toBe("development");
    expect(resolution.effectiveEnvironment).toBe("development");
    expect(resolution.declaredExplicitly).toBe(false);
    expect(resolution.productionExplicitlyDeclared).toBe(false);
  });

  it("resolves development explicitly", () => {
    const resolution = resolveCanonicalEnvironment({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "development" },
    });
    expect(resolution.canonical).toBe("development");
    expect(resolution.declaredExplicitly).toBe(true);
    expect(ENVIRONMENT_PROFILES.development.allowMocks).toBe(true);
  });

  it("resolves staging explicitly", () => {
    const resolution = resolveCanonicalEnvironment({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "staging" },
    });
    expect(resolution.canonical).toBe("staging");
    expect(resolution.releaseChannel).toBe("staging");
    expect(ENVIRONMENT_PROFILES.staging.allowMocks).toBe(false);
  });

  it("resolves production only with explicit DOS", () => {
    const resolution = resolveCanonicalEnvironment({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "production" },
    });
    expect(resolution.canonical).toBe("production");
    expect(resolution.productionExplicitlyDeclared).toBe(true);
  });

  it("aligns VERCEL_ENV preview with DOS staging (no critical mismatch)", () => {
    const resolution = resolveCanonicalEnvironment({
      env: {
        NEXT_PUBLIC_DOS_ENVIRONMENT: "staging",
        VERCEL_ENV: "preview",
      },
    });
    expect(resolution.canonical).toBe("staging");
    expect(resolution.hasCriticalMismatch).toBe(false);
    const report = buildEnvironmentCompatibilityReport(resolution);
    expect(report.compatible).toBe(true);
  });

  it("flags critical mismatch when VERCEL production conflicts with DOS staging", () => {
    const resolution = resolveCanonicalEnvironment({
      env: {
        NEXT_PUBLIC_DOS_ENVIRONMENT: "staging",
        VERCEL_ENV: "production",
      },
    });
    expect(resolution.canonical).toBe("staging");
    expect(resolution.hasCriticalMismatch).toBe(true);
    expect(resolution.mismatches.some((m) => m.code === "vercel_production_dos_mismatch")).toBe(
      true,
    );
  });

  it("invalid DOS value falls back to development with warning", () => {
    const resolution = resolveCanonicalEnvironment({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "invalid-env" },
    });
    expect(resolution.canonical).toBe("development");
    expect(resolution.warnings.length).toBeGreaterThan(0);
    const config = resolveEnvironmentConfig({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "invalid-env" },
    });
    expect(config.name).toBe("development");
  });

  it("never promotes to production from VERCEL_ENV alone", () => {
    const resolution = resolveCanonicalEnvironment({
      env: { VERCEL_ENV: "production" },
    });
    expect(resolution.canonical).toBe("development");
    expect(resolution.productionExplicitlyDeclared).toBe(false);
  });

  it("never promotes preview to production automatically", () => {
    const resolution = resolveCanonicalEnvironment({
      env: {
        NEXT_PUBLIC_DOS_ENVIRONMENT: "production",
        VERCEL_ENV: "preview",
      },
    });
    expect(resolution.hasCriticalMismatch).toBe(true);
    expect(
      resolution.mismatches.some((m) => m.code === "vercel_preview_dos_production"),
    ).toBe(true);
  });

  it("legacy supabase mapping follows canonical environment", () => {
    const devResolution = resolveCanonicalEnvironment({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "development" },
    });
    expect(platformToLegacySupabaseEnvironment(devResolution, {})).toBe("local");

    const stagingPreview = resolveCanonicalEnvironment({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "staging", VERCEL_ENV: "preview" },
    });
    expect(
      platformToLegacySupabaseEnvironment(stagingPreview, {
        VERCEL_ENV: "preview",
      }),
    ).toBe("preview");

    const prodResolution = resolveCanonicalEnvironment({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "production", VERCEL_ENV: "production" },
    });
    expect(
      platformToLegacySupabaseEnvironment(prodResolution, {
        VERCEL_ENV: "production",
      }),
    ).toBe("production");
  });

  it("platformToLegacySupabaseEnvironment maps staging without vercel to unknown", () => {
    const resolution = resolveCanonicalEnvironment({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "staging" },
    });
    expect(platformToLegacySupabaseEnvironment(resolution, {})).toBe("unknown");
  });

  it("validateEnvironmentConfig rejects mock operator in staging", () => {
    const config = resolveEnvironmentConfig({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "staging" },
    });
    const result = validateEnvironmentConfig(config, {
      isUsingMockOperator: true,
    }, { env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "staging" } });
    expect(result.valid).toBe(false);
  });

  it("resolvePlatformEnvironment matches canonical effective environment", () => {
    expect(
      resolvePlatformEnvironment({
        env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "staging" },
      }),
    ).toBe("staging");
  });
});
