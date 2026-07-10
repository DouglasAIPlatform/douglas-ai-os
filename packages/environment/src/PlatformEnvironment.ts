import type { CoreEnvironmentName } from "@douglas/core";

/** Ambientes oficiais da Douglas AI Platform (Sprint 5.39). */
export type PlatformEnvironment = CoreEnvironmentName;

export const PLATFORM_ENVIRONMENTS = [
  "development",
  "staging",
  "production",
] as const satisfies readonly PlatformEnvironment[];

export const PLATFORM_ENVIRONMENT_LABELS: Record<PlatformEnvironment, string> = {
  development: "Development",
  staging: "Staging",
  production: "Production",
};

export const PLATFORM_ENVIRONMENT_VAR = "NEXT_PUBLIC_DOS_ENVIRONMENT";

export function isPlatformEnvironment(value: string): value is PlatformEnvironment {
  return (PLATFORM_ENVIRONMENTS as readonly string[]).includes(value);
}
