import {
  platformToLegacySupabaseEnvironment,
  resolveCanonicalEnvironment,
} from "@douglas/environment";

export type SupabaseEnvironment = "local" | "preview" | "production" | "unknown";

export const SUPABASE_ENVIRONMENT_LABELS: Record<SupabaseEnvironment, string> = {
  local: "Local",
  preview: "Preview (Vercel)",
  production: "Produção",
  unknown: "Desconhecido",
};

/**
 * Resolve ambiente Supabase legado — delega ao resolver canônico (@douglas/environment).
 * Não usa VERCEL_ENV como fonte independente de verdade.
 */
export function resolveSupabaseEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseEnvironment {
  const resolution = resolveCanonicalEnvironment({ env });
  return platformToLegacySupabaseEnvironment(resolution, env);
}

/** @deprecated Use resolveCanonicalEnvironment via @douglas/environment */
export function resolveSupabaseEnvironmentLegacy(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseEnvironment {
  const vercelEnv = env.VERCEL_ENV;

  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  if (env.NODE_ENV === "development") return "local";
  if (env.NODE_ENV === "production") return "production";

  return "unknown";
}
