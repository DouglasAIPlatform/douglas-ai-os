import type { PlatformEnvironment } from "../PlatformEnvironment";

export type VercelEnvValue = "development" | "preview" | "production";

const VERCEL_ENV_VALUES: readonly VercelEnvValue[] = ["development", "preview", "production"];

export function readVercelEnv(
  env: NodeJS.ProcessEnv = process.env,
): VercelEnvValue | null {
  const raw = env.VERCEL_ENV?.trim();
  if (!raw) {
    return null;
  }
  return (VERCEL_ENV_VALUES as readonly string[]).includes(raw)
    ? (raw as VercelEnvValue)
    : null;
}

/**
 * Mapeia VERCEL_ENV para hint de PlatformEnvironment.
 * preview → staging (nunca production).
 */
export function vercelEnvToPlatformHint(
  vercelEnv: VercelEnvValue | null,
): PlatformEnvironment | null {
  if (!vercelEnv) {
    return null;
  }
  switch (vercelEnv) {
    case "development":
      return "development";
    case "preview":
      return "staging";
    case "production":
      return "production";
    default:
      return null;
  }
}

/** preview nunca implica production operacional. */
export function isVercelPreview(vercelEnv: VercelEnvValue | null): boolean {
  return vercelEnv === "preview";
}

export function isVercelProduction(vercelEnv: VercelEnvValue | null): boolean {
  return vercelEnv === "production";
}
