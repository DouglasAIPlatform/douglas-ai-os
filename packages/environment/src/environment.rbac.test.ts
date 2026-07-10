import { describe, expect, it } from "vitest";
import {
  ENVIRONMENT_PROFILES,
  isMockRoleChangeAllowedByEnvironment,
  isMocksAllowed,
  resolveEnvironmentConfig,
  resolvePlatformEnvironment,
  validateEnvironmentConfig,
} from "./index";

describe("@douglas/environment", () => {
  it("defaults to development when env var is absent", () => {
    const config = resolveEnvironmentConfig({ env: {} });
    expect(config.name).toBe("development");
    expect(config.declaredExplicitly).toBe(false);
  });

  it("resolves staging and production from NEXT_PUBLIC_DOS_ENVIRONMENT", () => {
    expect(
      resolvePlatformEnvironment({
        env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "staging" },
      }),
    ).toBe("staging");
    expect(
      resolvePlatformEnvironment({
        env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "production" },
      }),
    ).toBe("production");
  });

  it("falls back to development on invalid value", () => {
    const config = resolveEnvironmentConfig({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "invalid-env" },
    });
    expect(config.name).toBe("development");
    expect(config.rawEnvironmentValue).toBe("invalid-env");
  });

  it("production policy disables mocks", () => {
    expect(ENVIRONMENT_PROFILES.production.allowMocks).toBe(false);
    expect(ENVIRONMENT_PROFILES.production.allowMockRoleChange).toBe(false);
    expect(
      isMocksAllowed({ env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "production" } }),
    ).toBe(false);
    expect(
      isMockRoleChangeAllowedByEnvironment({
        env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "production" },
      }),
    ).toBe(false);
  });

  it("development policy allows mocks", () => {
    expect(ENVIRONMENT_PROFILES.development.allowMocks).toBe(true);
    expect(isMocksAllowed({ env: {} })).toBe(true);
  });

  it("flags incompatible mock operator in staging", () => {
    const config = resolveEnvironmentConfig({
      env: { NEXT_PUBLIC_DOS_ENVIRONMENT: "staging" },
    });
    const result = validateEnvironmentConfig(config, {
      isUsingMockOperator: true,
      mockRoleChangeAllowed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.safety.compatible).toBe(false);
  });
});
