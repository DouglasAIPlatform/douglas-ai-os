import { buildEnvironmentConfig, type EnvironmentConfig } from "./EnvironmentConfig";
import { getEnvironmentProfile } from "./EnvironmentProfile";
import { resolveCanonicalEnvironment } from "./CanonicalEnvironmentResolver";
import {
  isPlatformEnvironment,
  PLATFORM_ENVIRONMENT_VAR,
  type PlatformEnvironment,
} from "./PlatformEnvironment";

const DEFAULT_PLATFORM_ENVIRONMENT: PlatformEnvironment = "development";

function readRawEnvironmentValue(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const raw = env[PLATFORM_ENVIRONMENT_VAR]?.trim();
  return raw && raw.length > 0 ? raw : null;
}

export interface ResolveEnvironmentConfigOptions {
  env?: NodeJS.ProcessEnv;
}

/** Resolve ambiente efetivo — delega ao resolver canônico. */
export function resolvePlatformEnvironment(
  options: ResolveEnvironmentConfigOptions = {},
): PlatformEnvironment {
  return resolveCanonicalEnvironment(options).effectiveEnvironment;
}

export function resolveEnvironmentConfig(
  options: ResolveEnvironmentConfigOptions = {},
): EnvironmentConfig {
  const env = options.env ?? process.env;
  const resolution = resolveCanonicalEnvironment({ env });
  const raw = readRawEnvironmentValue(env);

  if (raw && isPlatformEnvironment(raw)) {
    return buildEnvironmentConfig({
      name: raw,
      declaredExplicitly: true,
      rawEnvironmentValue: raw,
    });
  }

  return buildEnvironmentConfig({
    name: resolution.effectiveEnvironment ?? DEFAULT_PLATFORM_ENVIRONMENT,
    declaredExplicitly: resolution.declaredExplicitly,
    rawEnvironmentValue: raw,
  });
}

export function resolvePlatformEnvironmentProfile(
  options?: ResolveEnvironmentConfigOptions,
): EnvironmentConfig["profile"] {
  return getEnvironmentProfile(resolvePlatformEnvironment(options));
}

export function toDemoDataMode(
  platformEnvironment: PlatformEnvironment,
): "development" | "production" {
  return platformEnvironment === "development" ? "development" : "production";
}

export function resolveDemoDataModeFromEnvironment(
  options?: ResolveEnvironmentConfigOptions,
): "development" | "production" {
  return toDemoDataMode(resolvePlatformEnvironment(options));
}

export function isMocksAllowed(options?: ResolveEnvironmentConfigOptions): boolean {
  return resolvePlatformEnvironmentProfile(options).allowMocks;
}

export function isMockRoleChangeAllowedByEnvironment(
  options?: ResolveEnvironmentConfigOptions,
): boolean {
  return resolvePlatformEnvironmentProfile(options).allowMockRoleChange;
}
