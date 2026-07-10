/** Origem detectada na resolução de ambiente — valores seguros para UI/logs. */
export type EnvironmentSource =
  | "dos_public"
  | "dos_server"
  | "vercel_env"
  | "node_env"
  | "default";

export type EnvironmentSourceRole = "canonical" | "secondary" | "hint";

export const ENVIRONMENT_SOURCE_LABELS: Record<EnvironmentSource, string> = {
  dos_public: "NEXT_PUBLIC_DOS_ENVIRONMENT",
  dos_server: "DOS_ENVIRONMENT",
  vercel_env: "VERCEL_ENV",
  node_env: "NODE_ENV",
  default: "default",
};

/** Variável server-side opcional (deploy) — nunca exposta ao browser. */
export const SERVER_ENVIRONMENT_VAR = "DOS_ENVIRONMENT";
