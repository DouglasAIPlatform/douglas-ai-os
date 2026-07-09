export type SupabaseEnvironment = "local" | "preview" | "production" | "unknown";

export const SUPABASE_ENVIRONMENT_LABELS: Record<SupabaseEnvironment, string> = {
  local: "Local",
  preview: "Preview (Vercel)",
  production: "Produção",
  unknown: "Desconhecido",
};

export function resolveSupabaseEnvironment(): SupabaseEnvironment {
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  if (process.env.NODE_ENV === "development") return "local";
  if (process.env.NODE_ENV === "production") return "production";

  return "unknown";
}
