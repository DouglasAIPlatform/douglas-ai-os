import type { PlatformEnvironment } from "../PlatformEnvironment";
import type { EnvironmentResolution } from "../EnvironmentResolution";
import { readVercelEnv } from "./VercelEnvAdapter";

/** Compat: SupabaseEnvironment legado (local/preview/production/unknown). */
export type LegacySupabaseEnvironment = "local" | "preview" | "production" | "unknown";

export function platformToLegacySupabaseEnvironment(
  resolution: EnvironmentResolution,
  env: NodeJS.ProcessEnv = process.env,
): LegacySupabaseEnvironment {
  const vercel = readVercelEnv(env);

  switch (resolution.canonical) {
    case "development":
      return "local";
    case "staging":
      return vercel === "preview" ? "preview" : "unknown";
    case "production":
      return "production";
    default:
      return "unknown";
  }
}

/** Hint legado → PlatformEnvironment (não canônico). */
export function legacySupabaseEnvironmentToPlatformHint(
  supabaseEnv: LegacySupabaseEnvironment,
): PlatformEnvironment | null {
  switch (supabaseEnv) {
    case "local":
      return "development";
    case "preview":
      return "staging";
    case "production":
      return "production";
    default:
      return null;
  }
}

export function legacySupabaseEnvironmentLabel(
  supabaseEnv: LegacySupabaseEnvironment,
): string {
  switch (supabaseEnv) {
    case "local":
      return "Local";
    case "preview":
      return "Preview (Vercel)";
    case "production":
      return "Produção";
    default:
      return "Desconhecido";
  }
}
